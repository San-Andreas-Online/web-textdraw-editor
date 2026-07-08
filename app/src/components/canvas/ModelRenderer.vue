<template>
  <div class="model-renderer-wrap">
    <canvas ref="canvasEl" class="model-canvas" />
    <canvas ref="tintEl" class="model-tint-canvas" />
    <div v-if="loadState === 'loading'" class="model-overlay">
      <span class="model-loading-dot" />
    </div>
    <div v-else-if="loadState === 'error'" class="model-overlay model-error">
      <span>{{ errorMsg }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, shallowRef } from 'vue'
import { hexToRGBA } from '../../utils/colors'
import { SA_VEHICLES } from '../../constants/saVehicles'
import { SA_CAR_COLOURS } from '../../constants/saCarColours'
import { SA_SKINS, SA_OBJECTS, saModelsReady } from '../../constants/saModels'

const SA_VEHICLE_MODEL = Object.fromEntries(SA_VEHICLES.map(v => [v.id, v.model]))
const SA_SKIN_MODEL    = Object.fromEntries(SA_SKINS.map(s => [s.id, s.model]))

const TYPE_FALLBACK_ID = {
  vehicle: SA_VEHICLES[0]?.id ?? 411,
  skin:    SA_SKINS[0]?.id    ?? 0,
  object:  16442,
}


const props = defineProps({
  modelId:   { type: Number, default: 411 },
  modelType: { type: String, default: 'vehicle' }, // 'vehicle' | 'skin' | 'object'
  modelZoom: { type: Number, default: 1.0 },
  modelRotX: { type: Number, default: 0.0 },
  modelRotY: { type: Number, default: 0.0 },
  modelRotZ: { type: Number, default: 0.0 },
  modelColor1: { type: Number, default: 0},
  modelColor2: { type: Number, default: 0},
  width: { type: Number, default: 150},
  height: { type: Number, default: 100},
  zoom: { type: Number, default: 1},
  color: { type: Number, default: 0xFFFFFFFF },
  boxColor: { type: Number, default: 0x00000000 },
})

// ── State ────────────────────────────────────────────────────────────────────
const canvasEl = ref(null)
const tintEl = ref(null)
const loadState = ref('idle') // idle | loading | ready | error
const errorMsg = ref('')

// WebGL context + scene — stored in shallowRef so Vue doesn't deep-proxy them
const ctx = shallowRef(null) // { gl, programs, whitetex, camera, envFrame, state }
const scene = shallowRef(null) // { clump, modelinfo }

let rafId = null
let lastModelId = null

// ── API ──────────────────────────────────────────────────────────────────────
const API_BASE = 'https://gtaundergroundmod.com'
const API_TOKEN = 'eah6Y9WHe.Vq_hOWqX0NEFhU-yuPO3zVGZ_YYJjvgWe7nhATiuxsgMKhwpwWyp9w'
const TEX_BASE = `/api-proxy/resources/textures`
const MODEL_BASE = `${API_BASE}/resources/models`

async function fetchModel(modelName) {
  const fd = new FormData()
  fd.append('module', 'VehicleModel')
  fd.append('action', 'GetForPreviewer')
  fd.append('model', modelName)

  const res = await fetch(`/api-proxy/system/api/endpoint.php`, {
    method: 'POST',
    headers: { 'X-App-Auth-Token': API_TOKEN },
    body: fd,
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const text = await res.text()
  return JSON.parse(text)
}

// Fetch skin/object from open.mp CDN — returns flat frame array
async function fetchOpenMpModel(modelName)
{
  const res = await fetch(`https://assets.open.mp/models/exports/${modelName}.json`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Convert open.mp flat-frame JSON into the clump format rpClumpInit expects
function openMpToClump(frames)
{
  // Each entry: { name, parent, matrix[[r0c0..r0c3],[r1..],[r2..],[r3..]], geometry? }
  const clumpFrames = frames.map((f, i) => ({
    name:   f.name || `frame${i}`,
    parent: f.parent ?? -1,
    matrix: [
      f.matrix[0][0], f.matrix[0][1], f.matrix[0][2],
      f.matrix[1][0], f.matrix[1][1], f.matrix[1][2],
      f.matrix[2][0], f.matrix[2][1], f.matrix[2][2],
      f.matrix[3][0], f.matrix[3][1], f.matrix[3][2],
    ],
  }))

  const atomics = []
  frames.forEach((f, i) => {
    if (!f.geometry) return
    const geo = f.geometry
    // Build materials from textures array
    const materials = geo.textures.map(tex => ({
      color:             [255, 255, 255, 255],
      texture:           tex.name ? { name: tex.name } : null,
      surfaceProperties: [1, 0, 1],
      matfx:             null,
      specMap:           null,
      fxFlags:           0,
    }))

    // Build meshes: one per texture entry, grouping indices by texture slot
    const facetype   = geo.facetype        // 'Triangles' | 'Triangle_Strip'
    const meshtype   = facetype === 'Triangles' ? 0 : 1
    const numVerts   = geo.vertices.length
    const texcoords  = geo.texcoords

    // Group indices per texture slot from geo.textures[n].indices
    const meshes = geo.textures.map((tex, matIdx) => ({
      matId:   matIdx,
      indices: tex.indices,
    }))

    // Build morph target
    const vertices = geo.vertices.map(v => [v.x, v.y, v.z])
    const normals  = null // open.mp doesn't export separate normals
    const prelit   = geo.vertices.map(v => {
      if (v.color == null) return [255, 255, 255, 255]
      const c = v.color >>> 0
      return [(c >> 24) & 0xFF, (c >> 16) & 0xFF, (c >> 8) & 0xFF, c & 0xFF]
    })

    // Build texCoords array (one set)
    const uvSet = (texcoords || []).map(uv => [uv.uvx, uv.uvy])

    const geometry = {
      flags:        0x04 | (normals ? 0x10 : 0) | (prelit ? 0x08 : 0),
      meshtype,
      materials,
      meshes,
      morphTargets: [{ vertices, normals, }],
      prelit,
      texCoords:    uvSet.length ? [uvSet] : [],
    }

    atomics.push({ frame: i, geometry, matfx: false })
  })

  return { frames: clumpFrames, atomics }
}

// ── Shaders ──────────────────────────────────────────────────────────────────
const defaultVS = `
attribute vec3 in_pos;
attribute vec3 in_normal;
attribute vec4 in_color;
attribute vec2 in_tex0;
uniform mat4 u_world; uniform mat4 u_view; uniform mat4 u_proj;
uniform vec4 u_matColor; uniform vec4 u_surfaceProps;
uniform vec3 u_ambLight; uniform vec3 u_lightDir; uniform vec3 u_lightCol;
varying highp vec4 v_color; varying highp vec2 v_tex0;
void main() {
  gl_Position = u_proj * u_view * u_world * vec4(in_pos, 1.0);
  v_tex0 = in_tex0; v_color = in_color;
  v_color.rgb += u_ambLight * u_surfaceProps.x;
  vec3 N = mat3(u_world) * in_normal;
  float L = max(0.0, dot(N, -normalize(u_lightDir)));
  v_color.rgb += L * u_lightCol * u_surfaceProps.z;
  v_color = clamp(v_color, 0.0, 1.0);
  v_color *= u_matColor;
}`

const defaultFS = `
uniform sampler2D tex; uniform highp float u_alphaRef;
varying highp vec4 v_color; varying highp vec2 v_tex0;
void main() {
  gl_FragColor = v_color * texture2D(tex, v_tex0);
  if (gl_FragColor.a < u_alphaRef) discard;
}`

const envVS = `
attribute vec3 in_pos; attribute vec3 in_normal;
attribute vec4 in_color; attribute vec2 in_tex0;
uniform mat4 u_world; uniform mat4 u_view; uniform mat4 u_proj; uniform mat4 u_env;
uniform vec4 u_matColor; uniform vec4 u_surfaceProps;
uniform vec3 u_ambLight; uniform vec3 u_lightDir; uniform vec3 u_lightCol;
varying highp vec4 v_color0; varying highp vec4 v_color1;
varying highp vec2 v_tex0; varying highp vec2 v_tex1;
void main() {
  gl_Position = u_proj * u_view * u_world * vec4(in_pos, 1.0);
  v_tex0 = in_tex0; v_color0 = in_color;
  v_color0.rgb += u_ambLight * u_surfaceProps.x;
  vec3 N = mat3(u_world) * in_normal;
  float L = max(0.0, dot(N, -normalize(u_lightDir)));
  v_color0.rgb += L * u_lightCol * u_surfaceProps.z;
  v_color0 = clamp(v_color0, 0.0, 1.0);
  v_color0 *= u_matColor;
  v_color1 = v_color0 * u_surfaceProps.y;
  v_tex1 = (u_env * vec4(N, 1.0)).xy;
}`

const envFS = `
uniform sampler2D tex0; uniform sampler2D tex1; uniform highp float u_alphaRef;
varying highp vec4 v_color0; varying highp vec4 v_color1;
varying highp vec2 v_tex0; varying highp vec2 v_tex1;
void main() {
  gl_FragColor = v_color0 * texture2D(tex0, v_tex0);
  if (gl_FragColor.a < u_alphaRef) discard;
  gl_FragColor.rgb += (v_color1 * texture2D(tex1, v_tex1)).rgb;
}`

const carPS2VS = `
attribute vec3 in_pos; attribute vec3 in_normal;
attribute vec4 in_color; attribute vec2 in_tex0; attribute vec2 in_tex1;
uniform mat4 u_world; uniform mat4 u_view; uniform mat4 u_proj; uniform mat4 u_env;
uniform vec4 u_matColor; uniform vec4 u_surfaceProps;
uniform vec3 u_ambLight; uniform vec3 u_lightDir; uniform vec3 u_lightCol;
varying highp vec4 v_color0; varying highp vec4 v_color1; varying highp vec4 v_color2;
varying highp vec2 v_tex0; varying highp vec2 v_tex1; varying highp vec2 v_tex2;
void main() {
  gl_Position = u_proj * u_view * u_world * vec4(in_pos, 1.0);
  v_tex0 = in_tex0; v_color0 = in_color;
  v_color0.rgb += u_ambLight * u_surfaceProps.x;
  vec3 N = mat3(u_world) * in_normal;
  float L = max(0.0, dot(N, -normalize(u_lightDir)));
  v_color0.rgb += L * u_lightCol * u_surfaceProps.z;
  v_color0 = clamp(v_color0, 0.0, 1.0);
  v_color0 *= u_matColor;
  v_tex1 = in_tex1;
  v_color1 = vec4(1.5 * u_surfaceProps.w);
  N = mat3(u_view) * N;
  vec3 D = mat3(u_view) * u_lightDir;
  N = D - 2.0 * N * dot(N, D);
  v_tex2 = (N.xy + vec2(1.0, 1.0)) / 2.0;
  if (N.z < 0.0) v_color2 = vec4(0.75 * u_surfaceProps.y);
  else           v_color2 = vec4(0.0);
}`

const carPS2FS = `
uniform sampler2D tex0; uniform sampler2D tex1; uniform sampler2D tex2;
uniform highp float u_alphaRef;
varying highp vec4 v_color0; varying highp vec4 v_color1; varying highp vec4 v_color2;
varying highp vec2 v_tex0; varying highp vec2 v_tex1; varying highp vec2 v_tex2;
void main() {
  gl_FragColor = v_color0 * texture2D(tex0, v_tex0);
  if (gl_FragColor.a < u_alphaRef) discard;
  gl_FragColor.rgb += (v_color1 * texture2D(tex1, v_tex1)).rgb;
  gl_FragColor.rgb += (v_color2 * texture2D(tex2, v_tex2)).rgb;
}`

// ── GL helpers ───────────────────────────────────────────────────────────────
function compileShader(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader error:', gl.getShaderInfoLog(s))
    gl.deleteShader(s)
    return null
  }
  return s
}

function buildProgram(gl, vs, fs) {
  const prog = gl.createProgram()
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vs))
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, fs))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog))
    return null
  }
  const info = {
    program: prog,
    a: [
      gl.getAttribLocation(prog, 'in_pos'),
      gl.getAttribLocation(prog, 'in_normal'),
      gl.getAttribLocation(prog, 'in_color'),
      gl.getAttribLocation(prog, 'in_tex0'),
      gl.getAttribLocation(prog, 'in_tex1'),
    ],
    u: {
      u_proj: gl.getUniformLocation(prog, 'u_proj'),
      u_view: gl.getUniformLocation(prog, 'u_view'),
      u_world: gl.getUniformLocation(prog, 'u_world'),
      u_env: gl.getUniformLocation(prog, 'u_env'),
      u_matColor: gl.getUniformLocation(prog, 'u_matColor'),
      u_surfaceProps: gl.getUniformLocation(prog, 'u_surfaceProps'),
      u_ambLight: gl.getUniformLocation(prog, 'u_ambLight'),
      u_lightDir: gl.getUniformLocation(prog, 'u_lightDir'),
      u_lightCol: gl.getUniformLocation(prog, 'u_lightCol'),
      u_alphaRef: gl.getUniformLocation(prog, 'u_alphaRef'),
      u_tex0: gl.getUniformLocation(prog, 'tex0'),
      u_tex1: gl.getUniformLocation(prog, 'tex1'),
      u_tex2: gl.getUniformLocation(prog, 'tex2'),
    },
  }
  return info
}

function loadTexture(gl, url) {
  const id = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, id)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([255, 255, 255, 255]))
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, id)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  }
  img.src = url
  return id
}

// ── Matrix math (inline, no gl-matrix dep) ──────────────────────────────────
function mat4Create() { return new Float32Array(16) }
function mat4Identity(out) {
  out.fill(0); out[0]=out[5]=out[10]=out[15]=1; return out
}
function mat4Copy(out, a) { out.set(a); return out }
function mat4Multiply(out, a, b) {
  const a00=a[0],a01=a[1],a02=a[2],a03=a[3],
    a10=a[4],a11=a[5],a12=a[6],a13=a[7],
    a20=a[8],a21=a[9],a22=a[10],a23=a[11],
    a30=a[12],a31=a[13],a32=a[14],a33=a[15]
  let b0=b[0],b1=b[1],b2=b[2],b3=b[3]
  out[0]=b0*a00+b1*a10+b2*a20+b3*a30; out[1]=b0*a01+b1*a11+b2*a21+b3*a31
  out[2]=b0*a02+b1*a12+b2*a22+b3*a32; out[3]=b0*a03+b1*a13+b2*a23+b3*a33
  b0=b[4];b1=b[5];b2=b[6];b3=b[7]
  out[4]=b0*a00+b1*a10+b2*a20+b3*a30; out[5]=b0*a01+b1*a11+b2*a21+b3*a31
  out[6]=b0*a02+b1*a12+b2*a22+b3*a32; out[7]=b0*a03+b1*a13+b2*a23+b3*a33
  b0=b[8];b1=b[9];b2=b[10];b3=b[11]
  out[8]=b0*a00+b1*a10+b2*a20+b3*a30; out[9]=b0*a01+b1*a11+b2*a21+b3*a31
  out[10]=b0*a02+b1*a12+b2*a22+b3*a32; out[11]=b0*a03+b1*a13+b2*a23+b3*a33
  b0=b[12];b1=b[13];b2=b[14];b3=b[15]
  out[12]=b0*a00+b1*a10+b2*a20+b3*a30; out[13]=b0*a01+b1*a11+b2*a21+b3*a31
  out[14]=b0*a02+b1*a12+b2*a22+b3*a32; out[15]=b0*a03+b1*a13+b2*a23+b3*a33
  return out
}
function mat4Invert(out, a) {
  const a00=a[0],a01=a[1],a02=a[2],a03=a[3],
    a10=a[4],a11=a[5],a12=a[6],a13=a[7],
    a20=a[8],a21=a[9],a22=a[10],a23=a[11],
    a30=a[12],a31=a[13],a32=a[14],a33=a[15]
  const b00=a00*a11-a01*a10, b01=a00*a12-a02*a10, b02=a00*a13-a03*a10
  const b03=a01*a12-a02*a11, b04=a01*a13-a03*a11, b05=a02*a13-a03*a12
  const b06=a20*a31-a21*a30, b07=a20*a32-a22*a30, b08=a20*a33-a23*a30
  const b09=a21*a32-a22*a31, b10=a21*a33-a23*a31, b11=a22*a33-a23*a32
  let det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06
  if (!det) return null
  det = 1/det
  out[0]=(a11*b11-a12*b10+a13*b09)*det; out[1]=(a02*b10-a01*b11-a03*b09)*det
  out[2]=(a31*b05-a32*b04+a33*b03)*det; out[3]=(a22*b04-a21*b05-a23*b03)*det
  out[4]=(a12*b08-a10*b11-a13*b07)*det; out[5]=(a00*b11-a02*b08+a03*b07)*det
  out[6]=(a32*b02-a30*b05-a33*b01)*det; out[7]=(a20*b05-a22*b02+a23*b01)*det
  out[8]=(a10*b10-a11*b08+a13*b06)*det; out[9]=(a01*b08-a00*b10-a03*b06)*det
  out[10]=(a30*b04-a31*b02+a33*b00)*det; out[11]=(a21*b02-a20*b04-a23*b00)*det
  out[12]=(a11*b07-a10*b09-a12*b06)*det; out[13]=(a00*b09-a01*b07+a02*b06)*det
  out[14]=(a31*b01-a30*b03-a32*b00)*det; out[15]=(a20*b03-a21*b01+a22*b00)*det
  return out
}
function mat4RotateX(out, a, rad) {
  const s=Math.sin(rad), c=Math.cos(rad)
  const a10=a[4],a11=a[5],a12=a[6],a13=a[7],a20=a[8],a21=a[9],a22=a[10],a23=a[11]
  out.set(a)
  out[4]=a10*c+a20*s; out[5]=a11*c+a21*s; out[6]=a12*c+a22*s; out[7]=a13*c+a23*s
  out[8]=a20*c-a10*s; out[9]=a21*c-a11*s; out[10]=a22*c-a12*s; out[11]=a23*c-a13*s
  return out
}
function mat4FromValues(...v) { return new Float32Array(v) }
function vec3Create() { return new Float32Array(3) }
function vec3FromValues(x,y,z) { return new Float32Array([x,y,z]) }
function vec3Subtract(out,a,b) { out[0]=a[0]-b[0]; out[1]=a[1]-b[1]; out[2]=a[2]-b[2]; return out }
function vec3Normalize(out,a) { const l=Math.hypot(a[0],a[1],a[2])||1; out[0]=a[0]/l; out[1]=a[1]/l; out[2]=a[2]/l; return out }
function vec3Cross(out,a,b) { out[0]=a[1]*b[2]-a[2]*b[1]; out[1]=a[2]*b[0]-a[0]*b[2]; out[2]=a[0]*b[1]-a[1]*b[0]; return out }
function vec4Create() { return new Float32Array(4) }
function vec4Scale(out,a,s) { out[0]=a[0]*s; out[1]=a[1]*s; out[2]=a[2]*s; out[3]=a[3]*s; return out }
function deg2rad(d) { return d/180*Math.PI }

// ── RenderWare helpers ───────────────────────────────────────────────────────
function rwSetHierarchyRoot(frame, root) {
  frame.root = root
  for (let f = frame.child; f != null; f = f.next) rwSetHierarchyRoot(f, root)
}
function rwFrameRemoveChild(c) {
  let f = c.parent.child
  if (f === c) c.parent.child = c.next
  else { while (f.next !== c) f = f.next; f.next = c.next }
  c.parent = null; c.next = null; rwSetHierarchyRoot(c, c)
}
function rwFrameAddChild(p, child) {
  if (child.parent != null) rwFrameRemoveChild(child)
  if (p.child == null) p.child = child
  else { let c; for (c = p.child; c.next != null; c = c.next); c.next = child }
  child.next = null; child.parent = p; rwSetHierarchyRoot(child, p.root)
}
function rwFrameSynchLTM(f) {
  if (f.parent == null) mat4Copy(f.ltm, f.matrix)
  else mat4Multiply(f.ltm, f.matrix, f.parent.ltm)
  for (let c = f.child; c != null; c = c.next) rwFrameSynchLTM(c)
}
function rwFrameCreate() {
  const f = { parent:null, root:null, child:null, next:null,
    matrix: mat4Create(), ltm: mat4Create(), objects: [], name: '' }
  mat4Identity(f.matrix); f.root = f; mat4Copy(f.ltm, f.matrix); return f
}
function rwFrameLookAt(frm, pos, target, up) {
  const at = vec3Create(); vec3Subtract(at, target, pos); vec3Normalize(at, at)
  const left = vec3Create(); vec3Cross(left, up, at); vec3Normalize(left, left)
  const upOut = vec3Create(); vec3Cross(upOut, at, left)
  const m = frm.matrix
  m[0]=left[0]; m[1]=left[1]; m[2]=left[2]
  m[4]=upOut[0]; m[5]=upOut[1]; m[6]=upOut[2]
  m[8]=at[0]; m[9]=at[1]; m[10]=at[2]
  m[12]=pos[0]; m[13]=pos[1]; m[14]=pos[2]
}

// ── Instancing ───────────────────────────────────────────────────────────────
const ATTRIB_POS=0, ATTRIB_NORMAL=1, ATTRIB_COLOR=2, ATTRIB_TEXCOORDS0=3

function instanceGeo(gl, geo) {
  const header = {
    prim: geo.meshtype === 1 ? gl.TRIANGLE_STRIP : gl.TRIANGLES,
    totalNumVertices: geo.numVertices,
    totalNumIndices: geo.totalMeshIndices,
    vbo: gl.createBuffer(), ibo: gl.createBuffer(),
    inst: [], attribs: [],
  }
  let buf = new ArrayBuffer(header.totalNumIndices * 2), offset = 0
  for (const m of geo.meshes) {
    const inst = { material: m.material, numIndices: m.indices.length, offset }
    new Uint16Array(buf, offset, inst.numIndices).set(m.indices)
    offset += inst.numIndices * 2
    header.inst.push(inst)
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, header.ibo)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buf, gl.STATIC_DRAW)
  geo.instData = header
  instanceVertices(gl, geo)
}

function instanceVertices(gl, geo) {
  let stride = 0; const attribs = []
  attribs.push({ index: ATTRIB_POS, size:3, type:gl.FLOAT, normalized:false, offset:stride }); stride+=12
  if (geo.morphTargets[0].normals) {
    attribs.push({ index:ATTRIB_NORMAL, size:3, type:gl.FLOAT, normalized:false, offset:stride }); stride+=12
  }
  if (geo.prelit) {
    attribs.push({ index:ATTRIB_COLOR, size:4, type:gl.UNSIGNED_BYTE, normalized:true, offset:stride }); stride+=4
  }
  if (geo.flags & 0x04 || geo.flags & 0x80) {
    for (let i=0; i<geo.texCoords.length; i++) {
      attribs.push({ index:ATTRIB_TEXCOORDS0+i, size:2, type:gl.FLOAT, normalized:false, offset:stride }); stride+=8
    }
  }
  for (const a of attribs) a.stride = stride
  const header = geo.instData; header.attribs = attribs
  const buf = new ArrayBuffer(header.totalNumVertices * stride)
  const view = new DataView(buf)
  const verts = geo.morphTargets[0].vertices
  const posA = attribs.find(a => a.index === ATTRIB_POS)
  for (let i=0; i<header.totalNumVertices; i++) {
    view.setFloat32(posA.offset+i*stride, verts[i][0], true)
    view.setFloat32(posA.offset+i*stride+4, verts[i][1], true)
    view.setFloat32(posA.offset+i*stride+8, verts[i][2], true)
  }
  if (geo.morphTargets[0].normals) {
    const normA = attribs.find(a => a.index === ATTRIB_NORMAL)
    const norms = geo.morphTargets[0].normals
    for (let i=0; i<header.totalNumVertices; i++) {
      view.setFloat32(normA.offset+i*stride, norms[i][0], true)
      view.setFloat32(normA.offset+i*stride+4, norms[i][1], true)
      view.setFloat32(normA.offset+i*stride+8, norms[i][2], true)
    }
  }
  if (geo.prelit) {
    const colA = attribs.find(a => a.index === ATTRIB_COLOR)
    const prelit = geo.prelit
    for (let i=0; i<header.totalNumVertices; i++) {
      view.setUint8(colA.offset+i*stride, prelit[i][0])
      view.setUint8(colA.offset+i*stride+1, prelit[i][1])
      view.setUint8(colA.offset+i*stride+2, prelit[i][2])
      view.setUint8(colA.offset+i*stride+3, prelit[i][3])
    }
  }
  if (geo.flags & 0x04 || geo.flags & 0x80) {
    for (let ti=0; ti<geo.texCoords.length; ti++) {
      const tcA = attribs.find(a => a.index === ATTRIB_TEXCOORDS0+ti)
      const tc = geo.texCoords[ti]
      for (let i=0; i<header.totalNumVertices; i++) {
        view.setFloat32(tcA.offset+i*stride, tc[i][0], true)
        view.setFloat32(tcA.offset+i*stride+4, tc[i][1], true)
      }
    }
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, header.vbo)
  gl.bufferData(gl.ARRAY_BUFFER, buf, gl.STATIC_DRAW)
}

// ── Scene init ───────────────────────────────────────────────────────────────
function rwFrameInit(gl, f) {
  f.parent=null; f.root=f; f.child=null; f.next=null; f.objects=[]
  const m = f.matrix
  f.matrix = mat4FromValues(
    m[0],m[1],m[2],0, m[3],m[4],m[5],0, m[6],m[7],m[8],0, m[9],m[10],m[11],1)
  f.ltm = mat4Create(); mat4Copy(f.ltm, f.matrix)
}

function rpMaterialInit(gl, m, texBase)
{
  const texUrl = name => `${texBase}/${name.toLowerCase()}.png`
  if (m.texture)       m.texture = { name: m.texture.name, tex: loadTexture(gl, texUrl(m.texture.name)) }
  if (m.matfx?.envTex) m.matfx.envTex = { name: m.matfx.envTex.name, tex: loadTexture(gl, texUrl(m.matfx.envTex.name)) }
  if (m.specMap) {
    const texName = typeof m.specMap.texture === 'string' ? m.specMap.texture : m.specMap.textureName
    if (texName) { m.specMap.textureName = texName; m.specMap.texture = loadTexture(gl, texUrl(texName)) }
  }
}

function rpGeometryInit(gl, g, texBase) {
  for (const m of g.materials) rpMaterialInit(gl, m, texBase)
  for (const mesh of g.meshes) { mesh.material = g.materials[mesh.matId]; delete mesh.matId }
  g.numVertices = g.morphTargets[0].vertices.length
  g.totalMeshIndices = g.meshes.reduce((s, m) => s + m.indices.length, 0)
}

function rpClumpInit(gl, clump, texBase) {
  clump.frame = null
  for (let i=0; i<clump.frames.length; i++) {
    const f = clump.frames[i], p = f.parent
    rwFrameInit(gl, f)
    if (p >= 0) rwFrameAddChild(clump.frames[p], f)
    else clump.frame = f
  }
  for (const a of clump.atomics) {
    const f = clump.frames[a.frame]
    a.type = 0x14; a.frame = null; a.visible = true
    a.pipeline = a.matfx ? 'matfx' : 'default'
    a.objects = []
    a.frame = f; f.objects.push(a)
    rpGeometryInit(gl, a.geometry, texBase)
    instanceGeo(gl, a.geometry)
  }
  rwFrameSynchLTM(clump.frame)
}

// ── Car pipeline setup ───────────────────────────────────────────────────────
function setupSACar(clump) {
  for (const a of clump.atomics) {
    a.pipeline = 'car'
    for (const m of a.geometry.materials) {
      m.fxFlags = 0
      if (!m.matfx || m.matfx.type !== 2) continue
      if (m.matfx.envTex && m.envMap && m.envMap.shininess !== 0) {
        m.envMap.texture = m.matfx.envTex
        m.fxFlags |= (m.envMap.texture.name[0] === 'x') ? 2 : 1
      }
      if (m.specMap && m.specMap.specularity !== 0) m.fxFlags |= 4
    }
  }
}

function processVehicle(clump, colorVariant) {
  const info = {
    firstMaterials:[], secondMaterials:[], thirdMaterials:[], fourthMaterials:[],
    firstLightMaterials:[], secondLightMaterials:[], thirdLightMaterials:[], fourthLightMaterials:[],
  }
  const RAND_MAX = 0xFFFF
  const extra = Math.floor(Math.random() * RAND_MAX) % 6
  for (const a of clump.atomics) {
    const name = a.frame.name
    if (name.endsWith('_dam') || name.endsWith('_lo') || name.endsWith('_vlo') || name === 'wheel')
      a.visible = false
    if (name.startsWith('extra') && name !== `extra${extra+1}`)
      a.visible = false
    for (const m of a.geometry.materials) {
      const [r,g,b] = m.color
      if (r===0x3C && g===0xFF && b===0) info.firstMaterials.push(m)
      else if (r===0xFF && g===0 && b===0xAF) info.secondMaterials.push(m)
      else if (r===0 && g===0xFF && b===0xFF) info.thirdMaterials.push(m)
      else if (r===0xFF && g===0 && b===0xFF) info.fourthMaterials.push(m)
      else if (r===0xFF && g===0xAF && b===0) info.firstLightMaterials.push(m)
      else if (r===0 && g===0xFF && b===0xC8) info.secondLightMaterials.push(m)
      else if (r===0xB9 && g===0xFF && b===0) info.thirdLightMaterials.push(m)
      else if (r===0xFF && g===0x3C && b===0) info.fourthLightMaterials.push(m)
    }
  }
  return info
}

function applyColors(info, c1, c2, c3, c4) {
  for (const m of info.firstMaterials) m.color = c1
  for (const m of info.secondMaterials) m.color = c2
  for (const m of info.thirdMaterials) m.color = c3
  for (const m of info.fourthMaterials) m.color = c4
  for (const m of info.firstLightMaterials) m.color = [255,255,255,255]
  for (const m of info.secondLightMaterials) m.color = [255,255,255,255]
  for (const m of info.thirdLightMaterials) m.color = [128,0,0,255]
  for (const m of info.fourthLightMaterials) m.color = [128,0,0,255]
}

// ── Render ───────────────────────────────────────────────────────────────────
function setAttribs(gl, attribs, prog) {
  for (const a of attribs) {
    if (prog.a[a.index] < 0) continue
    gl.vertexAttribPointer(prog.a[a.index], a.size, a.type, a.normalized, a.stride, a.offset)
    gl.enableVertexAttribArray(prog.a[a.index])
  }
}
function resetAttribs(gl, attribs, prog) {
  for (const a of attribs) {
    if (prog.a[a.index] >= 0) gl.disableVertexAttribArray(prog.a[a.index])
  }
}
function uploadUniforms(gl, prog, st) {
  gl.uniformMatrix4fv(prog.u.u_proj, false, st.projectionMatrix)
  gl.uniformMatrix4fv(prog.u.u_view, false, st.viewMatrix)
  gl.uniformMatrix4fv(prog.u.u_world, false, st.worldMatrix)
  if (prog.u.u_env) gl.uniformMatrix4fv(prog.u.u_env, false, st.envMatrix)
  gl.uniform3fv(prog.u.u_ambLight, st.ambLight)
  gl.uniform3fv(prog.u.u_lightDir, st.lightDir)
  gl.uniform3fv(prog.u.u_lightCol, st.lightCol)
  gl.uniform1i(prog.u.u_tex0, 0)
  gl.uniform1i(prog.u.u_tex1, 1)
  gl.uniform1i(prog.u.u_tex2, 2)
  gl.uniform1f(prog.u.u_alphaRef, st.alphaRef)
}

function renderPass(gl, clump, programs, st, whitetex, renderPass) {
  const renderThisPass = (mat) => {
    if (renderPass === 0) return mat.color[3] === 255
    if (renderPass === 1) return mat.color[3] !== 255
    return true
  }

  let wheelAtm = clump.atomics.find(a => a.frame.name === 'wheel') ?? null
  const toRender = [...clump.atomics]
  if (wheelAtm) {
    for (const f of clump.frames) {
      if (['wheel_lf_dummy','wheel_rf_dummy','wheel_lb_dummy','wheel_rb_dummy','wheel_lm_dummy','wheel_rm_dummy'].includes(f.name)) {
        const isLeft = f.name === 'wheel_lf_dummy' || f.name === 'wheel_lb_dummy'
        toRender.push({ frame: f, geometry: wheelAtm.geometry, pipeline: 'car', visible: true, _wheelFlip: isLeft })
      }
    }
  }

  const envMatScale = mat4FromValues(
    -0.5,0,0,0, 0,-0.5,0,0, 0,0,1,0, 0.5,0.5,0,1)

  for (const atomic of toRender) {
    if (!atomic.visible) continue
    mat4Copy(st.worldMatrix, atomic.frame.ltm)
    if (atomic._wheelFlip) {
      const flip = mat4Create(); mat4Identity(flip)
      const cosA = Math.cos(Math.PI), sinA = Math.sin(Math.PI)
      flip[0]=cosA; flip[1]=sinA; flip[4]=-sinA; flip[5]=cosA; flip[10]=1; flip[15]=1
      const tmp = mat4Create()
      mat4Multiply(tmp, st.worldMatrix, flip)
      mat4Copy(st.worldMatrix, tmp)
    }

    const header = atomic.geometry.instData
    gl.bindBuffer(gl.ARRAY_BUFFER, header.vbo)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, header.ibo)

    let prog
    if (atomic.pipeline === 'car') prog = programs.car
    else if (atomic.pipeline === 'matfx') prog = programs.env
    else prog = programs.default

    gl.useProgram(prog.program)
    setAttribs(gl, header.attribs, prog)

    if (atomic.pipeline === 'matfx') {
      const tmp = mat4Create(), inv = mat4Create()
      mat4Invert(inv, st.envFrameLTM)
      mat4Multiply(tmp, inv, st.viewMatrix)
      tmp[12]=tmp[13]=tmp[14]=0
      mat4Multiply(st.envMatrix, envMatScale, tmp)
    }

    uploadUniforms(gl, prog, st)

    for (const inst of header.inst) {
      const m = inst.material
      if (!renderThisPass(m)) continue

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, m.texture ? m.texture.tex : whitetex)

      vec4Scale(st.matColor, m.color, 1/255)
      st.surfaceProps[0] = m.surfaceProperties[0]
      st.surfaceProps[2] = m.surfaceProperties[2]

      if (atomic.pipeline === 'car') {
        st.surfaceProps[1] = (m.fxFlags & 4) ? (m.specMap?.specularity ?? 0) : 0
        st.surfaceProps[3] = (m.fxFlags & 3) ? (m.envMap?.shininess ?? 0) : 0
        if (m.fxFlags & 3) {
          gl.activeTexture(gl.TEXTURE1)
          gl.bindTexture(gl.TEXTURE_2D, m.envMap.texture.tex)
        }
        if (m.fxFlags & 4) {
          gl.activeTexture(gl.TEXTURE2)
          gl.bindTexture(gl.TEXTURE_2D, m.specMap.texture)
        }
      } else if (atomic.pipeline === 'matfx') {
        let envcoef = 0
        gl.activeTexture(gl.TEXTURE1)
        if (m.matfx?.envTex) { envcoef = m.matfx.envCoefficient; gl.bindTexture(gl.TEXTURE_2D, m.matfx.envTex.tex) }
        else gl.bindTexture(gl.TEXTURE_2D, null)
        st.surfaceProps[1] = envcoef
      }

      gl.uniform4fv(prog.u.u_matColor, st.matColor)
      gl.uniform4fv(prog.u.u_surfaceProps, st.surfaceProps)

      if (m.color[3] !== 255 || m.texture) {
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      } else {
        gl.disable(gl.BLEND)
      }

      gl.drawElements(header.prim, inst.numIndices, gl.UNSIGNED_SHORT, inst.offset)
    }

    resetAttribs(gl, header.attribs, prog)
  }
}

// ── Camera helpers ───────────────────────────────────────────────────────────
function cameraBeginUpdate(gl, camera, st) {
  mat4Invert(st.viewMatrix, camera.frame.ltm)
  st.viewMatrix[0] = -st.viewMatrix[0]
  st.viewMatrix[4] = -st.viewMatrix[4]
  st.viewMatrix[8] = -st.viewMatrix[8]
  st.viewMatrix[12] = -st.viewMatrix[12]
  const p = camera.projmat
  const xs = 1/camera.viewWindow[0], ys = 1/camera.viewWindow[1]
  const zs = 1/(camera.farPlane - camera.nearPlane)
  p[0]=xs;p[1]=0;p[2]=0;p[3]=0;p[4]=0;p[5]=ys;p[6]=0;p[7]=0
  p[8]=0;p[9]=0;p[12]=0;p[13]=0
  p[10]=(camera.farPlane+camera.nearPlane)*zs; p[11]=1
  p[14]=-2*camera.nearPlane*camera.farPlane*zs; p[15]=0
  mat4Copy(st.projectionMatrix, p)
}

// ── Main init / load / draw cycle ─────────────────────────────────────────────
function initGL() {
  const canvas = canvasEl.value
  if (!canvas) return null
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true })
  if (!gl) return null

  const programs = {
    default: buildProgram(gl, defaultVS, defaultFS),
    env: buildProgram(gl, envVS, envFS),
    car: buildProgram(gl, carPS2VS, carPS2FS),
  }

  const whitetex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, whitetex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([255,255,255,255]))

  const camFrame = rwFrameCreate()
  const camera = { frame: camFrame, viewWindow:[1,1], viewOffset:[0,0],
    nearPlane:0.1, farPlane:100, projmat: mat4Create() }

  const envFrame = rwFrameCreate()
  mat4RotateX(envFrame.matrix, envFrame.matrix, deg2rad(60))
  rwFrameSynchLTM(envFrame)

  const st = {
    alphaRef: 0.1,
    projectionMatrix: mat4Create(), viewMatrix: mat4Create(),
    worldMatrix: mat4Create(), envMatrix: mat4Create(),
    envFrameLTM: envFrame.ltm,
    matColor: vec4Create(), surfaceProps: new Float32Array(4),
    ambLight: vec3FromValues(0.4, 0.4, 0.4),
    lightDir: vec3FromValues(
      -Math.cos(deg2rad(45))*Math.cos(deg2rad(45)),
      -Math.sin(deg2rad(45))*Math.cos(deg2rad(45)),
      -Math.sin(deg2rad(45))),
    lightCol: vec3FromValues(1, 1, 1),
  }

  const fov = deg2rad(70)
  const aspect = canvas.width / canvas.height
  camera.viewWindow[1] = Math.tan(fov/2)
  camera.viewWindow[0] = camera.viewWindow[1] * aspect

  return { gl, programs, whitetex, camera, st }
}

async function loadAndRender(modelId)
{
  const type = props.modelType ?? 'vehicle'
  loadState.value = 'loading'

  const c = ctx.value
  if (!c) return
  const { gl } = c

  try {
    if (type === 'vehicle') {
      let resolvedId = modelId
      let modelName  = SA_VEHICLE_MODEL[resolvedId]
      if (!modelName) { resolvedId = TYPE_FALLBACK_ID.vehicle; modelName = SA_VEHICLE_MODEL[resolvedId] }
      if (!modelName) { loadState.value = 'error'; errorMsg.value = `Unknown ID ${modelId}`; return }

      const data    = await fetchModel(modelName)
      const texBase = TEX_BASE

      rpClumpInit(gl, data.model_stream, texBase)
      setupSACar(data.model_stream)
      const info    = processVehicle(data.model_stream)
      const toRgba  = idx => { const col = SA_CAR_COLOURS[idx] ?? [255,255,255]; return [col[0],col[1],col[2],255] }
      applyColors(info, toRgba(props.modelColor1), toRgba(props.modelColor2), [255,255,255,255], [255,255,255,255])
      scene.value   = { clump: data.model_stream, info }

    } else {
      // skin or object — use open.mp CDN
      if (type === 'object') await saModelsReady
      const modelMap  = type === 'skin' ? SA_SKIN_MODEL : Object.fromEntries(SA_OBJECTS.map(o => [o.id, o.model]))
      let resolvedId  = modelId
      let modelName   = modelMap[resolvedId]
      if (!modelName) { resolvedId = TYPE_FALLBACK_ID[type]; modelName = modelMap[resolvedId] }
      if (!modelName) { loadState.value = 'error'; errorMsg.value = `Unknown ID ${modelId}`; return }

      const frames    = await fetchOpenMpModel(modelName)
      const clump     = openMpToClump(frames)
      const texBase   = `https://assets.open.mp/models/exports`
      rpClumpInit(gl, clump, texBase)
      scene.value     = { clump, info: null }
    }

    loadState.value = 'ready'
  } catch(e) {
    console.error('Model load/init error:', e)
    loadState.value = 'error'; errorMsg.value = 'Load failed'
  }
}

function drawFrame() {
  const c = ctx.value
  const s = scene.value
  if (!c || !s) return

  const { gl, programs, whitetex, camera, st } = c
  const canvas = canvasEl.value
  if (!canvas) return

  const W = Math.round(150 * props.zoom)
  const H = Math.round(100 * props.zoom)
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W; canvas.height = H
    const aspect = W / (H || 1)
    camera.viewWindow[0] = camera.viewWindow[1] * aspect
  }

  gl.viewport(0, 0, W, H)
  gl.clearColor(0, 0, 0, 0)
  gl.clearDepth(1)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  const dist = props.modelZoom * 5
  const isSkin = props.modelType === 'skin'
  const pitch = deg2rad(props.modelRotX + (isSkin ? 90 : 0))
  const yaw   = deg2rad(props.modelRotY + (isSkin ? 270 : 90))
  const roll  = deg2rad(props.modelRotZ)

  // Camera pos from pitch + yaw only (no roll affects position)
  const x = dist * Math.cos(yaw) * Math.cos(pitch)
  const y = dist * Math.sin(yaw) * Math.cos(pitch)
  const z = dist * Math.sin(pitch)

  // Base up: flip sign past ±90 pitch for continuous rotation
  const upSign = Math.cos(pitch) < 0 ? -1 : 1
  const fwdX = -x / dist, fwdY = -y / dist, fwdZ = -z / dist
  // Gram-Schmidt: make (0,0,upSign) perpendicular to forward
  const dot = fwdZ * upSign
  let ux = -dot * fwdX
  let uy = -dot * fwdY
  let uz = upSign - dot * fwdZ
  const ulen = Math.sqrt(ux*ux + uy*uy + uz*uz) || 1
  ux /= ulen; uy /= ulen; uz /= ulen
  // Roll: rotate up around forward axis
  const rsx = fwdY*uz - fwdZ*uy, rsy = fwdZ*ux - fwdX*uz, rsz = fwdX*uy - fwdY*ux
  const cr = Math.cos(roll), sr = Math.sin(roll)
  const upX = cr*ux + sr*rsx
  const upY = cr*uy + sr*rsy
  const upZ = cr*uz + sr*rsz
  rwFrameLookAt(camera.frame, [x,y,z], [0,0,0], [upX, upY, upZ])
  rwFrameSynchLTM(camera.frame)
  cameraBeginUpdate(gl, camera, st)

  renderPass(gl, s.clump, programs, st, whitetex, 0)
  renderPass(gl, s.clump, programs, st, whitetex, 1)
  applyTint(canvas, W, H)
}

function applyTint(srcCanvas, W, H) {
  const tc = tintEl.value
  if (!tc) return
  if (tc.width !== W || tc.height !== H) { tc.width = W; tc.height = H; tc.style.width = '100%'; tc.style.height = '100%' }

  const { r, g, b, a } = hexToRGBA(props.color >>> 0)
  const box = hexToRGBA(props.boxColor >>> 0)
  const ctx2 = tc.getContext('2d')
  ctx2.clearRect(0, 0, W, H)

  const noTint = a === 0 || (r === 255 && g === 255 && b === 255)

  if (noTint) {
    if (box.a > 0) {
      ctx2.fillStyle = `rgba(${box.r},${box.g},${box.b},${box.a / 255})`
      ctx2.fillRect(0, 0, W, H)
    }
    if (a > 0) ctx2.drawImage(srcCanvas, 0, 0)
    return
  }

  const boxNoTint = box.a === 0 || (box.r < 30 && box.g < 30 && box.b < 30)

  const src = document.createElement('canvas')
  src.width = W; src.height = H
  const s = src.getContext('2d')
  if (box.a > 0 && !boxNoTint) {
    s.fillStyle = `rgba(${box.r},${box.g},${box.b},${box.a / 255})`
    s.fillRect(0, 0, W, H)
  }
  s.drawImage(srcCanvas, 0, 0)

  const tmp = document.createElement('canvas')
  tmp.width = W; tmp.height = H
  const t = tmp.getContext('2d')
  t.fillStyle = `rgba(${r},${g},${b},${a / 255})`
  t.fillRect(0, 0, W, H)
  t.globalCompositeOperation = 'multiply'
  t.drawImage(src, 0, 0)
  t.globalCompositeOperation = 'destination-in'
  t.drawImage(src, 0, 0)
  t.globalCompositeOperation = 'source-over'

  if (box.a > 0 && boxNoTint) {
    ctx2.fillStyle = `rgba(${box.r},${box.g},${box.b},${box.a / 255})`
    ctx2.fillRect(0, 0, W, H)
  }
  ctx2.drawImage(tmp, 0, 0)
}

function startLoop() {
  if (rafId) cancelAnimationFrame(rafId)
  const loop = () => { drawFrame(); rafId = requestAnimationFrame(loop) }
  rafId = requestAnimationFrame(loop)
}

// ── Watchers ─────────────────────────────────────────────────────────────────
watch(() => [props.modelColor1, props.modelColor2], ([c1, c2]) => {
  const s = scene.value
  if (!s) return
  const toRgba = idx => { const col = SA_CAR_COLOURS[idx] ?? [255,255,255]; return [col[0],col[1],col[2],255] }
  applyColors(s.info, toRgba(c1), toRgba(c2), [255,255,255,255], [255,255,255,255])
})

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  const c = initGL()
  if (!c) { loadState.value = 'error'; errorMsg.value = 'WebGL unavailable'; return }
  ctx.value = c
  startLoop()
  lastModelId = props.modelId
  await loadAndRender(props.modelId)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null
})

watch(() => [props.modelId, props.modelType], async ([id, type], [prevId, prevType]) => {
  if (id === lastModelId && type === prevType) return
  lastModelId = id
  scene.value = null
  await loadAndRender(id)
})
</script>

<style scoped>
.model-renderer-wrap {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
.model-canvas {
  width: 100%;
  height: 100%;
  display: block;
  image-rendering: auto;
  visibility: hidden;
  position: absolute;
  inset: 0;
}
.model-tint-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  image-rendering: auto;
  pointer-events: none;
}
.model-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.model-loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 1s ease-in-out infinite;
}
.model-error {
  font-family: 'Tahoma', sans-serif;
  font-size: 8px;
  color: rgba(200,0,65,0.7);
  text-align: center;
  padding: 4px;
}
@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
</style>
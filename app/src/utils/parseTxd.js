// GTA SA TXD parser — runs in-browser via ArrayBuffer
// Supports: DXT1, DXT3, DXT5, uncompressed RGBA8888 / RGB888

function u32(view, offset) { return view.getUint32(offset, true) }
function u16(view, offset) { return view.getUint16(offset, true) }
function u8 (view, offset) { return view.getUint8(offset) }

function readString(buffer, offset, length) {
  const bytes = new Uint8Array(buffer, offset, length)
  let end = bytes.indexOf(0)
  if (end === -1) end = length
  return new TextDecoder('ascii').decode(bytes.slice(0, end))
}

function rgb565(v) {
  return [
    ((v >> 11) & 0x1F) * 255 / 31 | 0,
    ((v >> 5)  & 0x3F) * 255 / 63 | 0,
    (v & 0x1F) * 255 / 31 | 0,
  ]
}

function decodeDxtColors(c0raw, c1raw, indices) {
  const c0 = rgb565(c0raw)
  const c1 = rgb565(c1raw)
  const pal = [c0, c1]
  if (c0raw > c1raw) {
    pal.push([(2*c0[0]+c1[0])/3|0, (2*c0[1]+c1[1])/3|0, (2*c0[2]+c1[2])/3|0])
    pal.push([(c0[0]+2*c1[0])/3|0, (c0[1]+2*c1[1])/3|0, (c0[2]+2*c1[2])/3|0])
  } else {
    pal.push([(c0[0]+c1[0])/2|0, (c0[1]+c1[1])/2|0, (c0[2]+c1[2])/2|0])
    pal.push([0, 0, 0])
  }
  return Array.from({ length: 16 }, (_, i) => pal[(indices >> (2 * i)) & 3])
}

function decodeDxt1Block(bytes, off) {
  const view = new DataView(bytes.buffer, bytes.byteOffset + off)
  const c0r = view.getUint16(0, true)
  const c1r = view.getUint16(2, true)
  const idx = view.getUint32(4, true)
  const colors = decodeDxtColors(c0r, c1r, idx)
  return colors.map((rgb, i) => {
    let a = 255
    if (c0r <= c1r && ((idx >> (2 * i)) & 3) === 3) a = 0
    return [...rgb, a]
  })
}

function decodeDxt3Block(bytes, off) {
  const alphas = []
  for (let i = 0; i < 8; i++) {
    const b = bytes[off + i]
    alphas.push((b & 0x0F) * 17)
    alphas.push(((b >> 4) & 0x0F) * 17)
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset + off + 8)
  const c0r = view.getUint16(0, true)
  const c1r = view.getUint16(2, true)
  const idx = view.getUint32(4, true)
  const colors = decodeDxtColors(c0r, c1r, idx)
  return colors.map((rgb, i) => [...rgb, alphas[i]])
}

function decodeDxt5Block(bytes, off) {
  const a0 = bytes[off], a1 = bytes[off + 1]
  let abits = 0
  for (let i = 0; i < 6; i++) abits += bytes[off + 2 + i] * Math.pow(256, i)
  const at = [a0, a1]
  if (a0 > a1) {
    for (let i = 1; i < 7; i++) at.push((a0 * (7 - i) + a1 * i) / 7 | 0)
  } else {
    for (let i = 1; i < 5; i++) at.push((a0 * (5 - i) + a1 * i) / 5 | 0)
    at.push(0, 255)
  }
  const alphas = Array.from({ length: 16 }, (_, i) => at[(abits / Math.pow(8, i) | 0) & 7])
  const view = new DataView(bytes.buffer, bytes.byteOffset + off + 8)
  const c0r = view.getUint16(0, true)
  const c1r = view.getUint16(2, true)
  const idx = view.getUint32(4, true)
  const colors = decodeDxtColors(c0r, c1r, idx)
  return colors.map((rgb, i) => [...rgb, alphas[i]])
}

function decodeDxt(bytes, w, h, fmt) {
  const bw = (w + 3) >> 2
  const bh = (h + 3) >> 2
  const blockSize = fmt === 'DXT1' ? 8 : 16
  const rgba = new Uint8ClampedArray(w * h * 4)
  let off = 0
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      let pxs
      if      (fmt === 'DXT1') pxs = decodeDxt1Block(bytes, off)
      else if (fmt === 'DXT3') pxs = decodeDxt3Block(bytes, off)
      else                     pxs = decodeDxt5Block(bytes, off)
      off += blockSize
      for (let i = 0; i < 16; i++) {
        const px = bx * 4 + (i % 4)
        const py = by * 4 + (i >> 2)
        if (px < w && py < h) {
          const idx = (py * w + px) * 4
          rgba[idx]   = pxs[i][0]
          rgba[idx+1] = pxs[i][1]
          rgba[idx+2] = pxs[i][2]
          rgba[idx+3] = pxs[i][3]
        }
      }
    }
  }
  return rgba
}

function decodeUncompressed(bytes, w, h, depth) {
  const rgba = new Uint8ClampedArray(w * h * 4)
  if (depth === 32) {
    // BGRA or RGBA — SA stores as BGRA
    for (let i = 0; i < w * h; i++) {
      rgba[i*4]   = bytes[i*4+2] // R
      rgba[i*4+1] = bytes[i*4+1] // G
      rgba[i*4+2] = bytes[i*4]   // B
      rgba[i*4+3] = bytes[i*4+3] // A
    }
  } else if (depth === 24) {
    for (let i = 0; i < w * h; i++) {
      rgba[i*4]   = bytes[i*3+2]
      rgba[i*4+1] = bytes[i*3+1]
      rgba[i*4+2] = bytes[i*3]
      rgba[i*4+3] = 255
    }
  } else if (depth === 16) {
    // RGB565
    const view = new DataView(bytes.buffer, bytes.byteOffset)
    for (let i = 0; i < w * h; i++) {
      const v = view.getUint16(i * 2, true)
      const [r,g,b] = rgb565(v)
      rgba[i*4] = r; rgba[i*4+1] = g; rgba[i*4+2] = b; rgba[i*4+3] = 255
    }
  }
  return rgba
}

function rgbaToDataURL(rgba, w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const img = new ImageData(rgba, w, h)
  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL('image/png')
}

// Parse one native texture struct, return { name, dataURL } or null
function parseNativeTexture(buffer, bodyOffset) {
  const view = new DataView(buffer)
  const u = (o) => u32(view, o)
  const s = (o) => u16(view, o)

  const platform = u(bodyOffset)
  if (platform !== 8 && platform !== 9) return null // not D3D

  const name  = readString(buffer, bodyOffset + 8,  32)
  const fourCC = readString(buffer, bodyOffset + 76, 4)
  const w     = s(bodyOffset + 80)
  const h     = s(bodyOffset + 82)
  const depth = u8(view, bodyOffset + 84)
  const mipCount = u8(view, bodyOffset + 85)

  // skip to mip data: header is 88 bytes, then mipCount * (u32 dataSize + data)
  let off = bodyOffset + 88
  const bytes = new Uint8Array(buffer)

  let dataURL = null
  for (let m = 0; m < mipCount; m++) {
    const mipW = Math.max(1, w >> m)
    const mipH = Math.max(1, h >> m)
    const dataSize = u(off); off += 4
    const mipBytes = bytes.slice(off, off + dataSize)
    off += dataSize

    if (m === 0) {
      let rgba
      if      (fourCC === 'DXT1') rgba = decodeDxt(mipBytes, mipW, mipH, 'DXT1')
      else if (fourCC === 'DXT3') rgba = decodeDxt(mipBytes, mipW, mipH, 'DXT3')
      else if (fourCC === 'DXT5') rgba = decodeDxt(mipBytes, mipW, mipH, 'DXT5')
      else                        rgba = decodeUncompressed(mipBytes, mipW, mipH, depth)

      dataURL = rgbaToDataURL(rgba, mipW, mipH)
    }
  }

  return dataURL ? { name, dataURL } : null
}

// Walk RW chunks and extract all native textures
function walkChunks(buffer, start, end, depth = 0) {
  const view = new DataView(buffer)
  const results = []
  let off = start
  while (off + 12 <= end) {
    const type = u32(view, off)
    const size = u32(view, off + 4)
    const bodyStart = off + 12
    const bodyEnd   = bodyStart + size

    if (type === 0x00000015) {
      // Texture Native — body starts with 0x0001 struct chunk
      // struct chunk: header 12 bytes, then native texture data
      const structType = u32(view, bodyStart)
      if (structType === 0x00000001) {
        const structSize = u32(view, bodyStart + 4)
        const texBody = bodyStart + 12
        const tex = parseNativeTexture(buffer, texBody)
        if (tex) results.push(tex)
      }
    } else if (type === 0x00000016 || type === 0x00000001) {
      // Texture Dictionary or generic container — recurse
      results.push(...walkChunks(buffer, bodyStart, bodyEnd, depth + 1))
    }

    if (size === 0) break
    off = bodyEnd
  }
  return results
}

// Main entry — call with an ArrayBuffer from a FileReader
export function parseTxd(buffer) {
  const view = new DataView(buffer)
  const rootType = u32(view, 0)
  if (rootType !== 0x00000016) {
    throw new Error('Not a valid TXD file (expected type 0x16)')
  }
  const rootSize = u32(view, 4)
  return walkChunks(buffer, 0, 12 + rootSize)
}
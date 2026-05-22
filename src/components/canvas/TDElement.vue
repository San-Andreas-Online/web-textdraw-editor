  <template>
    <div
      v-if="el.visible"
      class="td-element"
      :style="wrapperStyle"
      @mousedown.stop="onMouseDown"
      @contextmenu.stop.prevent="emit('contextmenu', $event, el)"
    >
      <!-- Sprite -->
      <div v-if="el.type === 'sprite'" class="fill sprite-wrap">
        <img
          v-if="spritePath"
          ref="spriteImgRef"
          :src="localPath || spritePath"
          class="sprite-img-hidden"
          draggable="false"
          @dragstart.prevent
          @load="drawTinted"
          @error="onImgError"
        />
        <canvas v-if="spritePath && !imgFailed" ref="canvasRef" class="sprite-canvas" />
        <div v-if="!spritePath || imgFailed" class="sprite-fallback">{{ el.text }}</div>
      </div>

      <!-- Progress bar -->
      <div v-else-if="el.type === 'progress'" class="fill progress-wrap" :style="progressWrapStyle">
        <div class="progress-fill" :style="progressFillStyle" />
      </div>

      <!-- Hitbox -->
      <div v-else-if="el.type === 'hitbox'" class="fill" :style="hitboxStyle" />

      <!-- Box / Line -->
      <div v-else-if="el.type === 'box' || el.type === 'line'" class="fill text-el" :style="textWrapStyle">
        <span :style="textStyle">{{ el.text === '_' ? '' : el.text }}</span>
      </div>

      <!-- Label / Button -->
      <div v-else class="fill text-el" :style="textWrapStyle">
        <span :style="textStyle">{{ el.text || '_' }}</span>
      </div>

      <!-- Selection outline -->
      <div class="sel-outline" :class="{ active: selected }" />

      <!-- Name label -->
      <div v-if="selected" class="name-label" :style="nameLabelStyle">{{ el.locked ? '🔒 ' : '' }}{{ el.name }}</div>

      <!-- Resize handle — never show on locked -->
      <div
        v-if="selected && !el.locked"
        class="resize-handle"
        @mousedown.stop="onResizeStart"
      />
    </div>
  </template>

  <script setup>
  import { computed, ref, watch, nextTick } from 'vue'
  import { rgbaToCSS, numToHex6, hexToRGBA } from '../../utils/colors'
  import { spriteImagePath, localSpriteImagePath } from '../../constants/sprites'
  import { FONTS } from '../../constants/fonts'

  const props = defineProps({
    el:       { type: Object, required: true },
    selected: { type: Boolean, default: false },
    zoom:     { type: Number, default: 1 },
  })

  const emit = defineEmits(['mousedown', 'resize-start'])

  const imgFailed    = ref(false)
  const localPath    = ref(null)
  const spriteImgRef = ref(null)
  const canvasRef    = ref(null)

  const spritePath = computed(() => {
    if (props.el.type !== 'sprite') return null
    const [lib, tex] = props.el.text.split(':')
    if (!lib || !tex) return null
    return spriteImagePath(lib, tex)
  })

  const localSpritePath = computed(() => {
    if (props.el.type !== 'sprite') return null
    const [lib, tex] = props.el.text.split(':')
    if (!lib || !tex) return null
    return localSpriteImagePath(lib, tex)
  })

  const nameLabelStyle = computed(() => ({
    fontSize: Math.round(3 * props.zoom) + 'px',
    padding: `0px ${Math.round(3 * props.zoom)}px`,
    top: -Math.round(3 * props.zoom) + 'px',
    borderRadius: Math.round(0.5 * props.zoom) + 'px',
  }))

  function onImgError() {
    if (!localPath.value) {
      localPath.value = localSpritePath.value
    } else {
      imgFailed.value = true
    }
  }

  watch(() => props.el.text, () => {
    imgFailed.value = false
    localPath.value = null
  })

  watch(() => props.el.color, () => drawTinted())
  watch(() => props.el.w,     () => drawTinted())
  watch(() => props.el.h,     () => drawTinted())

  function drawTinted() {
    nextTick(() => {
      const img = spriteImgRef.value
      const cv  = canvasRef.value
      if (!img || !cv || !img.complete || img.naturalWidth === 0) return

      cv.width  = img.naturalWidth
      cv.height = img.naturalHeight
      const ctx = cv.getContext('2d')
      ctx.clearRect(0, 0, cv.width, cv.height)

      const c = props.el.color >>> 0
      const { r, g, b, a } = hexToRGBA(c)

      if (a === 0) return

      // draw image with alpha
      ctx.globalAlpha = a / 255
      ctx.drawImage(img, 0, 0)
      ctx.globalAlpha = 1

      // tint only if not white
      if (r !== 255 || g !== 255 || b !== 255) {
        ctx.globalCompositeOperation = 'source-atop'
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(0, 0, cv.width, cv.height)
        ctx.globalCompositeOperation = 'source-over'
      }
    })
  }

  const FONT_Y_SCALE = [8.85, 8.74, 8.75, 9.38, 9.0]
  const FONT_X_SCALE = [0.996, 0.9, 0.954, 1.0, 1.0]
  const FONT_BASELINE = [-0.057, -0.08, 0.2, 0.14, 0]

  const FONT_OFFSET_X = [
    [1, -49,-98],
    [-0.3, -49, -99],
    [-1, -50.5, -99],
    [0.1, -50, -100],
    [0, 0, 0],
  ]

  const FONT_OFFSET_Y = [
    [-6,   -6,   -6  ],
    [-7,   -7,   -7  ],
    [-6,   -6,   -6  ],
    [-6.5, -6.5, -6.5],
    [0,    0,    0   ],
  ]
  

  const FONT_WIDTH_SCALE = [1, 1.05, 1.05, 1.02, 1] // tweak per font index


  const FONT_OFFSET_W = [0, 0, 0, 0, 0]

  const isText = computed(() =>
    props.el.type === 'label' || props.el.type === 'button'
  )

  const wrapperStyle = computed(() => {
    const baselineShift = isText.value
      ? (FONT_BASELINE[props.el.font] ?? 0.72)
      : 0
    const w = props.el.w * props.zoom
    const h = props.el.h * props.zoom
    const isBox = props.el.type === 'box'
    const isSprite = props.el.type === 'sprite'
    const isText2 = props.el.type === 'label' || props.el.type === 'button'
    const align = props.el.align ?? 0
    const fontOffsetY = isText2 ? ((FONT_OFFSET_Y[props.el.font]?.[align]) ?? 0) * props.zoom : 0
    const fontOffsetX = isText2 ? ((FONT_OFFSET_X[props.el.font]?.[align]) ?? 0) * props.zoom : 0
    const fontOffsetW = isText2 ? (FONT_OFFSET_W[props.el.font] ?? 0) * props.zoom : 0

    return {
      left: (props.el.x * props.zoom) + (w < 0 ? w : 0) + (isBox ? -4 * props.zoom : 0) + fontOffsetX + 'px',
      top: (props.el.y * props.zoom) + (h < 0 ? h : 0) - (props.el.h * props.zoom * baselineShift * 0.3) + (isBox ? -7 * props.zoom : 0) + (isSprite ? -3 * props.zoom : 0) + fontOffsetY + 'px',
      width: Math.max(Math.abs(w), 4) + (isBox ? 3 * props.zoom : 0) + fontOffsetW + 'px',
      height: Math.max(Math.abs(h), 2) + (isBox ? 12 * props.zoom : 0) + 'px',
      cursor: props.el.locked ? 'not-allowed' : 'move',
      zIndex: (props.el.layer || 0) + 10,
      transform: `scale(${w < 0 ? -1 : 1}, ${h < 0 ? -1 : 1})`,
      transformOrigin: 'center center',
    }
  })


  const boxStyle = computed(() => ({
    width: '100%', height: '100%',
    background: rgbaToCSS(props.el.boxColor),
  }))

  const hitboxStyle = computed(() => ({
    width: '100%', height: '100%',
    background: rgbaToCSS(props.el.boxColor),
    border: `1px dashed ${numToHex6(props.el.color)}`,
    boxSizing: 'border-box',
  }))

  const progressWrapStyle = computed(() => ({
    background: rgbaToCSS(props.el.boxColor),
    border: `1px solid ${numToHex6(props.el.color)}`,
    boxSizing: 'border-box',
  }))

  const progressFillStyle = computed(() => ({
    width: `${Math.min(100, Math.max(0, parseFloat(props.el.text) || 50))}%`,
    height: '100%',
    background: numToHex6(props.el.color),
  }))

  const textWrapStyle = computed(() => {
    const jc = props.el.align === 1 ? 'center' : props.el.align === 2 ? 'flex-end' : 'flex-start'
    return {
      background: props.el.useBox ? rgbaToCSS(props.el.boxColor) : 'transparent',
      justifyContent: jc,
    }
  })


  const textStyle = computed(() => {
    const font = FONTS[props.el.font] || FONTS[0]
    const yScale = FONT_Y_SCALE[props.el.font] ?? 9.0
    const xScale = FONT_X_SCALE[props.el.font] ?? 1.0
    const fs = Math.max(6, props.el.letterY * yScale * props.zoom)
    const scaleX = (props.el.letterY > 0
      ? (props.el.letterX / props.el.letterY) * 3.75 * xScale
      : xScale) * (FONT_WIDTH_SCALE[props.el.font] ?? 1)
    return {
      color:           rgbaToCSS(props.el.color),
      fontSize:        fs + 'px',
      fontFamily:      `'${font.family}', sans-serif`,
      fontWeight:      '400',
      fontStyle:       'normal',
      textTransform:   props.el.font === 2 ? 'uppercase' : 'none',
      textShadow: buildTextShadow(props.el.outline, props.el.shadow, props.el.bgColor, props.zoom),
      whiteSpace:      'nowrap',
      lineHeight:      '1',
      display:         'inline-block',
      transformOrigin: props.el.align === 1 ? 'center top' : props.el.align === 2 ? 'right top' : 'left top',
      transform:       `scaleX(${scaleX}) scaleY(1)`,
    }
  })

  function onMouseDown(e) {
    if (e.button !== 0) return
    if (props.el.locked) return
    emit('mousedown', e, props.el)
  }

  function onResizeStart(e) {
    if (e.button !== 0) return
    emit('resize-start', e, props.el)
  }

  function buildTextShadow(outline, shadow, bgColor, zoom) {
    const col = rgbaToCSS(bgColor ?? 0x000000FF)
    const parts = []
    if (outline > 0) {
      const o = outline * 1 * zoom
      parts.push(
        `-${o}px -${o}px 0 ${col}`,
        ` ${o}px -${o}px 0 ${col}`,
        `-${o}px  ${o}px 0 ${col}`,
        ` ${o}px  ${o}px 0 ${col}`,
        `-${o}px 0   0 ${col}`,
        ` ${o}px 0   0 ${col}`,
        `0  -${o}px  0 ${col}`,
        `0   ${o}px  0 ${col}`,
      )
    }
    if (shadow > 0) {
      const s = shadow * zoom
      parts.push(`${s}px ${s}px 0 ${col}`)
    }
    return parts.length ? parts.join(', ') : 'none'
  }

  </script>

  <style scoped>
  .td-element {
    position: absolute;
  }
  .fill {
    width: 100%;
    height: 100%;
  }
  .sprite-wrap {
    position: relative;
  }
  .sprite-img-hidden {
    display: none;
  }
  .sprite-canvas {
    width: 100%;
    height: 100%;
    image-rendering: smooth;
    pointer-events: none;
    user-select: none;
    display: block;
  }
  .sprite-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,212,255,0.08);
    border: 1px dashed rgba(0,212,255,0.4);
    font-family: 'Tahoma', sans-serif;
    font-size: 8px;
    color: #00d4ff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 3px;
    box-sizing: border-box;
  }
  .text-el {
    display: flex;
    align-items: center;
    overflow: visible;
    padding: 0 2px;
    box-sizing: border-box;
  }
  .progress-wrap {
    display: block;
  }
  .sel-outline {
    position: absolute;
    inset: -1px;
    border: 1px solid transparent;
    pointer-events: none;
    border-radius: 1px;
  }
  .sel-outline.active {
    border: 3px dashed #0a246a;
    box-shadow: 0 0 0 1px rgba(10,36,106,0.2);
  }
  .name-label {
    position: absolute;
    top: -16px;
    left: 0;
    font-family: 'Tahoma', sans-serif;
    font-size: 9px;
    font-weight: 700;
    color: #000000;
    background: #ffffffd9;
    padding: 1px 5px;
    border-radius: 2px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 20;
    letter-spacing: 0.3px;
  }
  .resize-handle {
    position: absolute;
    width: 8px;
    height: 8px;
    bottom: -4px;
    right: -4px;
    background: #0a246a;
    border: 1px solid #fff;
    cursor: se-resize;
    z-index: 10;
  }
  </style>
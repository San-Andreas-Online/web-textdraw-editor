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

      <!-- Box / Line -->
      <div v-else-if="el.type === 'box' || el.type === 'line'" class="fill text-el" :style="textWrapStyle">
        <div :style="fontOffsetStyle">
          <div v-if="wrappedLines && wrappedLines.length > 1" class="wrapped-text">
            <span v-for="(line, i) in wrappedLines" :key="i" :style="textStyle" class="wrapped-line">{{ line }}</span>
          </div>
          <span v-else :style="textStyle">{{ el.text === '_' ? '' : el.text }}</span>
        </div>
      </div>

      <!-- Label -->
      <div v-else class="fill text-el" :style="textWrapStyle">
        <div :style="fontOffsetStyle">
          <div v-if="wrappedLines && wrappedLines.length > 1" class="wrapped-text">
            <span v-for="(line, i) in wrappedLines" :key="i" :style="textStyle" class="wrapped-line">{{ line }}</span>
          </div>
          <span v-else :style="textStyle">{{ el.text || '_' }}</span>
        </div>
      </div>

    </div>
    <Teleport v-if="el.visible && selected" to="#selection-overlay">
      <div class="sel-outline-global" :style="[wrapperStyle, { border: `${0.5 * props.zoom}px dashed #0a246a` }]">
        <div class="name-label-global">{{ el.locked ? '🔒 ' : '' }}{{ el.name }}</div>
        <div
          v-if="!el.locked"
          class="resize-handle-global"
          @mousedown.stop="onResizeStart"
        />
      </div>
    </Teleport>
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

  const emit = defineEmits(['mousedown', 'resize-start', 'contextmenu'])

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


  function measureTextWidth(text, fontFamily, fontSize, fontIndex)
  {
    const cv = document.createElement('canvas')
    const ctx = cv.getContext('2d')
    ctx.font = `400 ${fontSize}px '${fontFamily}'`
    return ctx.measureText(text).width
  }

  function wrapText(text, fontFamily, fontSize, maxWidth)
  {
    const words = text.split(' ')
    const lines = []

    for (const word of words) {
      if (lines.length === 0) {
        lines.push(word)
        continue
      }
      const last = lines[lines.length - 1]
      const test = last + ' ' + word
      const w = measureTextWidth(test, fontFamily, fontSize)
      if (w > maxWidth) {
        lines.push(word)
      } else {
        lines[lines.length - 1] = test
      }
    }
    return lines
  }

  function drawTinted()
  {
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

      ctx.globalAlpha = a / 255

      if (r === 255 && g === 255 && b === 255) {
        // white = no tint
        ctx.drawImage(img, 0, 0)
      } else {
        // draw tint color first
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(0, 0, cv.width, cv.height)
        // multiply image on top — dark pixels stay dark, light pixels get tinted
        ctx.globalCompositeOperation = 'multiply'
        ctx.drawImage(img, 0, 0)
        // restore alpha from original image
        ctx.globalCompositeOperation = 'destination-in'
        ctx.drawImage(img, 0, 0)
        ctx.globalCompositeOperation = 'source-over'
      }

      ctx.globalAlpha = 1
    })
  }

  
  const FONT_Y_SCALE = [8.85, 8.74, 8.75, 9.38, 9.0]
  const FONT_X_SCALE = [0.996, 0.9, 0.954, 1.0, 1.0]
  const FONT_BASELINE = [-0.057, -0.08, 0.2, 0.14, 0]

  const wrappedLines = computed(() => {
    if (props.el.type !== 'label' && props.el.type !== 'box') return null
    const font = FONTS[props.el.font] || FONTS[0]
    const yScale = FONT_Y_SCALE[props.el.font] ?? 9.0
    const xScale = FONT_X_SCALE[props.el.font] ?? 1.0
    const fs = Math.max(6, props.el.letterY * yScale * props.zoom)
    const scaleX = (props.el.letterY > 0
      ? (props.el.letterX / props.el.letterY) * 3.75 * xScale
      : xScale) * (FONT_WIDTH_SCALE[props.el.font] ?? 1)
    const maxWidth = (props.el.w * props.zoom) / scaleX * 0.96
    return wrapText(props.el.text || '', font.family, fs, maxWidth)
  })

  const wrappedHeight = computed(() => {
    if (!wrappedLines.value || wrappedLines.value.length <= 1) return null
    const yScale = FONT_Y_SCALE[props.el.font] ?? 9.0
    const fs = Math.max(6, props.el.letterY * yScale * props.zoom)
    const isBox = props.el.type === 'box'
    const contentHeight = wrappedLines.value.length * fs * 1.3 + (isBox ? 12 * props.zoom : 0)
    const elHeight = Math.max(Math.abs(props.el.h * props.zoom), 2) + (isBox ? 12 * props.zoom : 0)
    return Math.max(contentHeight, elHeight)
  })

  const FONT_OFFSET_X = [
    [1, 1,-52],
    [0, 1, -53],
    [0, 0.5, -54],
    [0.3, 0.5, -54.1],
    [0, 0, 0],
  ]

  const FONT_OFFSET_Y = [
    [4, 4.1, -1 ],
    [3, 3, -3 ],
    [1, 1, -2 ],
    [1, 1, -2],
    [0, 0, 0 ],
  ]
  

  const BOX_OFFSET_X = [
    [-1, -1, 0],
    [-1, -1, 0],
    [-1, -1, 0],
    [-1, -1, 0],
    [0, 0, 0],
  ]

  const BOX_OFFSET_Y = [
    [-5, -5, 0],
    [-5, -5, 0],
    [-3, -3.5, 0],
    [-4, -3.5, 0],
    [0, 0, 0],
  ]

  const BOX_OFFSET_W = [
    [-2, 2.5, 0],
    [-2, 2.2, 0],
    [-2, 2.2, 0],
    [-2, 2.2, 0],
    [0, 0, 0],
  ]

  const BOX_OFFSET_H = [
    [5, 4, 0],
    [5, 4, 0],
    [3.6, 4, 0],
    [5, 4, 0],
    [0, 0, 0],
  ]

  const FONT_WIDTH_SCALE = [1, 1.05, 1.05, 1.02, 1] 


  const FONT_OFFSET_W = [0, 0, 0, 0, 0]

  const isText = computed(() =>
    props.el.type === 'label'
  )

  const wrapperStyle = computed(() => {
    const w = props.el.w * props.zoom
    const h = props.el.h * props.zoom
    const isBox = props.el.type === 'box'
    const isSprite = props.el.type === 'sprite'
    const isText2 = props.el.type === 'label'
    const align = props.el.align ?? 0
    const baselineShift = isText2 ? (FONT_BASELINE[props.el.font] ?? 0.72) : 0

    const boxOffsetX = isText2 ? ((BOX_OFFSET_X[props.el.font ?? 0]?.[align] ?? 0)) * props.zoom : 0
    const boxOffsetY = isText2 ? ((BOX_OFFSET_Y[props.el.font ?? 0]?.[align] ?? 0)) * props.zoom : 0
    const boxOffsetW = isText2 ? ((BOX_OFFSET_W[props.el.font ?? 0]?.[align] ?? 0)) * props.zoom : 0
    const boxOffsetH = isText2 ? ((BOX_OFFSET_H[props.el.font ?? 0]?.[align] ?? 0)) * props.zoom : 0
    const fontOffsetW = isText2 ? (FONT_OFFSET_W[props.el.font ?? 0] ?? 0) * props.zoom : 0

    return {
      left:   (props.el.x * props.zoom) + (w < 0 ? w : 0) + (isBox ? -4 * props.zoom : 0) + boxOffsetX + 'px',
      top:    (props.el.y * props.zoom) + (h < 0 ? h : 0) - (props.el.h * props.zoom * baselineShift * 0.3) + (isBox ? -7 * props.zoom : 0) + (isSprite ? -3 * props.zoom : 0) + boxOffsetY + 'px',
      width:  Math.max(Math.abs(w), 4) + (isBox ? 3 * props.zoom : 0) + fontOffsetW + boxOffsetW + 'px',
      height: Math.max(Math.abs(h), 2) + (isBox ? 12 * props.zoom : 0) + boxOffsetH + 'px',
      cursor: props.el.locked ? 'default' : 'move',
      zIndex: (props.el.layer || 0) + 10,
      transform: `scale(${w < 0 ? -1 : 1}, ${h < 0 ? -1 : 1})`,
      transformOrigin: 'center center',
    }
  })

  const fontOffsetStyle = computed(() => {
    const align = props.el.align ?? 0
    const isText2 = props.el.type === 'label'
    const x = isText2 ? ((FONT_OFFSET_X[props.el.font ?? 0]?.[align] ?? 0)) * props.zoom : 0
    const y = isText2 ? ((FONT_OFFSET_Y[props.el.font ?? 0]?.[align] ?? 0)) * props.zoom : 0
    return { transform: `translate(${x}px, ${y}px)` }
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

  const textWrapStyle = computed(() => ({
    background: props.el.useBox ? rgbaToCSS(props.el.boxColor) : 'transparent',
    justifyContent: props.el.align === 1 ? 'center' : props.el.align === 2 ? 'flex-end' : 'flex-start',
    ...(props.el.useBox && props.el.align === 2 ? {
      position: 'absolute',
      left: -(props.el.x * props.zoom) + 'px',
      width: (props.el.x + props.el.w + 3) * props.zoom + 'px',
    } : {}),
  }))


  const textStyle = computed(() => {
    const font = FONTS[props.el.font] || FONTS[0]
    const yScale = FONT_Y_SCALE[props.el.font] ?? 9.0
    const xScale = FONT_X_SCALE[props.el.font] ?? 1.0
    const fs = Math.max(6, props.el.letterY * yScale * props.zoom)
    const scaleX = (props.el.letterY > 0
      ? (props.el.letterX / props.el.letterY) * 3.75 * xScale
      : xScale) * (FONT_WIDTH_SCALE[props.el.font] ?? 1)

    const alignOffset = props.el.align === 1
      ? `translateX(${((scaleX - 1) / 2) * -100}%)`
      : props.el.align === 2
      ? `translateX(${((scaleX - 1)) * -100}%)`
      : ''

    return {
      color:           rgbaToCSS(props.el.color),
      fontSize:        fs + 'px',
      fontFamily:      `'${font.family}', sans-serif`,
      fontWeight:      '400',
      fontStyle:       'normal',
      textTransform:   props.el.font === 2 ? 'uppercase' : 'none',
      textShadow:      buildTextShadow(props.el.outline, props.el.shadow, props.el.bgColor, props.zoom),
      whiteSpace:      'nowrap',
      lineHeight:      '1',
      display:         wrappedLines.value?.length > 1 ? 'block' : 'inline-block',
      transformOrigin: 'left top',
      transform:       `${alignOffset} scaleX(${scaleX})`,
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
    pointer-events: all;
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
    font-variant-ligatures: none;
    font-feature-settings: "liga" 0, "clig" 0;
    display: flex;
    align-items: center;
    overflow: visible;
    padding: 0 2px;
    box-sizing: border-box;
  }
  .progress-wrap {
    display: block;
  }
  .wrapped-line {
    display: block;
  }
  </style>
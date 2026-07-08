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

      <!-- Model previewer -->
      <div v-else-if="el.type === 'model'" class="fill model-wrap">
        <ModelRenderer
          :modelId="el.modelId ?? 411"
          :modelType="el.modelType ?? 'vehicle'"
          :modelZoom="el.modelZoom ?? 1.0"
          :modelRotX="el.modelRotX ?? 0.0"
          :modelRotY="el.modelRotY ?? 0.0"
          :modelRotZ="el.modelRotZ ?? 0.0"
          :modelColor1="el.modelColor1 ?? 0"
          :modelColor2="el.modelColor2 ?? 0"
          :color="el.color ?? 0xFFFFFFFF"
          :boxColor="el.boxColor ?? 0x00000000"
          :width="Math.abs(el.w)"
          :height="Math.abs(el.h)"
          :zoom="zoom"
        />
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
          <span v-else-if="textRuns" :style="textStyle">
            <span v-for="(run, i) in textRuns" :key="i" :style="getTextStyle(run.isNumeric)">{{ run.text }}</span>
          </span>
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
        <div
          v-if="!el.locked && el.type === 'model'"
          class="rot-handle-global"
          title="Drag to rotate (X/Y) · Shift = Z"
          @mousedown.stop="onRotStart"
        />
      </div>
    </Teleport>
  </template>

  <script setup>
  import { computed, ref, watch, nextTick } from 'vue'
  import { rgbaToCSS, numToHex6, hexToRGBA } from '../../utils/colors'
  import { spriteImagePath, localSpriteImagePath } from '../../constants/sprites'
  import { FONTS } from '../../constants/fonts'
  import ModelRenderer from './ModelRenderer.vue'


  const props = defineProps({
    el: { type: Object, required: true },
    selected: { type: Boolean, default: false },
    zoom: { type: Number, default: 1 },
  })

  const emit = defineEmits(['mousedown', 'resize-start', 'rot-drag-start', 'contextmenu'])

  const imgFailed = ref(false)
  const localPath = ref(null)
  const spriteImgRef = ref(null)
  const canvasRef = ref(null)

  const spritePath = computed(() => {
    if (props.el.type !== 'sprite') return null
    if (props.el.spriteImg) return props.el.spriteImg
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

  watch(spritePath, () => {
    imgFailed.value = false
    localPath.value = null
    nextTick(() => drawTinted())
  })

  watch(() => props.el.color, () => drawTinted())
  watch(() => props.el.w, () => drawTinted())
  watch(() => props.el.h, () => drawTinted())


  function measureTextWidth(text, fontFamily, fontSize)
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
      const cv = canvasRef.value
      if (!img || !cv || !img.complete || img.naturalWidth === 0) return

      cv.width = img.naturalWidth
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

  const FONT_WRAP_TOLERANCE = [0.96, 0.96, 1.15, 1.15, 0.96]


  const FONT_NUMBER_OFFSET_X = [
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
  ]

  const FONT_NUMBER_OFFSET_Y = [
    [0.15, 0.15, 0.15],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
  ]

  const FONT_NUMBER_OFFSET_W = [
    [1.18, 1.18, 1.18],
    [1.12, 1.12, 1.12],
    [1.10, 1.10, 1.10],
    [0.95, 0.95, 0.95],
    [1.0, 1.0, 1.0],
  ]

  const FONT_NUMBER_OFFSET_H = [
    [1.18, 1.18, 1.18],
    [1.38, 1.38, 1.38],
    [1.10, 1.10, 1.10],
    [1.12, 1.12, 1.12],
    [1.0, 1.0, 1.0],
  ]

  const FONT_NUMBER_LETTER_SPACING = [
    [0.07, 0.07, 0.07],
    [0.0, 0.0, 0.0],
    [-0.13, -0.13, -0.13],
    [null, null, null],
    [null, null, null],
  ]

  const FONT_NUMBER_WORD_SPACING = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]

  const FONT_NUMBER_BOX_OFFSET_X = [
    [-0.07, -0.2, -0.3],
    [0.0, -0.09, -0.145],
    [-0.05, -0.13, -0.2],
    [0.0, 0.05, 0.15],
    [0.0, 0.0, 0.0],
  ]

  const FONT_NUMBER_BOX_OFFSET_Y = [
    [-0.15, -0.15, -0.15],
    [-0.1, -0.1, -0.1],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
  ]

  const NUMERIC_ONLY_RE = /^[\d\s.,:\-+%$/]+$/
  const HAS_NUMERIC_RE = /[\d.,:\-+%$/]/
  const HAS_ALPHA_RE = /[^\d\s.,:\-+%$/]/

  function isNumericText(text) { return NUMERIC_ONLY_RE.test(text) }
  function isMixedText(text) { return HAS_NUMERIC_RE.test(text) && HAS_ALPHA_RE.test(text) }

  function splitTextRuns(text) {
    const runs = []
    let current = ''
    let currentIsNumeric = /[\d.,:\-+%$/\s]/.test(text[0] ?? '')
    for (const ch of text) {
      const chIsNumeric = /[\d.,:\-+%$/\s]/.test(ch)
      if (chIsNumeric !== currentIsNumeric) {
        if (current) runs.push({ text: current, isNumeric: currentIsNumeric })
        current = ch
        currentIsNumeric = chIsNumeric
      } else {
        current += ch
      }
    }
    if (current) runs.push({ text: current, isNumeric: currentIsNumeric })
    return runs
  }

  function getNumericOffsets(fontIndex, align, text) {
    const numeric = isNumericText(text)
    const mixed = !numeric && isMixedText(text)
    if (!numeric && !mixed) return { x: 0, y: 0, w: 1, h: 1, letterSpacing: null, wordSpacing: null, boxX: 0, boxY: 0 }
    return {
      x: mixed ? 0 : (FONT_NUMBER_OFFSET_X[fontIndex]?.[align] ?? 0.0),
      y: mixed ? 0 : (FONT_NUMBER_OFFSET_Y[fontIndex]?.[align] ?? 0.0),
      w: FONT_NUMBER_OFFSET_W[fontIndex]?.[align] ?? 1.0,
      h: FONT_NUMBER_OFFSET_H[fontIndex]?.[align] ?? 1.0,
      letterSpacing: mixed ? null : (FONT_NUMBER_LETTER_SPACING[fontIndex]?.[align] ?? null),
      wordSpacing: mixed ? null : (FONT_NUMBER_WORD_SPACING[fontIndex]?.[align] ?? null),
      boxX: mixed ? 0 : (FONT_NUMBER_BOX_OFFSET_X[fontIndex]?.[align] ?? 0.0),
      boxY: mixed ? 0 : (FONT_NUMBER_BOX_OFFSET_Y[fontIndex]?.[align] ?? 0.0),
    }
  }

  const wrappedLines = computed(() => {
    if (props.el.type !== 'label' && props.el.type !== 'box') return null
    const font = FONTS[props.el.font] || FONTS[0]
    const yScale = FONT_Y_SCALE[props.el.font] ?? 9.0
    const xScale = FONT_X_SCALE[props.el.font] ?? 1.0
    const numericOffsets = getNumericOffsets(props.el.font, props.el.align ?? 0, props.el.text || '')
    const fs = Math.max(6, props.el.letterY * yScale * props.zoom * numericOffsets.h)
    const scaleX = (props.el.letterY > 0
      ? (props.el.letterX / props.el.letterY) * 3.75 * xScale
      : xScale) * (FONT_WIDTH_SCALE[props.el.font] ?? 1)
    const maxWidth = (props.el.w * props.zoom) / scaleX * (FONT_WRAP_TOLERANCE[props.el.font] ?? 0.96)
    return wrapText(props.el.text || '', font.family, fs, maxWidth)
  })

  const wrappedHeight = computed(() => {
    if (!wrappedLines.value || wrappedLines.value.length <= 1) return null
    const yScale = FONT_Y_SCALE[props.el.font] ?? 9.0
    const numericOffsets = getNumericOffsets(props.el.font, props.el.align ?? 0, props.el.text || '')
    const fs = Math.max(6, props.el.letterY * yScale * props.zoom * numericOffsets.h)
    const isBox = props.el.type === 'box'
    const contentHeight = wrappedLines.value.length * fs * 1.3 + (isBox ? 12 * props.zoom : 0)
    const elHeight = Math.max(Math.abs(props.el.h * props.zoom), 2) + (isBox ? 12 * props.zoom : 0)
    return Math.max(contentHeight, elHeight)
  })

    const FONT_OFFSET_X = [
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
  ]

  const FONT_OFFSET_Y = [
    [-0.13, -0.13, -0.13],
    [-0.2, -0.2, -0.2],
    [-0.3, -0.3, -0.3],
    [-0.3, -0.3, -0.3],
    [0.0, 0.0, 0.0],
  ]

  const FONT_LETTER_SPACING = [
    [-0.05, -0.05, -0.05],
    [0.02, 0.02, 0.02],
    [0.02, 0.02, 0.02],
    [-0.03, -0.03, -0.03],
    [0.0, 0.0, 0.0],
  ]

  const FONT_WORD_SPACING = [
    [0.1, 0.1, 0.1],
    [0.1, 0.1, 0.1],
    [0.1, 0.1, 0.1],
    [0.2, 0.2, 0.2],
    [0.0, 0.0, 0.0],
  ]

  const FONT_WIDTH_SCALE = [1.15, 1, 1, 1.04, 1]

  const BOX_OFFSET_X = [
    [0.0, -0.49, -0.98],
    [-0.015, -0.50, -0.995],
    [-0.015, -0.5, -0.99],
    [0.0, -0.505, -1.007],
    [0.0, 0.0, 0.0],
  ]

  const BOX_OFFSET_Y = [
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
  ]

  const BOX_OFFSET_W = [
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
  ]

  const BOX_OFFSET_H = [
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
  ]

  const FONT_OFFSET_W = [0, 0, 0, 0, 0]

  function getFontSize(el) {
    const yScale = FONT_Y_SCALE[el.font] ?? 9.0
    const numericOffsets = getNumericOffsets(el.font, el.align ?? 0, el.text || '')
    return Math.max(6, el.letterY * yScale * props.zoom * numericOffsets.h)
  }

  const isText = computed(() =>
    props.el.type === 'label'
  )

  const wrapperStyle = computed(() => {
    const snap = (val) => Math.round(val * 4) / 4
    const w = props.el.w * props.zoom
    const h = props.el.h * props.zoom
    const isBox = props.el.type === 'box'
    const isSprite = props.el.type === 'sprite'
    const isText2 = props.el.type === 'label'
    const align = props.el.align ?? 0

    const fs = getFontSize(props.el)
    const numericOffsets = getNumericOffsets(props.el.font ?? 0, align, props.el.text || '')
    const numericOffsetW = isText2 ? (numericOffsets.w - 1) * fs : 0
    const boxOffsetX = isText2 ? (BOX_OFFSET_X[props.el.font ?? 0]?.[align] ?? 0) * Math.abs(w) + numericOffsets.boxX * fs : 0
    const boxOffsetY = isText2 ? (BOX_OFFSET_Y[props.el.font ?? 0]?.[align] ?? 0) * fs + numericOffsets.boxY * fs : 0
    const boxOffsetW = isText2 ? (BOX_OFFSET_W[props.el.font ?? 0]?.[align] ?? 0) * fs : 0
    const boxOffsetH = isText2 ? (BOX_OFFSET_H[props.el.font ?? 0]?.[align] ?? 0) * fs : 0
    const fontOffsetW = isText2 ? (FONT_OFFSET_W[props.el.font ?? 0] ?? 0) * fs : 0

    return {
      left: snap(props.el.x * props.zoom) + (w < 0 ? w : 0) + (isBox ? -4 * props.zoom : 0) + boxOffsetX + 'px',
      top: snap(props.el.y * props.zoom) + (h < 0 ? h : 0) + (isBox ? -7 * props.zoom : 0) + (isSprite ? -3 * props.zoom : 0) + boxOffsetY + 'px',
      width: (isSprite ? Math.abs(w) : Math.max(Math.abs(w), 4 * props.zoom)) + (isBox ? 3 * props.zoom : 0) + fontOffsetW + boxOffsetW + numericOffsetW + 'px',
      height: (isSprite ? Math.abs(h) : Math.max(Math.abs(h), 2 * props.zoom)) + (isBox ? 12 * props.zoom : 0) + boxOffsetH + 'px',
      cursor: props.el.locked ? 'default' : 'move',
      zIndex: (props.el.layer || 0) + 10,
      transform: `scale(${w < 0 ? -1 : 1}, ${h < 0 ? -1 : 1})`,
      transformOrigin: 'center center',
      letterSpacing: (numericOffsets.letterSpacing ?? FONT_LETTER_SPACING[props.el.font ?? 0]?.[align] ?? 0) * fs + 'px',
      wordSpacing: (numericOffsets.wordSpacing ?? FONT_WORD_SPACING[props.el.font ?? 0]?.[align] ?? 0) * fs + 'px',
    }
  })

  const fontOffsetStyle = computed(() => {
    const align = props.el.align ?? 0
    const isText2 = props.el.type === 'label'
    const baseFs = FONT_Y_SCALE[props.el.font ?? 0] ?? 9.0
    const xUnit = align === 0 ? baseFs * props.zoom : Math.abs(props.el.w) * props.zoom
    const numericOffsets = isText2 ? getNumericOffsets(props.el.font ?? 0, align, props.el.text || '') : null
    const fs = isText2 ? getFontSize(props.el) : 0
    const x = isText2 ? (FONT_OFFSET_X[props.el.font ?? 0]?.[align] ?? 0) * xUnit + (numericOffsets.x ?? 0) * fs : 0
    const y = isText2 ? (FONT_OFFSET_Y[props.el.font ?? 0]?.[align] ?? 0) * baseFs * props.zoom + (numericOffsets.y ?? 0) * fs : 0
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


  const textRuns = computed(() => {
    const text = props.el.text || ''
    if (!isMixedText(text)) return null
    return splitTextRuns(text)
  })

  function getTextStyle(isNumeric = false) {
    const font = FONTS[props.el.font] || FONTS[0]
    const yScale = FONT_Y_SCALE[props.el.font] ?? 9.0
    const xScale = FONT_X_SCALE[props.el.font] ?? 1.0
    const align = props.el.align ?? 0
    const text = props.el.text || ''
    const numericOffsets = isNumeric
      ? getNumericOffsets(props.el.font, align, '0')
      : getNumericOffsets(props.el.font, align, text)
    const fs = Math.max(6, props.el.letterY * yScale * props.zoom * numericOffsets.h)
    const scaleX = (props.el.letterY > 0
      ? (props.el.letterX / props.el.letterY) * 3.75 * xScale
      : xScale) * (FONT_WIDTH_SCALE[props.el.font] ?? 1) * numericOffsets.w

    const alignOffset = align === 1
      ? `translateX(${((scaleX - 1) / 2) * -100}%)`
      : align === 2
      ? `translateX(${((scaleX - 1)) * -100}%)`
      : ''

    const style = {
      color: rgbaToCSS(props.el.color),
      fontSize: fs + 'px',
      fontFamily: `'${font.family}', sans-serif`,
      fontWeight: '400',
      fontStyle: 'normal',
      textTransform: props.el.font === 2 ? 'uppercase' : 'none',
      textShadow: buildTextShadow(props.el.outline, props.el.shadow, props.el.bgColor, props.zoom),
      whiteSpace: 'nowrap',
      lineHeight: '1',
      transformOrigin: 'left top',
      transform: `${alignOffset} scaleX(${scaleX})`,
    }

    if (isNumeric) {
      const ls = FONT_NUMBER_LETTER_SPACING[props.el.font]?.[align] ?? null
      const ws = FONT_NUMBER_WORD_SPACING[props.el.font]?.[align] ?? null
      if (ls !== null) style.letterSpacing = ls * fs + 'px'
      if (ws !== null) style.wordSpacing = ws * fs + 'px'
    }

    return style
  }

  const textStyle = computed(() => ({
    ...getTextStyle(false),
    display: wrappedLines.value?.length > 1 ? 'block' : 'inline-block',
  }))

  function onMouseDown(e) {
    if (e.button !== 0) return
    if (props.el.locked) return
    emit('mousedown', e, props.el)
  }

  function onResizeStart(e) {
    if (e.button !== 0) return
    emit('resize-start', e, props.el)
  }

  function onRotStart(e) {
    if (e.button !== 0) return
    emit('rot-drag-start', e, props.el)
  }

  function buildTextShadow(outline, shadow, bgColor, zoom) {
    const col = rgbaToCSS(bgColor ?? 0x000000FF)
    const parts = []
    if (outline > 0) {
      const o = outline * 1 * zoom
      parts.push(
        `-${o}px -${o}px 0 ${col}`,
        `${o}px -${o}px 0 ${col}`,
        `-${o}px ${o}px 0 ${col}`,
        `${o}px ${o}px 0 ${col}`,
        `-${o}px 0 0 ${col}`,
        `${o}px 0 0 ${col}`,
        `0 -${o}px 0 ${col}`,
        `0 ${o}px 0 ${col}`,
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
  .model-wrap {
    position: relative;
    overflow: hidden;
  }
  </style>
  <style>
  .rot-handle-global {
    position: absolute;
    width: 8px;
    height: 8px;
    bottom: -16px;
    right: -16px;
    background: #C80041;
    border: 1px solid #fff;
    border-radius: 50%;
    cursor: grab;
    pointer-events: all;
  }
  .rot-handle-global:active { cursor: grabbing; }
  </style>
  <style scoped>

  .model-frame {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
    pointer-events: none;
    user-select: none;
    background: transparent;
  }
  .model-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(200,0,65,0.06);
    border: 1px dashed rgba(200,0,65,0.35);
    box-sizing: border-box;
  }
  .model-fallback-id {
    font-family: 'Tahoma', sans-serif;
    font-size: 9px;
    font-weight: 700;
    color: rgba(200,0,65,0.6);
  }
  </style>
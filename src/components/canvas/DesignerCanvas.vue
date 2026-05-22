<template>
  <div class="canvas-scroll" data-cw>
    <div class="canvas-padding">
      <div
        ref="cvRef"
        class="canvas"
        :style="canvasStyle"
        @mousedown="onCanvasMouseDown"
        @contextmenu.prevent="e => emit('contextmenu', e)"
        @dragover.prevent
        @drop="onDrop"
      >
        <CanvasBackground :bgImage="bgImage" :opacity="bgOpacity" />
        <GridOverlay :visible="showGrid" :gridSize="gridSize" :zoom="zoom" />
        <SafeZoneOverlay :visible="showSafe" :zoom="zoom" />

        <!-- Reference images -->
        <div class="layer drop-layer" style="z-index: 3">
          <RefImage
            v-for="r in refs"
            :key="r.id"
            :r="r"
            :selected="selRef === r.id"
            :zoom="zoom"
            @mousedown="(e, r) => emit('ref-mousedown', e, r)"
            @resize-start="(e, r) => emit('ref-resize-start', e, r)"
          />
        </div>

        <!-- TD elements -->
        <div class="layer drop-layer" style="z-index: 5">
          <TDElement
            v-for="el in sorted"
            :key="el.id"
            :el="el"
            :selected="selected.has(el.id)"
            :zoom="zoom"
            @mousedown="(e, el) => emit('el-mousedown', e, el)"
            @contextmenu="(e, el) => emit('contextmenu', e, el)"
            @resize-start="(e, el) => emit('el-resize-start', e, el)"
          />
        </div>

        <MarqueeSelect :marquee="marquee" :zoom="zoom" />

        <!-- Teleport target: selection outlines, name labels, resize handles always render here on top -->
        <div id="selection-overlay" style="position:absolute;inset:0;pointer-events:none;z-index:9999;" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CW, CH } from '../../constants/canvas'
import CanvasBackground from './CanvasBackground.vue'
import GridOverlay from './GridOverlay.vue'
import SafeZoneOverlay from './SafeZoneOverlay.vue'
import MarqueeSelect from './MarqueeSelect.vue'
import TDElement from './TDElement.vue'
import RefImage from './RefImage.vue'

const props = defineProps({
  sorted:    { type: Array,   default: () => [] },
  selected:  { type: Object,  default: () => new Set() },
  refs:      { type: Array,   default: () => [] },
  selRef:    { type: String,  default: null },
  marquee:   { type: Object,  default: null },
  zoom:      { type: Number,  default: 1.3 },
  showGrid:  { type: Boolean, default: true },
  showSafe:  { type: Boolean, default: true },
  gridSize:  { type: Number,  default: 5 },
  bgImage:   { type: String,  default: null },
  bgOpacity: { type: Number,  default: 100 },
  widescreen: { type: Boolean, default: false },
})

const emit = defineEmits([
  'contextmenu',
  'canvas-mousedown',
  'el-mousedown',
  'el-resize-start',
  'ref-mousedown',
  'ref-resize-start',
  'sprite-drop',
])

const cvRef = ref(null)

const canvasStyle = computed(() => ({
  width:  CW * props.zoom + 'px',
  height: CH * props.zoom + 'px',
  ...(props.widescreen ? { transform: `scaleX(${16/9 / (4/3)})`, transformOrigin: 'top left' } : {})
}))

function canvasPos(e)
{
  const r = cvRef.value.getBoundingClientRect()
  const scaleX = props.widescreen ? (16/9) / (4/3) : 1
  return {
    x: Math.round((e.clientX - r.left) / props.zoom / scaleX),
    y: Math.round((e.clientY - r.top)  / props.zoom),
  }
}

function onCanvasMouseDown(e) {
  if (e.button !== 0) return
  emit('canvas-mousedown', e, canvasPos(e))
}

function onDrop(e) {
  const text = e.dataTransfer.getData('sprite')
  if (!text) return
  const pos = canvasPos(e)
  emit('sprite-drop', text, pos)
}

defineExpose({ canvasPos })
</script>

<style scoped>
.canvas-scroll {
  flex: 1;
  background: var(--bg0);
  overflow: auto;
}
.canvas-padding {
  padding: 24px;
  display: inline-block;
}
.canvas {
  position: relative;
  cursor: crosshair;
  box-shadow: 0 0 0 1px var(--border2), 0 8px 32px rgba(0,0,0,0.6);
  overflow: hidden;
}
.layer {
  position: absolute;
  inset: 0;
}

:global(.sel-outline-global) {
  position: absolute;
  border: 50px dashed #0a246a;
  box-sizing: border-box;
  pointer-events: none;
}
:global(.name-label-global) {
  position: absolute;
  top: -16px;
  left: 0;
  font-family: 'Tahoma', sans-serif;
  font-size: 9px;
  font-weight: 700;
  color: #000;
  background: #ffffffd9;
  padding: 1px 5px;
  border-radius: 2px;
  white-space: nowrap;
  pointer-events: none;
}
:global(.resize-handle-global) {
  position: absolute;
  width: 8px;
  height: 8px;
  bottom: -4px;
  right: -4px;
  background: #0a246a;
  border: 1px solid #fff;
  cursor: se-resize;
  pointer-events: all;
}
</style>
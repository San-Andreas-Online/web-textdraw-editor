<template>
  <div
    v-if="r.visible"
    class="ref-image"
    :style="wrapperStyle"
    @mousedown.stop="onMouseDown"
  >
    <img :src="r.src" :alt="r.name" class="ref-img" draggable="false" />

    <div v-if="selected" class="name-label">
      {{ r.locked ? '🔒 ' : '' }}{{ r.name }}
    </div>

    <div v-if="r.locked && selected" class="lock-overlay">🔒</div>

    <div
      v-if="selected && !r.locked"
      class="resize-handle"
      @mousedown.stop="onResizeStart"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  r:        { type: Object, required: true },
  selected: { type: Boolean, default: false },
  zoom:     { type: Number, default: 1 },
})

const emit = defineEmits(['mousedown', 'resize-start'])

const wrapperStyle = computed(() => ({
  left:    props.r.x * props.zoom + 'px',
  top:     props.r.y * props.zoom + 'px',
  width:   Math.max(props.r.w * props.zoom, 20) + 'px',
  height:  Math.max(props.r.h * props.zoom, 20) + 'px',
  opacity: props.r.opacity / 100,
  cursor: props.r.locked ? 'default' : 'move',
  outline: props.selected
    ? '1.5px dashed rgba(180,120,0,0.9)'
    : '1px dashed rgba(180,120,0,0.3)',
  outlineOffset: '-1px',
  zIndex: 2,
}))

function onMouseDown(e) {
  if (e.button !== 0 || props.r.locked) return
  emit('mousedown', e, props.r)
}

function onResizeStart(e) {
  if (e.button !== 0) return
  emit('resize-start', e, props.r)
}
</script>

<style scoped>
.ref-image {
  position: absolute;
  box-sizing: border-box;
  pointer-events: all;
}
.ref-img {
  width: 100%;
  height: 100%;
  object-fit: fill;
  display: block;
  pointer-events: none;
  user-select: none;
}
.name-label {
  position: absolute;
  top: -14px;
  left: 0;
  font-family: 'Tahoma', sans-serif;
  font-size: 8px;
  color: #804000;
  background: #ece9d8;
  padding: 1px 4px;
  border: 1px solid #a0a0a0;
  white-space: nowrap;
  pointer-events: none;
  z-index: 20;
}
.lock-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  opacity: 0.6;
  pointer-events: none;
}
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  bottom: -4px;
  right: -4px;
  background: #804000;
  border: 1px solid #fff;
  cursor: se-resize;
  z-index: 20;
}
</style>

<template>
  <div v-if="visible" class="grid-overlay" :style="gridStyle" />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible:  { type: Boolean, default: true },
  gridSize: { type: Number, default: 5 },
  zoom:     { type: Number, default: 1 },
})

const gridStyle = computed(() => {
  const step = props.gridSize * props.zoom
  return {
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)
    `,
    backgroundSize: `${step}px ${step}px`,
  }
})
</script>

<style scoped>
.grid-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
</style>

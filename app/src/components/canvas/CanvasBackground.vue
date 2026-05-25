<template>
  <div class="canvas-bg" :style="bgStyle" />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  bgImage: { type: String, default: null },
  opacity: { type: Number, default: 100 },
})

const bgStyle = computed(() => {
  if (props.bgImage) {
    return {
      backgroundImage: `url(${props.bgImage})`,
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      opacity: props.opacity / 100,
    }
  }
  return {
    opacity: props.opacity / 100,
  }
})
</script>

<style scoped>
.canvas-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-color: #0e0e0e;
  background-image:
    radial-gradient(ellipse 100% 100% at 50% 50%, rgba(197, 29, 96, 0.23) 0%, transparent 70%);
  background-size: auto;
}
</style>
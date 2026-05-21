<template>
  <div
    v-if="marquee && marquee.w > 2 && marquee.h > 2"
    class="marquee"
    :style="{
      left:   marquee.x * zoom + 'px',
      top:    marquee.y * zoom + 'px',
      width:  marquee.w * zoom + 'px',
      height: marquee.h * zoom + 'px',
    }"
  />
</template>

<script setup>
defineProps({
  marquee: { type: Object, default: null },
  zoom:    { type: Number, default: 1 },
})
</script>

<style scoped>
.marquee {
  position: absolute;
  border: 1px dashed #C80041;
  background: #a8406123;
  pointer-events: none;
  box-sizing: border-box;
  z-index: 99;
}
</style>

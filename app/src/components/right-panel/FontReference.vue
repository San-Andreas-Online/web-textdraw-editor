<template>

</template>

<script setup>
import { ref } from 'vue'
import XpPanel from '../shared/XpPanel.vue'
import { FONTS } from '../../constants/fonts'

const imgError = ref(false)
</script>

<style scoped>
.font-ref { padding: 0; }
.font-rows { margin-bottom: 6px; }
.font-row {
  display: flex;
  gap: 6px;
  padding: 2px 0;
  border-bottom: 1px solid #e0ddd6;
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
}
.font-id {
  color: #0a246a;
  width: 14px;
  flex-shrink: 0;
  font-weight: 700;
}
.font-name { color: #222; }
.preview-wrap {
  border: 1px solid #a0a0a0;
  background: #000;
  padding: 2px;
}
.preview-img {
  width: 100%;
  display: block;
  image-rendering: pixelated;
}
.no-img {
  font-family: 'Tahoma', sans-serif;
  font-size: 9px;
  color: #888;
  text-align: center;
  padding: 8px;
  line-height: 1.6;
}
</style>
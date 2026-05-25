<template>
  <div class="swatch">
    <input
      type="color"
      class="picker"
      :value="hex6"
      @input="e => onColorChange(e.target.value)"
    />
    <input
      type="text"
      class="hex"
      :value="hex8"
      @change="e => onHexChange(e.target.value)"
      maxlength="10"
      spellcheck="false"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { numToHex8, numToHex6, cssToNum } from '../../utils/colors'

const props = defineProps({ modelValue: Number })
const emit = defineEmits(['update:modelValue'])

const hex6 = computed(() => numToHex6(props.modelValue))
const hex8 = computed(() => numToHex8(props.modelValue))

function onColorChange(hex6val) {
  const alpha = props.modelValue & 0xFF
  emit('update:modelValue', cssToNum(hex6val, alpha))
}
function onHexChange(raw) {
  const v = parseInt(raw.replace(/^0x/i, ''), 16)
  if (!isNaN(v)) emit('update:modelValue', v >>> 0)
}
</script>

<style scoped>
.swatch {
  display: flex;
  gap: 4px;
  align-items: center;
}
.picker {
  width: 28px;
  height: 24px;
  padding: 0;
  border: 1px solid #2e2e2e;
  border-radius: 3px;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}
.picker:hover { border-color: #B03060; }
.hex {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  font-family: 'Tahoma', monospace;
  font-size: 10px;
  padding: 3px 5px;
  color: #c0c0c0;
  background: #111;
  border: 1px solid #2e2e2e;
  border-radius: 3px;
  outline: none;
}
.hex:focus {
  border-color: #B03060;
  color: #f0f0f0;
}
</style>
<template>
  <input
    type="number"
    class="input"
    :value="value"
    :min="min"
    :max="max"
    :step="step"
    @input="e => emit('update:modelValue', parseFloat(e.target.value) || 0)"
  />
</template>

<script setup>
defineProps({
  value: Number,
  min: Number,
  max: Number,
  step: { type: Number, default: 1 },
})
const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>
.input {
  width: 100%;
  box-sizing: border-box;
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  padding: 3px 5px;
  color: #d0d0d0;
  background: #111;
  border: 1px solid #2e2e2e;
  border-radius: 3px;
  outline: none;
}
.input:focus {
  border-color: #B03060;
  color: #f0f0f0;
}
/* hide spin buttons */
.input::-webkit-inner-spin-button,
.input::-webkit-outer-spin-button { opacity: 0.3; }
</style>
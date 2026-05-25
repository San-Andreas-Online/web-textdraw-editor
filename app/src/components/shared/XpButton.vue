<template>
  <button class="btn" :class="{ primary, danger, warning }" @click="emit('click')">
    <slot />
  </button>
</template>

<script setup>
defineProps({
  primary: Boolean,
  danger:  Boolean,
  warning: Boolean,
})
const emit = defineEmits(['click'])
</script>

<style scoped>
.btn {
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 12px;
  min-width: 24px;
  cursor: pointer;
  color: #b0b0b0;
  background: #1c1c1c;
  border: 1px solid #2e2e2e;
  border-radius: 3px;
  outline: none;
  white-space: nowrap;
  user-select: none;
  transition: background 0.1s, border-color 0.1s, color 0.1s;
  letter-spacing: 0.3px;
}
.btn:hover {
  background: #252525;
  border-color: #C80041;
  color: #e8e8e8;
}
.btn:active {
  background: #111;
  border-color: #C80041;
}

.btn.primary {
  background: #C80041;
  color: #fff;
  border-color: #C80041;
}
.btn.primary:hover {
  background: #C80041;
  border-color: #C80041;
}
.btn.primary:active {
  background: #C80041;
  border-color: #B03060;
}

.btn.danger {
  color: #e05050;
  border-color: #2e1a1a;
}
.btn.danger:hover {
  border-color: #e05050;
  color: #ff6060;
  background: #1e1010;
}

.btn.warning {
  color: #c8902a;
  border-color: #2a1e08;
}
.btn.warning:hover {
  border-color: #c8902a;
  color: #e0a840;
  background: #1a1608;
}
</style>
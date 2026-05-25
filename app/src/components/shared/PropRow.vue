<template>
  <div class="row">
    <span class="label">{{ label }}</span>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({ label: String })
</script>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}
.label {
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  color: #606060;
  width: 54px;
  flex-shrink: 0;
}
.content {
  flex: 1;
  min-width: 0;
}
</style>
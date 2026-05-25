<template>
  <div class="panel">
    <div v-if="title" class="panel-title">{{ title }}</div>
    <div class="panel-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
})
</script>

<style scoped>
.panel {
  margin-bottom: 6px;
}
.panel-title {
  font-family: 'Tahoma', sans-serif;
  font-size: 9px;
  font-weight: 700;
  color: #B03060;
  margin-bottom: 4px;
  padding-bottom: 3px;
  border-bottom: 1px solid #2a2a2a;
  text-transform: uppercase;
  letter-spacing: 1.2px;
}
.panel-body {
  padding: 4px 2px;
}
</style>
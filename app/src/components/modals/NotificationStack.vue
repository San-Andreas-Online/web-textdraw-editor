<!-- NotificationStack.vue — TODO -->
<template>
  <div class="notif-stack">
    <div v-for="n in notifs" :key="n.id" class="notif" :class="n.type">{{ n.msg }}</div>
  </div>
</template>
<script setup>
defineProps({ notifs: { type: Array, default: () => [] } })
</script>
<style scoped>
.notif-stack { position:fixed;bottom:16px;right:16px;display:flex;flex-direction:column;gap:6px;z-index:2000;pointer-events:none; }
.notif { padding:6px 12px;font-family:'Tahoma',sans-serif;font-size:11px;font-weight:700;border:1px solid #a0a0a0;background:#ece9d8;color:#000; }
.notif.success { background:#c8f0c8;border-color:#4a904a; }
.notif.error   { background:#f0c8c8;border-color:#a04040; }
</style>

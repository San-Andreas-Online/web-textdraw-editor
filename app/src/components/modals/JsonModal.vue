<template>
  <div v-if="show" class="modal-overlay" @mousedown.self="emit('close')">
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">Import</span>
        <div class="header-actions">
          <button class="btn" @click="onLoad">Import</button>
          <button class="btn icon-btn" @click="emit('close')">✕</button>
        </div>
      </div>
      <textarea class="code-area" v-model="localText" spellcheck="false" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  json: { type: String,  default: '' },
})

const emit = defineEmits(['close', 'load', 'load-pawn'])

const localText = ref('')

watch(() => props.show, (val) => {
  if (val) localText.value = props.json
})

function isPawn(text) {
  return /TextDrawCreate|CreatePlayerTextDraw/i.test(text)
}

function onLoad() {
  const text = localText.value.trim()
  if (!text) return
  if (isPawn(text)) emit('load-pawn', text)
  else emit('load', text)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.modal-box {
  width: 700px;
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  background: var(--bg1);
  border: 1px solid var(--border2);
  border-radius: 4px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.7);
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  height: 38px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border2);
  flex-shrink: 0;
}
.modal-title {
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.header-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}
.btn {
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 10px;
  cursor: pointer;
  color: var(--text1);
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 3px;
  outline: none;
  white-space: nowrap;
  user-select: none;
  transition: border-color 0.1s, color 0.1s, background 0.1s;
}
.btn:hover {
  border-color: var(--accent);
  color: var(--text0);
  background: var(--bg2);
}
.btn:active {
  background: var(--bg0);
  border-color: #C80041;
}
.icon-btn {
  padding: 4px 8px;
  color: var(--text2);
}
.icon-btn:hover {
  color: var(--red);
  border-color: var(--red);
}
.code-area {
  flex: 1;
  padding: 12px 14px;
  background: var(--bg0);
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text0);
  min-height: 400px;
  width: 100%;
  box-sizing: border-box;
  border: none;
  outline: none;
  resize: none;
}
.code-area::selection {
  background: var(--accent-dim);
}
</style>
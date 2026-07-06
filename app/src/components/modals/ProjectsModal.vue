<template>
  <div v-if="show" class="modal-overlay" @mousedown.self="emit('close')">
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">My Projects</span>
        <div class="header-actions">
          <button class="btn icon-btn" @click="emit('close')">✕</button>
        </div>
      </div>

      <div class="save-row">
        <input
          class="name-input"
          v-model="newName"
          placeholder="Project name"
          @keyup.enter="onSaveNew"
        />
        <button class="btn primary" @click="onSaveNew">Save as new</button>
        <button v-if="currentId" class="btn" @click="onSaveCurrent">
          Update current project
        </button>
      </div>

      <div class="list">
        <div v-if="!projects.length" class="empty">
          No projects saved in this browser yet.
        </div>

        <div
          v-for="p in projects"
          :key="p.id"
          class="row"
          :class="{ active: p.id === currentId }"
        >
          <div class="row-info">
            <span class="row-name">{{ p.name }}</span>
            <span class="row-date">{{ formatDate(p.updatedAt) }}</span>
          </div>
          <div class="row-actions">
            <button class="btn" @click="emit('load', p.id)">To load</button>
            <button class="btn icon-btn" @click="emit('delete', p.id)">❌</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  projects: { type: Array, default: () => [] },
  currentId: { type: String, default: null },
})

const emit = defineEmits(['close', 'save-new', 'save-current', 'load', 'delete'])

const newName = ref('')

watch(() => props.show, (val) => {
  if (val) newName.value = ''
})

function onSaveNew() {
  const name = newName.value.trim()
  if (!name) return
  emit('save-new', name)
  newName.value = ''
}

function onSaveCurrent() {
  emit('save-current')
}

function formatDate(ts) {
  return new Date(ts).toLocaleString()
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
  width: 520px;
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
.save-row {
  display: flex;
  gap: 6px;
  padding: 10px;
  border-bottom: 1px solid var(--border2);
  flex-shrink: 0;
}
.name-input {
  flex: 1;
  background: var(--bg0);
  border: 1px solid var(--border2);
  border-radius: 3px;
  color: var(--text0);
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  padding: 0 8px;
  outline: none;
}
.name-input:focus {
  border-color: var(--accent);
}
.list {
  overflow-y: auto;
  padding: 6px;
}
.empty {
  padding: 20px;
  text-align: center;
  color: var(--text2);
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 3px;
  border: 1px solid transparent;
}
.row:hover {
  background: var(--bg2);
}
.row.active {
  border-color: var(--accent);
}
.row-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}
.row-name {
  font-family: 'Tahoma', sans-serif;
  font-size: 12px;
  color: var(--text0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-date {
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  color: var(--text2);
}
.row-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
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
.btn.primary {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--text0);
}
.icon-btn {
  padding: 4px 8px;
  color: var(--text2);
}
.icon-btn:hover {
  color: var(--red);
  border-color: var(--red);
}
</style>
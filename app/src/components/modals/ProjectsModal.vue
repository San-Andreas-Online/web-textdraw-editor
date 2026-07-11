<template>
  <div v-if="show" class="modal-overlay" @mousedown.self="emit('close')">
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">My Projects</span>
        <div class="header-actions">
          <button class="btn icon-btn" @click="emit('close')">✕</button>
        </div>
      </div>

      <!-- GitHub auth strip -->
      <div class="auth-strip">
        <template v-if="!isLoggedIn">
          <span class="auth-hint">Sign in to sync projects across devices</span>
          <button class="btn github-btn" :disabled="authLoading" @click="auth.login()">
            <svg class="gh-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
                0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
                -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66
                .07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15
                -.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27
                .68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12
                .51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
                0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            {{ authLoading ? 'Connecting…' : 'Login with GitHub' }}
          </button>
        </template>

        <template v-else>
          <img :src="auth.user.value.avatar" class="avatar" :alt="auth.user.value.login" />
          <span class="auth-username">{{ auth.user.value.login }}</span>
          <button class="btn sm" @click="onPullCloud" :disabled="syncing">
            {{ syncing ? 'Syncing…' : '↓ Pull from cloud' }}
          </button>
          <span v-if="lastSynced" class="sync-ts">
            Synced {{ formatRelative(lastSynced) }}
          </span>
          <div style="flex:1" />
          <button class="btn sm logout-btn" @click="auth.logout()">Logout</button>
        </template>

        <span v-if="auth.authError.value" class="auth-error">{{ auth.authError.value }}</span>
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
          Update current
        </button>
      </div>

      <div class="list">
        <div v-if="!projects.length" class="empty">
          No projects saved yet.
          <span v-if="isLoggedIn"> Try pulling from cloud ↑</span>
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
            <button class="btn" @click="emit('load', p.id)">Load</button>
            <button class="btn icon-btn" @click="emit('delete', p.id)">❌</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useGithubAuth } from '../../composables/useGithubAuth'
import { useGistSync } from '../../composables/useGistSync'

const props = defineProps({
  show: { type: Boolean, default: false },
  projects: { type: Array, default: () => [] },
  currentId: { type: String, default: null },
})

const emit = defineEmits(['close', 'save-new', 'save-current', 'load', 'delete', 'pull-cloud'])

const auth = useGithubAuth()
const { isLoggedIn, authLoading, authError, user } = auth
const { syncing, lastSynced } = useGistSync()

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

function onPullCloud() {
  emit('pull-cloud')
}

function formatDate(ts) {
  return new Date(ts).toLocaleString()
}

function formatRelative(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
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
  width: 540px;
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

/* Auth strip */
.auth-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border2);
  flex-shrink: 0;
  min-height: 40px;
}
.auth-hint {
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  color: var(--text2);
}
.github-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #24292e;
  border-color: #444d56;
  color: #e0e0e0;
  font-size: 10px;
  font-weight: 600;
}
.github-btn:hover {
  background: #2f363d;
  border-color: var(--accent);
}
.gh-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}
.avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--border2);
  flex-shrink: 0;
}
.auth-username {
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: var(--text0);
}
.sync-ts {
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  color: var(--text2);
}
.auth-error {
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  color: var(--red);
}
.logout-btn {
  color: var(--text2);
}
.logout-btn:hover {
  color: var(--red);
  border-color: var(--red);
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
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.btn:not(:disabled):hover {
  border-color: var(--accent);
  color: var(--text0);
  background: var(--bg2);
}
.btn:not(:disabled):active {
  background: var(--bg0);
  border-color: #C80041;
}
.btn.primary {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--text0);
}
.btn.sm {
  padding: 3px 7px;
  font-size: 9px;
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
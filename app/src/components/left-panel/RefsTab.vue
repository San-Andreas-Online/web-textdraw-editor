<template>
  <div class="refs-tab">

    <!-- Canvas Background -->
    <div class="section-label">Canvas Background</div>
    <div
      class="upload-box txd-drop"
      :class="{ 'drag-over': isBgDragOver }"
      @dragover.prevent="isBgDragOver = true"
      @dragleave="onBgDragLeave"
      @drop.prevent="onBgDrop"
    >
      <div class="hint">Upload an image to use as the canvas background.</div>
      <label class="upload-label txd-label" :class="{ loaded: bgImage }">
        {{ isBgDragOver ? 'Drop image here' : bgImage ? '✓ BG Loaded — Replace' : 'Browse files' }}
        <input type="file" accept="image/*" @change="e => emit('upload-bg', e)" style="display:none" />
      </label>
      <button v-if="bgImage" class="xp-btn danger" style="width:100%;margin-top:3px" @click="emit('remove-bg')">
        ✕ Remove Background
      </button>
    </div>

    <!-- Reference Images -->
    <div class="section-label">Reference Images</div>
    <div
      class="upload-box txd-drop"
      :class="{ 'drag-over': isRefDragOver }"
      @dragover.prevent="isRefDragOver = true"
      @dragleave="onRefDragLeave"
      @drop.prevent="onRefDrop"
    >
      <div class="hint">Overlay reference photos on the canvas. Move, resize, set opacity.</div>
      <label class="upload-label txd-label">
        {{ isRefDragOver ? 'Drop image(s) here' : 'Browse files' }}
        <input type="file" multiple accept="image/*" @change="e => emit('upload-refs', e)" style="display:none" />
      </label>
    </div>

    <div v-if="!refs.length" class="empty-hint">No reference images yet</div>
    <div
      v-for="r in refs"
      :key="r.id"
      class="ref-row"
      :class="{ active: selRef === r.id }"
      @click="emit('select-ref', r.id)"
    >
      <div class="ref-thumb">
        <img :src="r.src" alt="" />
      </div>
      <span class="ref-name">{{ r.name }}</span>
      <span class="ref-icon" title="Toggle visibility" @click.stop="emit('toggle-ref-visible', r)">
        {{ r.visible ? '●' : '○' }}
      </span>
      <span class="ref-icon" :class="{ locked: r.locked }" title="Lock" @click.stop="emit('toggle-ref-lock', r)">
        {{ r.locked ? '🔒' : '·' }}
      </span>
      <span class="ref-icon danger" title="Delete" @click.stop="emit('delete-ref', r.id)">✕</span>
    </div>

    <!-- Custom Textures (TXD) -->
    <div class="section-label" style="margin-top:10px">Custom Textures (TXD)</div>
    <div
      class="upload-box txd-drop"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @drop.prevent="onDrop"
    >
      <div class="hint">
        Upload a <strong>.txd</strong> file.<br />
        Textures be in the <strong>Sprites tab</strong> as <br /><code>mdl-(id):(texture)</code>.
      </div>
      <label class="upload-label txd-label">
        {{ isDragOver ? 'Drop .txd here' : 'Browse files' }}
        <input type="file" accept=".txd" multiple @change="onFileInput" style="display:none" />
      </label>
    </div>

    <div v-if="!txdEntries.length" class="empty-hint">No TXD files uploaded yet</div>
    <div v-for="entry in txdEntries" :key="entry.id" class="txd-row">
      <div class="txd-info">
        <span class="txd-filename">{{ entry.filename }}</span>
        <span class="txd-model">mdl-{{ entry.modelId }}</span>
        <span v-if="entry.loading" class="txd-status loading">parsing…</span>
        <span v-else-if="entry.error" class="txd-status error" :title="entry.error">⚠ error</span>
        <span v-else class="txd-status ok">{{ entry.textures.length }} tex</span>
      </div>
      <span class="ref-icon danger" title="Remove" @click="emit('remove-txd', entry.id)">✕</span>
    </div>

  </div>

  <!-- Model ID prompt modal -->
  <Teleport to="body">
    <div v-if="pendingCount" class="modal-overlay" @mousedown.self="cancelPending">
      <div class="modal-box">
        <div class="modal-title">Model ID for <em>{{ pendingFileName }}</em></div>
        <div class="modal-hint" style="margin-bottom:8px">
          Enter the GTA SA object/model ID this TXD belongs to.
        </div>
        <input
          ref="modelIdInput"
          class="xp-input"
          type="number"
          style="appearance:none;-webkit-appearance:none;-moz-appearance:textfield;"
          min="0"
          placeholder="e.g. 1337"
          v-model="currentModelId"
          @keydown.enter="confirmCurrent"
          @keydown.escape="cancelPending"
        />
        <div class="modal-actions">
          <button class="xp-btn" @click="cancelPending">Cancel</button>
          <button class="xp-btn primary" @click="confirmCurrent" :disabled="!currentModelId">Confirm</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  bgImage: { default: null },
  refs: { type: Array, default: () => [] },
  selRef: { default: null },
  txdEntries: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'upload-bg', 'remove-bg',
  'upload-refs',
  'select-ref', 'toggle-ref-visible', 'toggle-ref-lock', 'delete-ref',
  'add-txd', 'remove-txd',
])

const isDragOver = ref(false)
const isRefDragOver = ref(false)
const isBgDragOver = ref(false)

let _files = []
const pendingCount = ref(0)
const pendingFileName = computed(() => _files[0]?.name ?? '')

const currentModelId = ref('')
const modelIdInput = ref(null)

function onDrop(e) {
  isDragOver.value = false
  const files = [...e.dataTransfer.files].filter(f => f.name.toLowerCase().endsWith('.txd'))
  if (files.length) queueFiles(files)
}

function onFileInput(e) {
  const files = [...e.target.files]
  e.target.value = ''
  if (files.length) queueFiles(files)
}

function queueFiles(files) {
  const wasEmpty = _files.length === 0
  _files = [..._files, ...files]
  pendingCount.value = _files.length
  if (wasEmpty) promptNext()
}

async function promptNext() {
  currentModelId.value = ''
  await nextTick()
  modelIdInput.value?.focus()
}

function confirmCurrent() {
  console.log('confirming file:', _files[0], typeof _files[0], _files[0]?.name)
  if (!currentModelId.value) return
  emit('add-txd', { file: _files[0], modelId: currentModelId.value })
  _files = _files.slice(1)
  pendingCount.value = _files.length
  if (_files.length) promptNext()
}

function cancelPending() {
  _files = []
  pendingCount.value = 0
  currentModelId.value = ''
}

function onBgDrop(e) {
  isBgDragOver.value = false
  const file = [...e.dataTransfer.files].find(f => f.type.startsWith('image/'))
  if (!file) return
  const dt = new DataTransfer()
  dt.items.add(file)
  emit('upload-bg', { target: { files: dt.files } })
}

function onBgDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) isBgDragOver.value = false
}

function onRefDrop(e) {
  isRefDragOver.value = false
  const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'))
  if (!files.length) return
  const dt = new DataTransfer()
  files.forEach(f => dt.items.add(f))
  emit('upload-refs', { target: { files: dt.files } })
}

function onRefDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) isRefDragOver.value = false
}

</script>

<style scoped>
.refs-tab {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-label {
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text2);
  padding-bottom: 3px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2px;
}

.upload-box {
  padding: 7px;
  background: var(--bg0);
  border: 1px solid var(--border2);
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 2px;
}

.txd-drop {
  border-style: dashed;
  transition: border-color 0.15s, background 0.15s;
}
.txd-drop.drag-over {
  border-color: var(--accent);
  background: var(--accent-dim);
}

.hint {
  font-size: 9px;
  color: var(--text2);
  line-height: 1.5;
}
.modal-hint {
  font-size: 13px;
  color: var(--text2);
  line-height: 1.6;
}

.hint strong { color: var(--text1); }
.hint code {
  font-family: monospace;
  font-size: 9px;
  color: var(--accent);
  background: rgba(200,0,65,0.1);
  padding: 0 3px;
  border-radius: 2px;
}

.upload-label {
  display: block;
  text-align: center;
  padding: 5px 0;
  cursor: pointer;
  font-size: 10px;
  color: var(--text1);
  background: var(--bg3);
  border: 1px solid var(--border2);
  transition: border-color 0.1s, color 0.1s;
}
.upload-label:hover { border-color: var(--accent); color: var(--text0); }
.upload-label.loaded { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
.txd-label { border-style: dashed; }

.empty-hint {
  font-size: 10px;
  color: var(--text2);
  text-align: center;
  padding: 8px 0;
  font-style: italic;
}

.ref-row, .txd-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 5px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.1s, border-color 0.1s;
}
.ref-row:hover, .txd-row:hover { background: var(--bg2); }
.ref-row.active { background: var(--accent-dim); border-color: var(--accent); }

.ref-thumb {
  width: 22px;
  height: 16px;
  border: 1px solid var(--border);
  overflow: hidden;
  flex-shrink: 0;
}
.ref-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

.ref-name, .txd-filename {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 9px;
  color: var(--text1);
}
.ref-row.active .ref-name { color: var(--accent); }

.ref-icon {
  cursor: pointer;
  font-size: 10px;
  color: var(--text2);
  flex-shrink: 0;
  padding: 0 2px;
}
.ref-icon:hover { color: var(--text0); }
.ref-icon.locked { color: var(--accent); }
.ref-icon.danger:hover { color: var(--red); }

.txd-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
}
.txd-model {
  font-size: 8px;
  color: var(--accent);
  font-family: monospace;
}

.txd-status {
  font-size: 8px;
  font-family: monospace;
  padding: 1px 4px;
  border-radius: 2px;
}
.txd-status.loading { color: var(--text2); }
.txd-status.error   { color: var(--red); background: rgba(204,68,68,0.1); cursor: help; }
.txd-status.ok      { color: var(--green); }

.xp-btn {
  font-family: 'Tahoma', sans-serif;
  font-size: 13px;
  padding: 8px 16px;
  cursor: pointer;
  color: var(--text1);
  background: var(--bg3);
  border: 1px solid var(--border2);
  outline: none;
  transition: border-color 0.1s, color 0.1s;
}
.xp-btn:hover { border-color: var(--accent); color: var(--text0); }
.xp-btn.primary { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 700; }
.xp-btn.primary:disabled { opacity: 0.4; cursor: not-allowed; }
.xp-btn.danger { color: var(--red); border-color: var(--red); background: transparent; }
.xp-btn.danger:hover { background: rgba(204,68,68,0.1); }

.xp-input {
  width: 100%;
  box-sizing: border-box;
  font-family: 'Tahoma', sans-serif;
  font-size: 14px;
  padding: 8px 10px;
  background: var(--bg0);
  border: 1px solid var(--border2);
  color: var(--text0);
  outline: none;
}

.xp-input:focus { border-color: var(--accent); }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-box {
  background: var(--bg2);
  border: 1px solid var(--border2);
  padding: 28px;
  width: 400px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.8);
}
.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text0);
  margin-bottom: 4px;
}

.modal-title em { font-style: normal; color: var(--accent); }
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 4px;
}

.xp-input[type="number"]::-webkit-inner-spin-button,
.xp-input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.xp-input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

</style>
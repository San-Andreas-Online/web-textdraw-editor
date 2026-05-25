<template>
  <div class="refs-tab">
    <!-- Canvas Background -->
    <div class="section-title">Canvas Background</div>
    <div class="upload-box">
      <div class="hint">Replace the background with your own image.</div>
      <label class="upload-label" :class="{ loaded: bgImage }">
        {{ bgImage ? '✓ BG Loaded — Replace' : 'Upload Background' }}
        <input type="file" accept="image/*" @change="onBgUpload" style="display:none" />
      </label>
      <button v-if="bgImage" class="xp-btn danger-btn" @click="emit('remove-bg')">✕ Remove Background</button>
    </div>

    <!-- Reference Images -->
    <div class="section-title" style="margin-top: 10px">Reference Images</div>
    <div class="upload-box">
      <div class="hint">Overlay reference photos on canvas. Move, resize, set opacity, lock.</div>
      <label class="upload-label ref-label">
        Upload Reference Image
        <input type="file" multiple accept="image/*" @change="onRefUpload" style="display:none" />
      </label>
    </div>

    <div v-if="!refs.length" class="empty">No reference images yet</div>

    <div
      v-for="r in refs"
      :key="r.id"
      class="ref-row"
      :class="{ selected: selRef === r.id }"
      @click="emit('select-ref', r.id)"
    >
      <div class="thumb">
        <img :src="r.src" style="width:100%;height:100%;object-fit:cover" alt="" />
      </div>
      <span class="ref-name">{{ r.name }}</span>
      <span class="icon" title="Toggle visibility" @click.stop="emit('toggle-ref-visible', r)">{{ r.visible ? '●' : '○' }}</span>
      <span
      class="icon lock-icon"
      :class="{ active: r.locked }"
      title="Toggle lock"
      @click.stop="emit('toggle-ref-lock', r)"
    >
      <svg v-if="r.locked" width="10" height="11" viewBox="0 0 10 11" fill="none">
        <rect x="1" y="5" width="8" height="6" rx="1" fill="currentColor"/>
        <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" stroke-width="1.4" fill="none"/>
      </svg>
      <svg v-else width="10" height="11" viewBox="0 0 10 11" fill="none">
        <rect x="1" y="5" width="8" height="6" rx="1" fill="currentColor" opacity="0.3"/>
        <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" stroke-width="1.4" fill="none" opacity="0.3"/>
      </svg>
    </span>
      <span class="icon del" title="Delete" @click.stop="emit('delete-ref', r.id)">✕</span>
    </div>

    <div v-if="refs.length" class="hint-box">
      Click to select · Drag to move · Corner handle to resize · Del to delete
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  bgImage: { type: String, default: null },
  refs:    { type: Array,  default: () => [] },
  selRef:  { type: String, default: null },
})

const emit = defineEmits([
  'upload-bg', 'remove-bg',
  'upload-refs',
  'select-ref', 'toggle-ref-visible', 'toggle-ref-lock', 'delete-ref',
])

function onBgUpload(e) {
  const f = e.target.files[0]
  if (!f) return
  emit('upload-bg', f)
  e.target.value = ''
}

function onRefUpload(e) {
  emit('upload-refs', [...e.target.files])
  e.target.value = ''
}
</script>

<style scoped>
.refs-tab {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: var(--bg1);
}

.section-title {
  font-family: 'Tahoma', sans-serif;
  font-size: 9px;
  font-weight: 700;
  color: var(--text2);
  border-bottom: 1px solid var(--border2);
  padding-bottom: 3px;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.upload-box {
  padding: 7px;
  background: var(--bg0);
  border: 1px solid var(--border2);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hint {
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  color: var(--text2);
  line-height: 1.5;
}

.upload-label {
  display: block;
  text-align: center;
  padding: 5px 0;
  cursor: pointer;
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  color: var(--text1);
  background: var(--bg3);
  border: 1px solid var(--border2);
  transition: border-color 0.1s, color 0.1s;
}
.upload-label:hover {
  border-color: var(--accent);
  color: var(--text0);
}
.upload-label.loaded {
  background: rgba(176, 48, 96, 0.12);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 700;
}

.ref-label { color: var(--text1); }

.danger-btn {
  color: var(--red) !important;
  border-color: var(--red) !important;
  width: 100%;
}
.danger-btn:hover {
  background: rgba(204, 68, 68, 0.1) !important;
}

.xp-btn {
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  padding: 4px 8px;
  cursor: pointer;
  color: var(--text1);
  background: var(--bg3);
  border: 1px solid var(--border2);
  outline: none;
  user-select: none;
  transition: border-color 0.1s, color 0.1s, background 0.1s;
}
.xp-btn:hover {
  background: var(--bg2);
  border-color: var(--accent);
  color: var(--text0);
}
.xp-btn:active {
  background: var(--bg0);
  border-color: #C80041;
}

.empty {
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  color: var(--text2);
  text-align: center;
  padding: 12px 0;
  font-style: italic;
}

.ref-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  cursor: pointer;
  border: 1px solid transparent;
  border-bottom: 1px solid var(--border);
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  color: var(--text1);
  transition: background 0.1s, border-color 0.1s;
}
.ref-row:hover {
  background: var(--bg2);
}
.ref-row.selected {
  background: rgba(176, 48, 96, 0.1);
  border-color: var(--accent);
  color: var(--text0);
}

.thumb {
  width: 22px;
  height: 16px;
  border: 1px solid var(--border2);
  border-radius: 1px;
  overflow: hidden;
  flex-shrink: 0;
}

.ref-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: var(--text1);
}
.ref-row.selected .ref-name { color: var(--text0); }

.icon {
  cursor: pointer;
  font-size: 11px;
  color: var(--text2);
  flex-shrink: 0;
  transition: color 0.1s;
}
.icon:hover { color: var(--text0); }
.icon.locked { color: var(--accent); }
.icon.del { color: var(--red); font-weight: 700; }

.hint-box {
  font-family: 'Tahoma', sans-serif;
  font-size: 9px;
  color: var(--text2);
  line-height: 1.6;
  padding: 6px;
  background: var(--bg0);
  border: 1px solid var(--border2);
  margin-top: 4px;
}
.lock-icon { color: var(--text2); }
.lock-icon.active { color: var(--red); }
.ref-row.selected .lock-icon { color: var(--text1); }
.ref-row.selected .lock-icon.active { color: #ff6666; }
</style>
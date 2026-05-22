<template>
  <div class="sprites-tab">
    <input class="xp-input" placeholder="Search..." v-model="search" />
   <div class="font-select" :class="{ open: libOpen }" @click="libOpen = !libOpen">
    <span>{{ filterLib === '' ? 'All Libraries' : filterLib }}</span>
    <span class="font-arrow">▾</span>
    <div class="font-dropdown" v-if="libOpen">
    <div
      class="font-option"
      v-for="lib in libs"
      :key="lib"
      :class="{ active: filterLib === lib }"
      @mousedown.prevent="filterLib = lib; libOpen = false"
    >{{ lib }}</div>
  </div>
  </div>

    <div class="sprite-count">{{ filtered.length }} sprites</div>

    <div class="sprite-grid">
      <div
        v-for="s in filtered.slice(0, 90)"
        :key="s.lib + ':' + s.tex"
        class="sprite-cell"
        :class="{ active: selected && selected.lib === s.lib && selected.tex === s.tex }"
        draggable="true"
        @dragstart="e => onDragStart(e, s)"
        @click="selected = s"
      >
        <img v-if="s.path" :src="s.path" class="sprite-img" draggable="false" @error="e => e.target.style.display='none'" />
        <div v-else class="sprite-text">{{ s.lib }}<br /><strong>{{ s.tex }}</strong></div>
        <div class="sprite-name">{{ s.tex }}</div>
      </div>
    </div>

    <template v-if="selected">
      <div class="selected-label">{{ selected.lib }}:<strong>{{ selected.tex }}</strong></div>
      <button class="xp-btn insert-btn" @click="emit('insert-sprite', selected)">Insert Sprite</button>
    </template>
  </div>
</template>

<script setup>
import { KNOWN_SPRITES, spriteImagePath } from '../../constants/sprites'
import { ref, computed, onMounted, onUnmounted } from 'vue'


const libOpen = ref(false)
const emit = defineEmits(['insert-sprite', 'sprites-loaded'])

const search = ref('')
const filterLib = ref('')
const selected = ref(null)
const userImages = ref({})

const libs = computed(() => [...new Set(KNOWN_SPRITES.map(s => s.lib))])

const filtered = computed(() =>
  KNOWN_SPRITES
    .filter(s => filterLib.value === '' || s.lib === filterLib.value)
    .filter(s => (s.lib + ':' + s.tex).toLowerCase().includes(search.value.toLowerCase()))
    .map(s => {
      const key = `${s.lib}:${s.tex}`
      return { ...s, path: userImages.value[key] || spriteImagePath(s.lib, s.tex) }
    })
)

function onClickOutside(e)
{
  if (!e.target.closest('.font-select')) libOpen.value = false
}

onMounted(() => window.addEventListener('mousedown', onClickOutside))
onUnmounted(() => window.removeEventListener('mousedown', onClickOutside))

function onDragStart(e, s) {
  e.dataTransfer.setData('sprite', `${s.lib}:${s.tex}`)
  e.dataTransfer.effectAllowed = 'copy'

  const img = e.currentTarget.querySelector('img')
  if (img) {
    const size = 48
    const cv = document.createElement('canvas')
    cv.width = size
    cv.height = size
    cv.style.position = 'fixed'
    cv.style.top = '-1000px'
    cv.style.left = '-1000px'
    document.body.appendChild(cv)
    const ctx = cv.getContext('2d')
    ctx.drawImage(img, 0, 0, size, size)
    e.dataTransfer.setDragImage(cv, size / 2, size / 2)
    setTimeout(() => document.body.removeChild(cv), 0)
  }
}

function onUpload(e) {
  const files = [...e.target.files]
  let done = 0
  files.forEach(f => {
    const reader = new FileReader()
    reader.onload = ev => {
      const base = f.name.replace(/\.[^.]+$/, '')
      const us = base.lastIndexOf('_')
      const lib = us > 0 ? base.slice(0, us) : base
      const tex = us > 0 ? base.slice(us + 1) : base
      userImages.value[`${lib}:${tex}`] = ev.target.result
      done++
      if (done === files.length) emit('sprites-loaded', files.length)
    }
    reader.readAsDataURL(f)
  })
  e.target.value = ''
}
</script>

<style scoped>
.sprites-tab {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--bg1);
}

.upload-box {
  padding: 6px;
  background: var(--bg0);
  border: 1px solid var(--border2);
  margin-bottom: 4px;
}

.hint {
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  color: var(--text2);
  margin-bottom: 5px;
  line-height: 1.5;
}

.upload-label {
  display: block;
  text-align: center;
  padding: 4px 0;
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

.xp-input {
  width: 100%;
  box-sizing: border-box;
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  padding: 3px 6px;
  background: var(--bg0);
  border: 1px solid var(--border2);
  color: var(--text0);
  outline: none;
  transition: border-color 0.1s;
}
.xp-input:focus {
  border-color: var(--accent);
}

.sprite-count {
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  color: var(--text2);
}

.sprite-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  min-width: 0;
  width: 100%;
}

.sprite-cell {
  border: 1px solid var(--border2);
  background: var(--bg2);
  cursor: grab;
  padding: 3px;
  display: flex;
  flex-direction: column;
  align-items: center;
  aspect-ratio: 1;
  overflow: hidden;
  transition: border-color 0.1s, background 0.1s;
}

.sprite-cell:hover {
  background: var(--bg3);
  border-color: var(--accent);
}
.sprite-cell.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.sprite-cell:active { cursor: grabbing; }

.sprite-img {
  max-width: 100%;
  max-height: 70%;
  object-fit: contain;
  image-rendering: pixelated;
  pointer-events: none;
  user-select: none;
}

.sprite-text {
  font-family: 'Tahoma', sans-serif;
  font-size: 7px;
  text-align: center;
  line-height: 1.3;
  word-break: break-all;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text2);
}
.sprite-cell.active .sprite-text { color: #fff; }

.sprite-name {
  font-family: 'Tahoma', sans-serif;
  font-size: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  text-align: center;
  margin-top: 2px;
  color: var(--text2);
}
.sprite-cell.active .sprite-name { color: rgba(255,255,255,0.8); }

.selected-label {
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  color: var(--text1);
}

.insert-btn {
  width: 100%;
  font-weight: 700;
  padding: 5px 0;
  color: var(--accent) !important;
  border-color: var(--accent) !important;
}
.insert-btn:hover {
  background: rgba(176, 48, 96, 0.12) !important;
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

.font-select { position:relative; display:flex; align-items:center; justify-content:space-between; padding:3px 6px; background:var(--bg0); border:1px solid var(--border2); cursor:pointer; font-size:11px; color:var(--text0); width:100%; box-sizing:border-box; }
.font-select:hover { border-color:var(--accent); }
.font-arrow { font-size:9px; color:var(--text2); margin-left:6px; }
.font-dropdown { position:absolute; top:100%; left:0; right:0; background:var(--bg2); border:1px solid var(--border2); z-index:999; box-shadow:2px 4px 12px rgba(0,0,0,0.6); max-height:200px; overflow-y:auto; }
.font-option { padding:4px 8px; font-size:11px; cursor:pointer; color:var(--text0); }
.font-option:hover { background:var(--accent-dim); }
.font-option.active { color:var(--accent); }

</style>
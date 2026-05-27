<template>
  <div class="sprites-tab">
    <input class="xp-input" placeholder="Search..." v-model="search" />
    <div class="font-select" :class="{ open: libOpen }" @click="libOpen = !libOpen">
      <span>{{ filterLib === '' ? 'All Libraries' : filterLib }}</span>
      <span class="font-arrow">▾</span>
      <div class="font-dropdown" v-if="libOpen">
        <div
          class="font-option"
          :class="{ active: filterLib === '' }"
          @mousedown.prevent="filterLib = ''; libOpen = false"
        >All Libraries</div>
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
        <img 
          v-if="s.path" 
          :src="s.path" 
          class="sprite-img" 
          draggable="false"
          @error="e => { if (!e.target.dataset.triedLocal) { e.target.dataset.triedLocal = '1'; e.target.src = localSpriteImagePath(s.lib, s.tex) } else { e.target.style.display='none' } }"
        />
          <div v-else class="sprite-text txd-text">
            {{ s.lib }}<br />
            <strong>{{ s.tex }}</strong>
            <span v-if="s.placeholder" class="placeholder-badge">no tex</span>
          </div>
      </div>
    </div>

    <template v-if="selected && !selected.fromTxd">
      <div class="selected-label">{{ selected.lib }}:<strong>{{ selected.tex }}</strong></div>
      <button class="xp-btn insert-btn" @click="emit('insert-sprite', selected)">Insert Sprite</button>
    </template>

    <div v-if="txdList.length === 0 && filterLib === ''" class="empty-txd-hint">
      Upload .txd files in the <strong>Refs tab</strong> to add custom textures here.
    </div>

  </div>
</template>

<script setup>
import { KNOWN_SPRITES, spriteImagePath, localSpriteImagePath } from '../../constants/sprites'
import { ref, computed, isRef, watch, onMounted, onUnmounted } from 'vue'


const props = defineProps({
  txdSprites: { default: () => [] },
})

const txdList = computed(() => {
  const raw = isRef(props.txdSprites) ? props.txdSprites.value : props.txdSprites
  return Array.isArray(raw) ? raw : []
})
console.log('txdList:', txdList.value)

const emit = defineEmits(['insert-sprite', 'sprites-loaded'])

const libOpen = ref(false)
const search = ref('')
const selected = ref(null)
const userImages = ref({})

const libs = computed(() => {
  const known = [...new Set(KNOWN_SPRITES.map(s => s.lib))]
  const txd = [...new Set(txdList.value.map(s => s.lib))]
  return [...new Set([...known, ...txd])]
})

const savedLib = localStorage.getItem('sprite_filterLib') ?? ''
const filterLib = ref(libs.value.includes(savedLib) ? savedLib : '')

watch(filterLib, v => localStorage.setItem('sprite_filterLib', v))
watch(libs, (newLibs) => {
  if (filterLib.value !== '' && !newLibs.includes(filterLib.value)) {
    filterLib.value = ''
  }
})

const filtered = computed(() => {
  const knownFiltered = KNOWN_SPRITES
    .filter(s => filterLib.value === '' || s.lib === filterLib.value)
    .filter(s => (s.lib + ':' + s.tex).toLowerCase().includes(search.value.toLowerCase()))
    .map(s => {
      const key = `${s.lib}:${s.tex}`
      return { ...s, path: userImages.value[key] || spriteImagePath(s.lib, s.tex) }
    })

  const txdFiltered = txdList.value
    .filter(s => filterLib.value === '' || s.lib === filterLib.value)
    .filter(s => (s.lib + ':' + s.tex).toLowerCase().includes(search.value.toLowerCase()))

  return [...knownFiltered, ...txdFiltered]
})

function onClickOutside(e) {
  if (!e.target.closest('.font-select')) libOpen.value = false
}

onMounted(() => window.addEventListener('mousedown', onClickOutside))
onUnmounted(() => window.removeEventListener('mousedown', onClickOutside))

function onDragStart(e, s) {
  e.dataTransfer.setData('sprite', `${s.lib}:${s.tex}`)
  e.dataTransfer.setData('spritePath', s.path ?? '')
  e.dataTransfer.effectAllowed = 'copy'

  const img = e.currentTarget.querySelector('img')
  if (img && img.complete && img.naturalWidth > 0) {
    const size = 48
    const cv = document.createElement('canvas')
    cv.width = size; cv.height = size
    cv.style.cssText = 'position:fixed;top:-1000px;left:-1000px'
    document.body.appendChild(cv)
    cv.getContext('2d').drawImage(img, 0, 0, size, size)
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

.section-label {
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text2);
  padding-bottom: 3px;
  border-bottom: 1px solid var(--border);
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
.xp-input:focus { border-color: var(--accent); }

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
.sprite-cell:hover { background: var(--bg3); border-color: var(--accent); }
.sprite-cell.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.sprite-cell:active { cursor: grabbing; }

.txd-cell { border-style: dashed; }
.txd-cell:hover { border-style: solid; }
.txd-cell.active { border-style: solid; }

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

.txd-text { color: var(--accent); }
.sprite-cell.active .txd-text { color: #fff; }

.placeholder-badge {
  font-size: 6px;
  margin-top: 2px;
  background: rgba(200,0,65,0.2);
  color: var(--accent);
  padding: 1px 3px;
  border-radius: 2px;
  font-family: monospace;
}
.sprite-cell.active .placeholder-badge { background: rgba(255,255,255,0.2); color: #fff; }

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
.insert-btn:hover { background: rgba(176,48,96,0.12) !important; }

.empty-txd-hint {
  font-size: 9px;
  color: var(--text2);
  text-align: center;
  padding: 6px 0 2px;
  line-height: 1.5;
}
.empty-txd-hint strong { color: var(--text1); }

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
.xp-btn:hover { background: var(--bg2); border-color: var(--accent); color: var(--text0); }
.xp-btn:active { background: var(--bg0); border-color: #C80041; }

.font-select { position:relative; display:flex; align-items:center; justify-content:space-between; padding:3px 6px; background:var(--bg0); border:1px solid var(--border2); cursor:pointer; font-size:11px; color:var(--text0); width:100%; box-sizing:border-box; }
.font-select:hover { border-color:var(--accent); }
.font-arrow { font-size:9px; color:var(--text2); margin-left:6px; }
.font-dropdown { position:absolute; top:100%; left:0; right:0; background:var(--bg2); border:1px solid var(--border2); z-index:999; box-shadow:2px 4px 12px rgba(0,0,0,0.6); max-height:200px; overflow-y:auto; }
.font-option { padding:4px 8px; font-size:11px; cursor:pointer; color:var(--text0); }
.font-option:hover { background:var(--accent-dim); }
.font-option.active { color:var(--accent); }
</style>
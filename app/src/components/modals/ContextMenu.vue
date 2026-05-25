<!-- ContextMenu.vue -->
<template>
  <div v-if="pos" class="ctx" :style="{ left: pos.x + 'px', top: pos.y + 'px' }">
    <template v-if="isCanvas">
      <div class="ctx-row">
        <span class="ctx-label">PREFIX</span>
        <input class="ctx-input" :value="prefix" @input="emit('update:prefix', $event.target.value)" />
      </div>
      <div class="ctx-sep" />
      <label class="ctx-item cb-row">
        <input type="checkbox" v-model="localGrid" @change="emit('grid', localGrid)" />
        Grid
      </label>
      <label class="ctx-item cb-row" @mousedown.stop>
        <input type="checkbox" :checked="widescreen" @change="emit('widescreen', $event.target.checked)" />
        Widescreen
      </label>
      <div class="ctx-sep" />

      <!-- Snap submenu -->
      <div class="ctx-item has-sub">
        <span>Snap</span>
        <span class="arrow">></span>
        <div class="ctx-sub">
          <label class="ctx-item cb-row" @mousedown.stop>
            <input type="checkbox" :checked="snapMode === 'grid'" @change="onSnapMode('grid', $event.target.checked)" />
            Snap to Grid
          </label>
          <label class="ctx-item cb-row" @mousedown.stop>
            <input type="checkbox" :checked="snapMode === 'element'" @change="onSnapMode('element', $event.target.checked)" />
            Snap to Element
          </label>
        </div>
      </div>

      <!-- Grid Size submenu -->
      <div class="ctx-item has-sub" ref="subTrigger">
        <span>Grid Size</span>
        <span class="arrow">></span>
        <div class="ctx-sub">
          <div
            class="ctx-item"
            v-for="v in [1,2,5,10,20]"
            :key="v"
            :class="{ active: gridSize === v }"
            @mousedown.stop.prevent="emit('gridSize', v); emit('close')"
          >{{ v }}px</div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="ctx-item" v-for="item in items" :key="item.key"
        @mousedown="emit('action', item.key); emit('close')">
        {{ item.label }}
      </div>
      <div class="ctx-sep" />
      <label class="ctx-item cb-row" @mousedown.stop>
        <input type="checkbox" :checked="isLocked" @change="emit('action', 'toggleLock')" />
        Locked
      </label>
      <label class="ctx-item cb-row" @mousedown.stop>
        <input type="checkbox" :checked="!isVisible" @change="emit('action', 'toggleVisible')" />
        Hidden
      </label>
      <div class="ctx-sep" />
      <div class="ctx-item has-sub">
        <span>Send to</span>
        <span class="arrow" style="color:#FFFFFFFF">></span>
        <div class="ctx-sub">
          <div class="ctx-item" @mousedown.stop.prevent="emit('action', 'front'); emit('close')">Front</div>
          <div class="ctx-item" @mousedown.stop.prevent="emit('action', 'back'); emit('close')">Back</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isLocked: Boolean,
  isVisible: Boolean,
  pos: Object,
  isCanvas: Boolean,
  showGrid: Boolean,
  snapMode: String,
  gridSize: Number,
  prefix: String,
  widescreen: Boolean,
})

const emit = defineEmits(['action', 'close', 'grid', 'snapMode', 'gridSize', 'update:prefix', 'widescreen'])

const localGrid = ref(props.showGrid)

watch(() => props.showGrid, v => localGrid.value = v)

function onSnapMode(mode, checked) {
  // mutually exclusive: checking one unchecks the other; unchecking sets null
  emit('snapMode', checked ? mode : null)
}

const items = [
  { key: 'dup',        label: 'Duplicate'   },
  { key: 'del',        label: 'Delete'      },
  { key: 'copyStyle',  label: 'Copy Style'  },
  { key: 'pasteStyle', label: 'Paste Style' },
]

function onClickOutside(e) {
  if (!e.target.closest('.ctx')) emit('close')
}

onMounted(() => window.addEventListener('mousedown', onClickOutside, true))
onUnmounted(() => window.removeEventListener('mousedown', onClickOutside, true))
</script>

<style scoped>
.ctx {
  position: fixed;
  background: var(--bg2);
  border: 1px solid var(--border2);
  z-index: 9999;
  min-width: 140px;
  box-shadow: 2px 4px 12px rgba(0,0,0,0.6);
  padding: 2px 0;
  border-radius: 3px;
  overflow: visible;
}

.ctx-item {
  position: relative;
  padding: 4px 12px;
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  cursor: pointer;
  color: var(--text1);
}
.ctx-item:hover {
  background: var(--accent-dim);
  color: var(--text0);
  border-left: 2px solid var(--accent);
  padding-left: 10px;
}
.ctx-item.active { color: var(--accent); font-weight: 700; }

.cb-row { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.cb-row:hover { border-left: 2px solid var(--accent); padding-left: 10px; }
.cb-row input { accent-color: var(--accent); cursor: pointer; }

.ctx-sep { height: 1px; background: var(--border2); margin: 2px 0; }

.has-sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.arrow { font-size: 8px; color: var(--text2); margin-left: 8px; }

.ctx-sub {
  display: none;
  position: absolute;
  top: -2px;
  left: 100%;
  background: var(--bg2);
  border: 1px solid var(--border2);
  box-shadow: 2px 4px 12px rgba(0,0,0,0.6);
  padding: 2px 0;
  border-radius: 3px;
  min-width: 130px;
  z-index: 10000;
  overflow: visible;
}

.has-sub:hover .ctx-sub {
  display: block;
}

.ctx-row { display:flex; align-items:center; gap:6px; padding:4px 12px; }
.ctx-label { font-size:10px; font-weight:600; color:var(--text1); width:50px; text-align:left; }
.ctx-input { font-family:'Tahoma',sans-serif; font-size:11px; padding:2px 2px; background:var(--bg3); border:1px solid var(--bg3); border-radius:3px; color:var(--text0); outline:none; width:65px; }
.ctx-input:focus { border-color:var(--accent); }
</style>
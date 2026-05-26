<template>
  <div class="left-panel">
    <div class="tab-bar">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >{{ tab.label }}</div>
    </div>

    <AddTab
      v-if="activeTab === 'add'"
      @add-element="emit('add-element', $event)"
      @add-preset="emit('add-preset', $event)"
    />
    <LayersTab
      v-else-if="activeTab === 'layers'"
      :sorted="sorted"
      :selected="selected"
      @select="emit('select', $event)"
      @multi-select="emit('multi-select', $event)"
      @toggle-visible="emit('toggle-visible', $event)"
      @toggle-lock="emit('toggle-lock', $event)"
      @contextmenu="emit('contextmenu', $event[0], $event[1])"
      @reorder="(a, b) => emit('reorder', a, b)"
    />
    <SpritesTab
      v-else-if="activeTab === 'sprites'"
      :txdSprites="txdStore.txdSprites"
      @insert-sprite="emit('insert-sprite', $event)"
      @sprites-loaded="emit('notify', `Loaded ${$event} sprite(s)`)"
    />
    <RefsTab
      v-else-if="activeTab === 'refs'"
      :bgImage="bgImage"
      :refs="refs"
      :selRef="selRef"
      :txdEntries="txdStore.txdEntries.value"
      @upload-bg="emit('upload-bg', $event)"
      @remove-bg="emit('remove-bg')"
      @upload-refs="emit('upload-refs', $event)"
      @select-ref="emit('select-ref', $event)"
      @toggle-ref-visible="emit('toggle-ref-visible', $event)"
      @toggle-ref-lock="emit('toggle-ref-lock', $event)"
      @delete-ref="emit('delete-ref', $event)"
      @add-txd="e => { console.log('add-txd event:', e, e.file, e.modelId); txdStore.addTxd(e.file, e.modelId) }"
      @remove-txd="id => txdStore.removeTxd(id)"
    />

    <div v-if="warnings.length" class="warnings">
      <div class="warn-title">Validation</div>
      <div
        v-for="(w, i) in warnings"
        :key="i"
        class="warn-row"
        :class="w.type"
      >{{ w.msg }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AddTab from './AddTab.vue'
import LayersTab from './LayersTab.vue'
import SpritesTab from './SpritesTab.vue'
import RefsTab from './RefsTab.vue'
import { useTxdStore } from '../../composables/useTxdStore'

defineProps({
  sorted:   { type: Array,  default: () => [] },
  selected: { type: Object, default: () => new Set() },
  warnings: { type: Array,  default: () => [] },
  bgImage:  { type: String, default: null },
  refs:     { type: Array,  default: () => [] },
  selRef:   { type: String, default: null },
})

const emit = defineEmits([
  'add-element', 'add-preset',
  'select', 'multi-select', 'toggle-visible', 'toggle-lock', 'contextmenu',
  'insert-sprite', 'notify',
  'upload-bg', 'remove-bg', 'upload-refs',
  'select-ref', 'toggle-ref-visible', 'toggle-ref-lock', 'delete-ref',
  'reorder',
])

const activeTab = ref('add')
const txdStore = useTxdStore()

const tabs = [
  { key: 'add',     label: 'Add'     },
  { key: 'layers',  label: 'Layers'  },
  { key: 'sprites', label: 'Sprites' },
  { key: 'refs',    label: 'Refs'    },
]
</script>

<style scoped>
.left-panel {
  width: 172px;
  flex-shrink: 0;
  background: var(--bg1);
  border-right: 1px solid var(--border2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-bar {
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border2);
}

.tab {
  flex: 1;
  padding: 6px 2px;
  text-align: center;
  font-family: 'Tahoma', sans-serif;
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
  color: var(--text2);
  border-right: 1px solid var(--border);
  user-select: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color 0.1s, background 0.1s;
}
.tab:last-child { border-right: none; }
.tab:hover { background: var(--bg2); color: var(--text1); }
.tab.active {
  background: var(--bg2);
  color: var(--accent);
  border-bottom: 2px solid var(--accent);
  margin-bottom: -1px;
}

.warnings {
  border-top: 1px solid var(--border2);
  padding: 6px 8px;
  max-height: 110px;
  overflow-y: auto;
  flex-shrink: 0;
  background: var(--bg0);
}

.warn-title {
  font-family: 'Tahoma', sans-serif;
  font-size: 9px;
  font-weight: 700;
  color: var(--text2);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.warn-row {
  font-family: 'Tahoma', sans-serif;
  font-size: 9px;
  margin-bottom: 3px;
  padding: 2px 4px;
  line-height: 1.4;
  border-radius: 2px;
}
.warn-row.warn {
  color: #e09050;
  border-left: 2px solid #e09050;
  background: rgba(224, 144, 80, 0.06);
}
.warn-row.err {
  color: #cc4444;
  border-left: 2px solid #cc4444;
  background: rgba(204, 68, 68, 0.06);
}
</style>
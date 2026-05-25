<template>
  <div class="layers-tab">
    <div v-if="!sorted.length" class="empty">No elements yet</div>
    <div
      v-for="el in [...sorted].reverse()"
      :key="el.id"
      class="layer-row"
      :class="{ selected: selected.has(el.id), locked: el.locked }"
      draggable="true"
      @click="onRowClick($event, el)"
      @contextmenu.prevent="emit('contextmenu', $event, el)"
      @dragstart="onDragStart($event, el)"
      @dragover.prevent="onDragOver($event, el)"
      @dragleave="onDragLeave"
      @drop="onDrop($event, el)"
    >
      <span class="drag-handle">⠿</span>
      <span class="type-badge">{{ el.type[0].toUpperCase() }}</span>
      <span class="name">{{ el.name }}</span>
      <span
        class="icon"
        title="Toggle visibility"
        draggable="true"
        @mousedown="console.log('mousedown', el.id)"
        @click.stop="emit('toggle-visible', el)"
      >{{ el.visible ? '●' : '○' }}</span>
      <span
        class="icon lock-icon"
        :class="{ active: el.locked }"
        title="Toggle lock"
        @click.stop="emit('toggle-lock', el)"
      >
        <svg v-if="el.locked" width="10" height="11" viewBox="0 0 10 11" fill="none">
          <rect x="1" y="5" width="8" height="6" rx="1" fill="currentColor"/>
          <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" stroke-width="1.4" fill="none"/>
        </svg>
        <svg v-else width="10" height="11" viewBox="0 0 10 11" fill="none">
          <rect x="1" y="5" width="8" height="6" rx="1" fill="currentColor" opacity="0.3"/>
          <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" stroke-width="1.4" fill="none" opacity="0.3"/>
        </svg>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  sorted:   { type: Array,  default: () => [] },
  selected: { type: Object, default: () => new Set() },
})

const emit = defineEmits(['select', 'multi-select', 'toggle-visible', 'toggle-lock', 'contextmenu', 'reorder'])

const dragId    = ref(null)
const dragOverId = ref(null)

function onRowClick(e, el) {
  if (e.ctrlKey || e.shiftKey) emit('multi-select', el)
  else emit('select', el)
}

function onDragStart(e, el) {
  dragId.value = el.id
  e.dataTransfer.setData('text/plain', el.id)
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setDragImage(new Image(), 0, 0)
  console.log('dragstart', el.id)
}

function onDrop(e, target) {
  e.preventDefault()
  console.log('drop', dragId.value, '->', target.id)
  if (dragId.value && dragId.value !== target.id) {
    emit('reorder', dragId.value, target.id)
  }
  dragId.value     = null
  dragOverId.value = null
}

function onDragOver(e, el) {
  dragOverId.value = el.id
  e.dataTransfer.dropEffect = 'move'
}

function onDragLeave() {
  dragOverId.value = null
}

</script>

<style scoped>
.layers-tab {
  flex: 1;
  overflow-y: auto;
}
.empty {
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  color: var(--text2);
  padding: 12px;
  text-align: center;
  font-style: italic;
}
.layer-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  cursor: pointer;
  border-left: 2px solid transparent;
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  color: var(--text1);
  border-bottom: 1px solid var(--border);
}
.layer-row:hover { background: var(--bg3); color: var(--text0); }
.layer-row.selected {
  background: var(--accent-dim);
  color: var(--text0);
  border-left-color: var(--accent);
}
.layer-row.selected .icon { color: var(--text1); }
.layer-row.locked { opacity: 0.5; }
.drag-handle {
  cursor: grab;
  color: var(--text2);
  font-size: 13px;
  flex-shrink: 0;
  line-height: 1;
}
.layer-row.selected .drag-handle { color: var(--accent); }
.type-badge {
  font-size: 9px;
  font-weight: 700;
  color: var(--accent);
  width: 12px;
  flex-shrink: 0;
}
.layer-row.selected .type-badge { color: var(--accent); }
.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.icon {
  cursor: pointer;
  font-size: 11px;
  color: var(--text2);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.lock-icon { color: var(--text2); }
.lock-icon.active { color: var(--red); }
.layer-row.selected .lock-icon { color: var(--text1); }
.layer-row.selected .lock-icon.active { color: #ff6666; }
</style>
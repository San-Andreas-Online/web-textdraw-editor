<template>
  <transition name="slide">
    <div class="right-panel" v-if="selOne || selRefObj || selArr.length > 1">
      <div class="props-area">
        <div class="section-title">
          {{ selArr.length > 1 ? `Multi Select (${selArr.length} elements)` : 'Properties' }}
        </div>

        <TDProperties
          v-if="selOne"
          :el="selOne"
          :selArr="selArr"
          @update="(patches) => emit('update-el', selOne.id, patches)"
          @update-multi="(patches) => emit('update-multi', patches)"
          @update-multi-scale="(pct) => emit('update-multi-scale', pct)"
          @duplicate="emit('duplicate')"
          @delete="emit('delete')"
        />

        <TDProperties
          v-else-if="!selOne && !selRefObj && selArr.length > 1"
          :el="{ color: 0, boxColor: 0, font: 0, align: 0 }"
          :selArr="selArr"
          @update-multi="(patches) => emit('update-multi', patches)"
          @update-multi-scale="(pct) => emit('update-multi-scale', pct)"
          @duplicate="emit('duplicate')"
          @delete="emit('delete')"
        />

        <RefProperties
          v-else-if="selRefObj"
          :r="selRefObj"
          @update="(patches) => emit('update-ref', selRefObj.id, patches)"
          @delete="emit('delete-ref', selRefObj.id)"
        />
      </div>
    </div>
  </transition>
</template>

<script setup>
import TDProperties  from './TDProperties.vue'
import RefProperties from './RefProperties.vue'
import ArrangePanel  from './ArrangePanel.vue'
import FontReference from './FontReference.vue'

defineProps({
  selOne:    { type: Object, default: null },
  selRefObj: { type: Object, default: null },
  selArr:    { type: Array,  default: () => [] },
})

const emit = defineEmits([
  'update-el', 'update-multi', 'update-multi-scale', 'duplicate', 'delete',
  'update-ref', 'delete-ref',
  'align', 'copy-style', 'paste-style', 'batch-rename',
])
</script>

<style scoped>
.right-panel {
  width: 214px;
  flex-shrink: 0;
  background: var(--bg1);
  border-left: 1px solid var(--border2);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.props-area {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.section-title {
  font-family: 'Tahoma', sans-serif;
  font-size: 9px;
  font-weight: 700;
  color: var(--text2);
  border-bottom: 1px solid var(--border);
  padding-bottom: 2px;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.slide-enter-active,
.slide-leave-active {
  transition: width 0.2s ease, opacity 0.2s ease;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  width: 0;
  opacity: 0;
}
.slide-enter-to,
.slide-leave-from {
  width: 214px;
  opacity: 1;
}
</style>
<template>
  <div class="ref-props">
    <!-- Header -->
    <div class="ref-header">
      <div class="thumb">
        <img :src="r.src" style="width:100%;height:100%;object-fit:cover" alt="" />
      </div>
      <span class="ref-badge">Reference Image</span>
    </div>

    <PropRow label="Name">
      <input class="xp-input" :value="r.name" @change="u('name', $event.target.value)" />
    </PropRow>

    <XpPanel title="Transform">
      <div class="num-grid">
        <div class="num-cell">
          <span class="num-label">X</span>
          <NumberInput :value="r.x" @update:modelValue="u('x', $event)" />
        </div>
        <div class="num-cell">
          <span class="num-label">Y</span>
          <NumberInput :value="r.y" @update:modelValue="u('y', $event)" />
        </div>
        <div class="num-cell">
          <span class="num-label">W</span>
          <NumberInput :value="r.w" :min="10" @update:modelValue="u('w', Math.max(10,$event))" />
        </div>
        <div class="num-cell">
          <span class="num-label">H</span>
          <NumberInput :value="r.h" :min="10" @update:modelValue="u('h', Math.max(10,$event))" />
        </div>
      </div>
    </XpPanel>

    <XpPanel title="Opacity">
      <PropRow label="Alpha">
        <div class="slider-row">
          <input type="range" min="0" max="100" :value="r.opacity"
            @input="u('opacity', +$event.target.value)" class="slider" />
          <span class="slider-val">{{ r.opacity }}%</span>
        </div>
      </PropRow>
    </XpPanel>

    <XpPanel title="Options">
      <div class="checkboxes">
        <label class="cb-row">
          <input type="checkbox" :checked="r.visible" @change="u('visible', $event.target.checked)" />
          Visible
        </label>
        <label class="cb-row">
          <input type="checkbox" :checked="r.locked" @change="u('locked', $event.target.checked)" />
          Lock
        </label>
      </div>
    </XpPanel>

    <button class="xp-btn danger" style="width:100%;margin-top:4px" @click="emit('delete')">
      Delete Reference
    </button>
  </div>
</template>

<script setup>
import PropRow from '../shared/PropRow.vue'
import NumberInput from '../shared/NumberInput.vue'
import XpPanel from '../shared/XpPanel.vue'

const props = defineProps({ r: { type: Object, required: true } })
const emit  = defineEmits(['update', 'delete'])

function u(key, val) { emit('update', { [key]: val }) }
</script>

<style scoped>
.ref-props { display: flex; flex-direction: column; gap: 2px; }

.ref-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
  padding: 5px; background: var(--bg3); border: 1px solid var(--border2);
}
.thumb {
  width: 32px; height: 24px; border: 1px solid var(--border2);
  border-radius: 1px; overflow: hidden; flex-shrink: 0;
}
.ref-badge { font-family: 'Tahoma', sans-serif; font-size: 11px; font-weight: 700; color: var(--text0); }

.xp-input {
  width: 100%; box-sizing: border-box;
  font-family: 'Tahoma', sans-serif; font-size: 11px; padding: 2px 4px;
  background: var(--bg0);
  border: 1px solid var(--border2);
  color: var(--text0);
  outline: none;
}
.xp-input:focus { border-color: var(--accent); }

.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }

.slider-row { display: flex; align-items: center; gap: 6px; }
.slider { flex: 1; accent-color: var(--accent); }
.slider-val { font-family: 'Tahoma', sans-serif; font-size: 11px; min-width: 30px; text-align: right; color: var(--accent); font-weight: 700; }

.checkboxes { display: flex; gap: 10px; flex-wrap: wrap; }
.cb-row {
  display: flex; align-items: center; gap: 3px;
  font-family: 'Tahoma', sans-serif; font-size: 11px; color: var(--text1); cursor: pointer;
}
.cb-row input[type="checkbox"] { accent-color: var(--accent); cursor: pointer; }
.cb-row.locked { color: var(--accent); font-weight: 700; }

.lock-warning {
  margin-top: 4px; padding: 4px; font-family: 'Tahoma', sans-serif; font-size: 10px;
  color: var(--accent); background: var(--accent-dim); border: 1px solid var(--accent);
}

.xp-btn {
  font-family: 'Tahoma', sans-serif; font-size: 10px; font-weight: 600; padding: 4px 8px; cursor: pointer;
  color: var(--text1); background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 3px;
  outline: none; user-select: none;
  transition: border-color 0.1s, color 0.1s, background 0.1s;
}
.xp-btn:hover { background: var(--bg2); border-color: var(--accent); color: var(--text0); }
.xp-btn:active { background: var(--bg0); border-color: #C80041; }
.xp-btn.danger { color: var(--red); border-color: var(--red); }
.xp-btn.danger:hover { background: rgba(204, 68, 68, 0.1); color: #ff6666; }

.num-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 6px;
  margin-bottom: 2px;
}
.num-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.num-label {
  font-family: 'Tahoma', sans-serif;
  font-size: 9px;
  color: var(--text2);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.slider {
  flex: 1;
  min-width: 0;
  max-width: 110px;
  accent-color: var(--accent);
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--bg3);
  outline: none;
  flex: 1;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: none;
}
.slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: none;
}
.slider::-moz-range-track {
  background: var(--bg3);
  height: 4px;
  border-radius: 2px;
}
.slider-val {
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  min-width: 30px;
  text-align: right;
  color: var(--accent);
  font-weight: 700;
}

</style>

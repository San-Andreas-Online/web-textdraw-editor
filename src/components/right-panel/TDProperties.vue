<template>
  <div class="td-props">
    <!-- Name + Type -->
    <PropRow label="Name">
      <input class="xp-input" :value="el.name" @input="u('name', $event.target.value)" />
    </PropRow>
    <PropRow label="Type">
      <span class="type-label">{{ el.type }}{{ el.locked ? ' 🔒' : ' ' }}</span>
    </PropRow>

    <!-- Transform -->
    <XpPanel title="Transform">
      <div class="num-grid">
        <div class="num-cell">
          <span class="num-label">X</span>
          <NumberInput :value="el.x" :min="0" :max="640" @update:modelValue="u('x', $event)" />
        </div>
        <div class="num-cell">
          <span class="num-label">Y</span>
          <NumberInput :value="el.y" :min="0" :max="448" @update:modelValue="u('y', $event)" />
        </div>
        <div class="num-cell">
          <span class="num-label">W</span>
          <NumberInput :value="el.w" :min="1" @update:modelValue="u('w', Math.max(1,$event))" />
        </div>
        <div class="num-cell">
          <span class="num-label">H</span>
          <NumberInput :value="el.h" :min="1" @update:modelValue="u('h', Math.max(1,$event))" />
        </div>
      </div>
    </XpPanel>

    <!-- Text (label / button) -->
    <XpPanel v-if="isText" title="Text">
      <PropRow label="Text">
        <input class="xp-input" :value="el.text" @input="u('text', $event.target.value)" />
      </PropRow>
      <PropRow v-if="el.type !== 'sprite'" label="Font">
        <div class="font-select" :class="{ open: fontOpen }" @click="fontOpen = !fontOpen">
          <span :style="{ fontFamily: FONTS[el.font]?.family }">{{ FONTS[el.font]?.name }}</span>
          <span class="font-arrow">▾</span>
          <div class="font-dropdown" v-if="fontOpen">
            <div
              class="font-option"
              v-for="f in FONTS"
              :key="f.id"
              :class="{ active: el.font === f.id }"
              :style="{ fontFamily: f.family }"
              @mousedown.prevent="u('font', f.id); fontOpen = false"
            >{{ f.name }}</div>
          </div>
        </div>
      </PropRow>
      <PropRow label="Align">
        <div class="font-select" :class="{ open: alignOpen }" @click="alignOpen = !alignOpen">
          <span>{{ ALIGN_OPTIONS[el.align]?.label }}</span>
          <span class="font-arrow">▾</span>
          <div class="font-dropdown" v-if="alignOpen">
            <div
              class="font-option"
              v-for="a in ALIGN_OPTIONS"
              :key="a.id"
              :class="{ active: el.align === a.id }"
              @mousedown.prevent="u('align', a.id); alignOpen = false"
            >{{ a.label }}</div>
          </div>
        </div>
      </PropRow>
      <div class="num-grid">
        <div class="num-cell">
          <span class="num-label">LtrX</span>
          <NumberInput :value="el.letterX" :step="0.005" :min="0" @update:modelValue="u('letterX', $event)" />
        </div>
        <div class="num-cell">
          <span class="num-label">LtrY</span>
          <NumberInput :value="el.letterY" :step="0.005" :min="0" @update:modelValue="u('letterY', $event)" />
        </div>
        <div class="num-cell">
          <span class="num-label">TxSzX</span>
          <NumberInput :value="el.textSizeX" @update:modelValue="u('textSizeX', $event)" />
        </div>
        <div class="num-cell">
          <span class="num-label">TxSzY</span>
          <NumberInput :value="el.textSizeY" @update:modelValue="u('textSizeY', $event)" />
        </div>
        <div class="num-cell">
          <span class="num-label">Outline</span>
          <NumberInput :value="el.outline" :min="0" :max="8" @update:modelValue="u('outline', $event)" />
        </div>
        <div class="num-cell">
          <span class="num-label">Shadow</span>
          <NumberInput :value="el.shadow" :min="0" :max="8" @update:modelValue="u('shadow', $event)" />
        </div>
      </div>
      <XpPanel title="Properties">
        <div class="checkboxes">
          <label v-for="[label, key] in textFlags" :key="key" class="cb-row">
            <input type="checkbox" :checked="!!el[key]" @input="u(key, $event.target.checked)" />
            {{ label }}
          </label>
        </div>
      </XpPanel>
    </XpPanel>

    <!-- Sprite -->
    <XpPanel v-if="el.type === 'sprite'" title="Sprite">
      <PropRow label="lib:tex">
        <input class="xp-input" :value="el.text" @input="u('text', $event.target.value)" />
      </PropRow>
    </XpPanel>

    <!-- Progress -->
    <XpPanel v-if="el.type === 'progress'" title="Progress">
      <PropRow label="Value %">
        <NumberInput :value="parseFloat(el.text) || 0" :min="0" :max="100"
          @update:modelValue="u('text', String(Math.min(100, Math.max(0, $event))))" />
      </PropRow>
    </XpPanel>

    <!-- Colors -->
    <XpPanel title="Colors">
      <div class="color-label">Text color</div>
      <ColorSwatch :modelValue="el.color" @update:modelValue="u('color', $event)" />
      <div class="color-label" style="margin-top:6px">Box color</div>
      <ColorSwatch :modelValue="el.boxColor" @update:modelValue="u('boxColor', $event)" />
      <template v-if="el.type !== 'sprite'">
        <div class="color-label" style="margin-top:6px">Background color</div>
        <ColorSwatch :modelValue="el.bgColor ?? 0x00000080" @update:modelValue="u('bgColor', $event)" />
      </template>
    </XpPanel>

  </div>
</template>

<script setup>
import { FONTS } from '../../constants/fonts'
import PropRow     from '../shared/PropRow.vue'
import NumberInput from '../shared/NumberInput.vue'
import ColorSwatch from '../shared/ColorSwatch.vue'
import XpPanel     from '../shared/XpPanel.vue'
import { FONT_NAMES } from '../../constants/fonts'
import { computed, ref, onMounted, onUnmounted } from 'vue'


const fontOpen = ref(false)
const props = defineProps({ el: { type: Object, required: true } })
const emit  = defineEmits(['update'])

const alignOpen = ref(false)
const ALIGN_OPTIONS = [
  { id: 0, label: 'Left' },
  { id: 1, label: 'Center' },
  { id: 2, label: 'Right' },
]

function u(key, val) { emit('update', { [key]: val }) }

function onClickOutside(e)
{
  if (!e.target.closest('.font-select')) {
    fontOpen.value = false
    alignOpen.value = false
  }
}

onMounted(() => window.addEventListener('mousedown', onClickOutside))
onUnmounted(() => window.removeEventListener('mousedown', onClickOutside))

const isText = computed(() => ['label', 'button', 'box', 'sprite'].includes(props.el.type))

const textFlags = computed(() => {
  const flags = [
    ['Proportional', 'proportional'],
    ['Use Box',      'useBox'],
    ['Selectable',   'selectable'],
    ['Player TD',    'isPlayer'],
  ]
  if (props.el.type === 'sprite') {
    return flags.filter(([_, key]) => key !== 'useBox')
  }
  return flags
})
</script>

<style scoped>
.td-props { display: flex; flex-direction: column; gap: 2px; }

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

.xp-input {
  width: 100%;
  box-sizing: border-box;
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  padding: 2px 4px;
  background: var(--bg0);
  border: 1px solid var(--border2);
  border-radius: 3px;
  color: var(--text0);
  outline: none;
}
.xp-input:focus {
  border-color: var(--accent);
}

.type-label {
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  color: var(--accent);
  font-weight: 700;
}

.checkboxes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 8px;
  margin-top: 4px;
}
.cb-row {
  display: flex;
  align-items: center;
  gap: 3px;
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  color: var(--text1);
  cursor: pointer;
}
.cb-row input[type="checkbox"] {
  background: #000000;
  accent-color: var(--accent);
  cursor: pointer;
}

.color-label {
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  color: var(--text2);
  margin-bottom: 3px;
}

.toggle-group {
  display: flex;
  border: 1px solid var(--border2);
  border-radius: 3px;
  overflow: hidden;
  width: 100%;
}
.tog-btn {
  flex: 1;
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  padding: 3px 4px;
  cursor: pointer;
  border: none;
  background: var(--bg3);
  color: var(--text1);
  font-weight: 700;
  transition: background 0.1s, color 0.1s;
}
.tog-btn:hover {
  background: var(--bg2);
  color: var(--text0);
}
.tog-btn.active {
  background: var(--accent);
  color: #fff;
}

.xp-btn {
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  cursor: pointer;
  color: var(--text1);
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 3px;
  outline: none;
  user-select: none;
  transition: border-color 0.1s, color 0.1s, background 0.1s;
}
.xp-btn:hover {
  border-color: var(--accent);
  color: var(--text0);
  background: var(--bg2);
}
.xp-btn:active {
  background: var(--bg0);
  border-color: #C80041;
}
.xp-btn.danger {
  color: var(--red);
}
.xp-btn.danger:hover {
  border-color: var(--red);
  color: #ff6666;
}

.actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}
.actions .xp-btn { flex: 1; }

.cb-spacer { width: 100%; }

.font-select { position:relative; display:flex; align-items:center; justify-content:space-between; padding:2px 6px; background:var(--bg0); border:1px solid var(--border2); border-radius:3px; cursor:pointer; font-size:11px; color:var(--text0); min-width:100px; }
.font-select:hover { border-color:var(--accent); }
.font-arrow { font-size:9px; color:var(--text2); margin-left:6px; }
.font-dropdown { position:absolute; top:100%; left:0; right:0; background:var(--bg2); border:1px solid var(--border2); border-radius:3px; z-index:999; box-shadow:2px 4px 12px rgba(0,0,0,0.6); }
.font-option { padding:4px 8px; font-size:13px; cursor:pointer; color:var(--text0); }
.font-option:hover { background:var(--accent-dim); color:var(--text0); }
.font-option.active { color:var(--accent); }

</style>
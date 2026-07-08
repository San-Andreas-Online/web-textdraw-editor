<template>
  <div class="td-props">

    <template v-if="isMulti">
      <PropRow label="Name">
        <input class="xp-input" placeholder="Enter name" @input="um('name', $event.target.value)" />
      </PropRow>
      <PropRow label="Text">
        <input class="xp-input" placeholder="Enter text" @input="um('text', $event.target.value)" />
      </PropRow>

      <XpPanel title="Style">
        <PropRow label="Font">
          <div class="font-select" :class="{ open: fontOpen }" @click="fontOpen = !fontOpen, alignOpen = false">
            <span :style="{ fontFamily: multiFont !== null ? FONTS[multiFont]?.family : '' }">
              {{ multiFont !== null ? FONTS[multiFont]?.name : 'Select' }}
            </span>
            <span class="font-arrow">▾</span>
            <div class="font-dropdown" v-if="fontOpen">
              <div class="font-option" v-for="f in FONTS" :key="f.id"
                :style="{ fontFamily: f.family }"
                @mousedown.prevent="multiFont = f.id; um('font', f.id); fontOpen = false"
              >{{ f.name }}</div>
            </div>
          </div>
        </PropRow>
        <PropRow label="Align">
          <div class="font-select" :class="{ open: alignOpen }" @click="alignOpen = !alignOpen, fontOpen = false">
            <span>{{ multiAlign !== null ? ALIGN_OPTIONS[multiAlign]?.label : 'Select' }}</span>
            <span class="font-arrow">▾</span>
            <div class="font-dropdown" v-if="alignOpen">
              <div class="font-option" v-for="a in ALIGN_OPTIONS" :key="a.id"
                @mousedown.prevent="multiAlign = a.id; um('align', a.id); alignOpen = false"
              >{{ a.label }}</div>
            </div>
          </div>
        </PropRow>
        <div class="num-grid" style="margin-top:4px">
          <div class="num-cell">
            <span class="num-label">LtrX</span>
            <NumberInput :value="0" :step="0.005" :min="0" @update:modelValue="um('letterX', $event)" />
          </div>
          <div class="num-cell">
            <span class="num-label">LtrY</span>
            <NumberInput :value="0" :step="0.005" :min="0" @update:modelValue="um('letterY', $event)" />
          </div>
        </div>
        <div class="num-grid" style="margin-top:4px">
          <div class="num-cell">
            <span class="num-label">Outline</span>
            <NumberInput :value="0" :min="0" :max="8" @update:modelValue="um('outline', $event)" />
          </div>
          <div class="num-cell">
            <span class="num-label">Shadow</span>
            <NumberInput :value="0" :min="0" :max="8" @update:modelValue="um('shadow', $event)" />
          </div>
        </div>
      </XpPanel>

      <XpPanel title="Colors">
        <div class="color-label">Text color</div>
        <ColorSwatch :modelValue="multiColor" @update:modelValue="multiColor = $event; um('color', $event)" />
        <div class="color-label" style="margin-top:6px">Box color</div>
        <ColorSwatch :modelValue="multiBoxColor" @update:modelValue="multiBoxColor = $event; um('boxColor', $event)" />
        <div class="color-label" style="margin-top:6px">Background color</div>
        <ColorSwatch :modelValue="multiBgColor" @update:modelValue="multiBgColor = $event; um('bgColor', $event)" />
      </XpPanel>

      <XpPanel title="Properties">
        <div class="checkboxes">
          <label v-for="[label, key] in textFlags" :key="key" class="cb-row">
           <input type="checkbox"
              :checked="multiFlags[key]"
              @input="multiFlags[key] = $event.target.checked; um(key, $event.target.checked)"
            />
            {{ label }}
          </label>
        </div>
      </XpPanel>
    </template>

    <template v-else>
      <PropRow label="Name">
        <input class="xp-input" :value="el.name" @input="u('name', $event.target.value)" />
      </PropRow>
      <PropRow label="Type">
        <span class="type-label">{{ el.type }}{{ el.locked ? ' 🔒' : ' ' }}</span>
      </PropRow>

      <XpPanel title="Transform">
        <div class="num-grid">
          <div class="num-cell"><span class="num-label">X</span><NumberInput :value="el.x" :min="0" :max="640" @update:modelValue="u('x', $event)" /></div>
          <div class="num-cell"><span class="num-label">Y</span><NumberInput :value="el.y" :min="0" :max="448" @update:modelValue="u('y', $event)" /></div>
          <div class="num-cell"><span class="num-label">W</span><NumberInput :value="el.w" :min="1" @update:modelValue="u('w', Math.max(1,$event))" /></div>
          <div class="num-cell"><span class="num-label">H</span><NumberInput :value="el.h" :min="1" @update:modelValue="u('h', Math.max(1,$event))" /></div>
        </div>
      </XpPanel>

      <XpPanel v-if="isText" title="Text">
        <PropRow label="Text"><input class="xp-input" :value="el.text" @input="u('text', $event.target.value)" /></PropRow>
        <PropRow v-if="el.type !== 'sprite'" label="Font">
          <div class="font-select" :class="{ open: fontOpen }" @click="fontOpen = !fontOpen, alignOpen = false">
            <span :style="{ fontFamily: FONTS[el.font]?.family }">{{ FONTS[el.font]?.name }}</span>
            <span class="font-arrow">▾</span>
            <div class="font-dropdown" v-if="fontOpen">
              <div class="font-option" v-for="f in FONTS" :key="f.id" :class="{ active: el.font === f.id }" :style="{ fontFamily: f.family }" @mousedown.prevent="u('font', f.id); fontOpen = false">{{ f.name }}</div>
            </div>
          </div>
        </PropRow>
        <PropRow label="Align">
          <div class="font-select" :class="{ open: alignOpen }" @click="alignOpen = !alignOpen, fontOpen = false"">
            <span>{{ ALIGN_OPTIONS[el.align]?.label }}</span>
            <span class="font-arrow">▾</span>
            <div class="font-dropdown" v-if="alignOpen">
              <div class="font-option" v-for="a in ALIGN_OPTIONS" :key="a.id" :class="{ active: el.align === a.id }" @mousedown.prevent="u('align', a.id); alignOpen = false">{{ a.label }}</div>
            </div>
          </div>
        </PropRow>
        <div class="num-grid">
          <div class="num-cell"><span class="num-label">LtrX</span><NumberInput :value="el.letterX" :step="0.005" :min="0" @update:modelValue="u('letterX', $event)" /></div>
          <div class="num-cell"><span class="num-label">LtrY</span><NumberInput :value="el.letterY" :step="0.005" :min="0" @update:modelValue="u('letterY', $event)" /></div>
          <div class="num-cell"><span class="num-label">TxSzX</span><NumberInput :value="el.textSizeX" @update:modelValue="u('textSizeX', $event)" /></div>
          <div class="num-cell"><span class="num-label">TxSzY</span><NumberInput :value="el.textSizeY" @update:modelValue="u('textSizeY', $event)" /></div>
          <div class="num-cell"><span class="num-label">Outline</span><NumberInput :value="el.outline" :min="0" :max="8" @update:modelValue="u('outline', $event)" /></div>
          <div class="num-cell"><span class="num-label">Shadow</span><NumberInput :value="el.shadow" :min="0" :max="8" @update:modelValue="u('shadow', $event)" /></div>
        </div>
        <XpPanel title="Properties">
          <div class="checkboxes">
            <label v-for="[label, key] in textFlags" :key="key" class="cb-row">
              <input type="checkbox" :checked="!!el[key]" @input="u(key, $event.target.checked)" />{{ label }}
            </label>
          </div>
        </XpPanel>
      </XpPanel>

      <XpPanel v-if="el.type === 'sprite'" title="Sprite">
        <PropRow label="lib:tex"><input class="xp-input" :value="el.text" @input="u('text', $event.target.value)" /></PropRow>
      </XpPanel>

      <XpPanel v-if="el.type === 'progress'" title="Progress">
        <PropRow label="Value %">
          <NumberInput :value="parseFloat(el.text) || 0" :min="0" :max="100" @update:modelValue="u('text', String(Math.min(100, Math.max(0, $event))))" />
        </PropRow>
      </XpPanel>

      <!-- ── Model previewer panel ── -->
      <XpPanel v-if="el.type === 'model'" title="Model">

        <!-- Model type tabs -->
        <div class="toggle-group" style="margin-bottom:8px">
          <button
            v-for="tab in [['vehicle','Vehicles'],['skin','Skins'],['object','Objects']]"
            :key="tab[0]"
            class="tog-btn"
            :class="{ active: modelTypeTab === tab[0] }"
            @click="switchModelTab(tab[0])"
          >{{ tab[1] }}</button>
        </div>

        <PropRow :label="modelTypeTab === 'vehicle' ? 'Vehicle' : modelTypeTab === 'skin' ? 'Skin' : 'Object'">
          <div class="font-select model-vehicle-select" :class="{ open: vehicleOpen }" @click="vehicleOpen = !vehicleOpen; color1Open = false; color2Open = false">
            <span class="vehicle-label">{{ modelLabel(el.modelId) }}</span>
            <span class="vehicle-id">{{ el.modelId }}</span>
            <span class="font-arrow">▾</span>
            <div class="font-dropdown vehicle-dropdown" v-if="vehicleOpen">
              <div class="vehicle-search-wrap">
                <input
                  class="vehicle-search"
                  v-model="vehicleSearch"
                  placeholder="Search..."
                  @click.stop
                  @mousedown.stop
                />
              </div>
              <div
                class="vehicle-list"
                :ref="modelTypeTab === 'object' ? (el) => { objectListEl = el } : undefined"
                @scroll="modelTypeTab === 'object' ? onObjectListScroll($event) : undefined"
              >
                <div
                  class="font-option vehicle-option"
                  v-for="item in currentList"
                  :key="item.id"
                  :class="{ active: el.modelId === item.id }"
                  @mousedown.prevent="u('modelId', item.id); vehicleOpen = false; vehicleSearch = ''"
                  @mouseenter="onItemMouseEnter(item, $event)"
                  @mouseleave="onItemMouseLeave"
                >
                  <span>{{ (item.name ?? item.model).slice(0, 9) + ((item.name ?? item.model).length > 9 ? '…' : '') }}</span>
                  <span class="vehicle-opt-id">{{ item.id }}</span>
                </div>
                <div v-if="modelTypeTab === 'object' && !vehicleSearch.trim() && visibleObjects.length < filteredObjects.length" class="object-load-hint">
                  Scroll for more…
                </div>
              </div>
            </div>
          </div>
        </PropRow>
        <Teleport to="body">
          <Transition name="preview-fade">
            <div
              v-if="hoverVisible && hoverItem"
              class="model-hover-preview"
              :style="{ top: hoverY + 'px', left: hoverX + 'px' }"
            >
              <ModelRenderer
                :modelId="hoverItem.id"
                :modelType="modelTypeTab"
                :modelZoom="el.modelZoom"
                :modelRotX="el.modelRotX"
                :modelRotY="el.modelRotY"
                :modelRotZ="el.modelRotZ"
                :modelColor1="el.modelColor1 ?? 0"
                :modelColor2="el.modelColor2 ?? 0"
                :color="0xFFFFFFFF"
                :boxColor="0x00000000"
              />
            </div>
          </Transition>
        </Teleport>
        <div class="num-grid" style="margin-top:6px">
          <div class="num-cell">
            <span class="num-label">Zoom</span>
            <NumberInput :value="el.modelZoom" :step="0.05" :min="0.1" :max="20" @update:modelValue="u('modelZoom', $event)" />
          </div>
          <div class="num-cell">
            <span class="num-label">Rot X</span>
            <NumberInput :value="el.modelRotX" :step="1" :min="-180" :max="180" @update:modelValue="u('modelRotX', $event)" />
          </div>
          <div class="num-cell">
            <span class="num-label">Rot Y</span>
            <NumberInput :value="el.modelRotY" :step="1" :min="-180" :max="180" @update:modelValue="u('modelRotY', $event)" />
          </div>
          <div class="num-cell">
            <span class="num-label">Rot Z</span>
            <NumberInput :value="el.modelRotZ" :step="1" :min="-180" :max="180" @update:modelValue="u('modelRotZ', $event)" />
          </div>
        </div>
        <div v-if="modelTypeTab === 'vehicle'" class="num-grid" style="margin-top:6px">
          <div class="num-cell">
            <span class="num-label">Primary</span>
            <div class="font-select colour-dropdown-trigger" :class="{ open: color1Open }" @click="color1Open = !color1Open; color2Open = false; vehicleOpen = false; vehicleSearch = ''">
              <span class="colour-preview" :style="{ background: SA_CAR_COLOURS[el.modelColor1] ? `rgb(${SA_CAR_COLOURS[el.modelColor1][0]},${SA_CAR_COLOURS[el.modelColor1][1]},${SA_CAR_COLOURS[el.modelColor1][2]})` : '#888' }"></span>
              <span class="colour-trigger-id">{{ el.modelColor1 }}</span>
              <span class="font-arrow">▾</span>
              <div class="font-dropdown colour-palette-dropdown" v-if="color1Open" @click.stop>
                <div class="colour-id-input-row">
                  <span class="colour-preview-sm" :style="{ background: SA_CAR_COLOURS[el.modelColor1] ? `rgb(${SA_CAR_COLOURS[el.modelColor1][0]},${SA_CAR_COLOURS[el.modelColor1][1]},${SA_CAR_COLOURS[el.modelColor1][2]})` : '#888' }"></span>
                  <input class="colour-id-input" type="number" min="0" max="255"
                    :value="el.modelColor1"
                    @mousedown.stop
                    @input="u('modelColor1', Math.min(255, Math.max(0, parseInt($event.target.value) || 0)))"
                  />
                </div>
                <div class="colour-palette-grid">
                  <div
                    v-for="(col, idx) in SA_CAR_COLOURS"
                    :key="idx"
                    class="colour-swatch"
                    :class="{ active: el.modelColor1 === idx }"
                    :style="{ background: `rgb(${col[0]},${col[1]},${col[2]})` }"
                    :title="idx"
                    @mousedown.prevent="u('modelColor1', idx)"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="num-cell">
            <span class="num-label">Secondary</span>
            <div class="font-select colour-dropdown-trigger" :class="{ open: color2Open }" @click="color2Open = !color2Open; color1Open = false; vehicleOpen = false; vehicleSearch = ''">
              <span class="colour-preview" :style="{ background: SA_CAR_COLOURS[el.modelColor2] ? `rgb(${SA_CAR_COLOURS[el.modelColor2][0]},${SA_CAR_COLOURS[el.modelColor2][1]},${SA_CAR_COLOURS[el.modelColor2][2]})` : '#888' }"></span>
              <span class="colour-trigger-id">{{ el.modelColor2 }}</span>
              <span class="font-arrow">▾</span>
              <div class="font-dropdown colour-palette-dropdown colour-palette-dropdown--right" v-if="color2Open" @click.stop>
                <div class="colour-id-input-row">
                  <span class="colour-preview-sm" :style="{ background: SA_CAR_COLOURS[el.modelColor2] ? `rgb(${SA_CAR_COLOURS[el.modelColor2][0]},${SA_CAR_COLOURS[el.modelColor2][1]},${SA_CAR_COLOURS[el.modelColor2][2]})` : '#888' }"></span>
                  <input class="colour-id-input" type="number" min="0" max="255"
                    :value="el.modelColor2"
                    @mousedown.stop
                    @input="u('modelColor2', Math.min(255, Math.max(0, parseInt($event.target.value) || 0)))"
                  />
                </div>
                <div class="colour-palette-grid">
                  <div
                    v-for="(col, idx) in SA_CAR_COLOURS"
                    :key="idx"
                    class="colour-swatch"
                    :class="{ active: el.modelColor2 === idx }"
                    :style="{ background: `rgb(${col[0]},${col[1]},${col[2]})` }"
                    :title="idx"
                    @mousedown.prevent="u('modelColor2', idx)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style="margin-top:10px">
          <div class="color-label">Tint color</div>
          <ColorSwatch :modelValue="el.color ?? 0xFFFFFFFF" @update:modelValue="u('color', $event)" />
          <div class="color-label" style="margin-top:6px">Box color</div>
          <ColorSwatch :modelValue="el.boxColor ?? 0x00000000" @update:modelValue="u('boxColor', $event)" />
        </div>
      </XpPanel>

      <XpPanel v-if="el.type !== 'model'" title="Colors">
        <div class="color-label">Text color</div>
        <ColorSwatch :modelValue="el.color" @update:modelValue="u('color', $event)" />
        <div class="color-label" style="margin-top:6px">Box color</div>
        <ColorSwatch :modelValue="el.boxColor" @update:modelValue="u('boxColor', $event)" />
        <template v-if="el.type !== 'sprite'">
          <div class="color-label" style="margin-top:6px">Background color</div>
          <ColorSwatch :modelValue="el.bgColor ?? 0x00000080" @update:modelValue="u('bgColor', $event)" />
        </template>
      </XpPanel>
    </template>

  </div>
</template>

<script setup>
import { FONTS } from '../../constants/fonts'
import PropRow     from '../shared/PropRow.vue'
import NumberInput from '../shared/NumberInput.vue'
import ColorSwatch from '../shared/ColorSwatch.vue'
import XpPanel     from '../shared/XpPanel.vue'
import ModelRenderer from '../canvas/ModelRenderer.vue'
import { FONT_NAMES } from '../../constants/fonts'
import { computed, ref, watch, reactive, onMounted, onUnmounted } from 'vue'
import { SA_VEHICLES, SA_VEHICLE_MAP } from '../../constants/saVehicles'
import { SA_CAR_COLOURS } from '../../constants/saCarColours'
import { SA_SKINS, SA_SKIN_MAP, SA_OBJECTS, SA_OBJECT_MAP, saModelsReady } from '../../constants/saModels'

const fontOpen     = ref(false)
const vehicleOpen  = ref(false)
const vehicleSearch = ref('')
const modelTypeTab = ref('vehicle')

const MODEL_TYPE_DEFAULT_IDS = { vehicle: 411, skin: 1, object: 16442 }

const hoverItem    = ref(null)
const hoverTimer   = ref(null)
const hoverVisible = ref(false)
const hoverX       = ref(0)
const hoverY       = ref(0)

function onItemMouseEnter(item, e) {
  clearTimeout(hoverTimer.value)
  const rect = e.currentTarget.getBoundingClientRect()
  hoverX.value = rect.left - 118
  hoverY.value = rect.top - 20
  hoverTimer.value = setTimeout(() => {
    hoverItem.value    = item
    hoverVisible.value = true
  }, 120)
}

function onItemMouseLeave() {
  clearTimeout(hoverTimer.value)
  hoverVisible.value = false
  hoverItem.value    = null
}

async function switchModelTab(tab) {
  modelTypeTab.value = tab
  vehicleSearch.value = ''
  vehicleOpen.value = false
  u('modelType', tab)
  if (tab === 'object') {
    await saModelsReady
  }
  u('modelId', MODEL_TYPE_DEFAULT_IDS[tab])
}

const props = defineProps({
  el:     { type: Object, required: true },
  selArr: { type: Array,  default: () => [] },
})
const emit = defineEmits(['update', 'update-multi', 'duplicate', 'delete'])

const isMulti = computed(() => props.selArr.length > 1)
function um(key, val) { emit('update-multi', { [key]: val }) }

const multiFont  = ref(null)
const multiAlign = ref(null)
const multiColor = ref(0xFFFFFFFF)
const multiBoxColor = ref(0x000000FF)
const multiBgColor = ref(0x000000FF)

const multiFlags = reactive({
  proportional: false,
  useBox: false,
  selectable: false,
  isPlayer: false,
})

watch(() => props.selArr, () => {
  multiFont.value = null
  multiAlign.value = null
  multiBgColor.value = 0x00000080
  Object.keys(multiFlags).forEach(k => multiFlags[k] = false)
})

watch(() => props.el?.id, () => {
  if (props.el?.type !== 'model') return
  if (props.el.modelColor1 === undefined) u('modelColor1', 0)
  if (props.el.modelColor2 === undefined) u('modelColor2', 0)
})

const alignOpen = ref(false)
const color1Open = ref(false)
const color2Open = ref(false)
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
    vehicleOpen.value = false
    vehicleSearch.value = ''
    color1Open.value = false
    color2Open.value = false
  }
}

const objectsReady = ref(false)

onMounted(async () => {
  window.addEventListener('mousedown', onClickOutside)
  if (props.el?.type === 'model') {
    modelTypeTab.value = props.el.modelType ?? 'vehicle'
  }
  await saModelsReady
  objectsReady.value = true
})
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

const filteredVehicles = computed(() => {
  const q = vehicleSearch.value.trim().toLowerCase()
  if (!q) return SA_VEHICLES
  return SA_VEHICLES.filter(v => v.name.toLowerCase().includes(q) || String(v.id).includes(q))
})

const filteredSkins = computed(() => {
  const q = vehicleSearch.value.trim().toLowerCase()
  if (!q) return SA_SKINS
  return SA_SKINS.filter(s => s.name.toLowerCase().includes(q) || String(s.id).includes(q))
})

const filteredObjects = computed(() => {
  void objectsReady.value
  const q = vehicleSearch.value.trim().toLowerCase()
  if (!q) return SA_OBJECTS
  return SA_OBJECTS.filter(o => o.model.toLowerCase().includes(q) || String(o.id).includes(q))
})

const OBJECT_PAGE_SIZE = 80
const objectPageCount  = ref(1)
const objectListEl     = ref(null)

const visibleObjects = computed(() => {
  const list = filteredObjects.value
  if (vehicleSearch.value.trim()) return list
  return list.slice(0, objectPageCount.value * OBJECT_PAGE_SIZE)
})

function onObjectListScroll(e) {
  const el = e.target
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
    const maxPages = Math.ceil(filteredObjects.value.length / OBJECT_PAGE_SIZE)
    if (objectPageCount.value < maxPages) objectPageCount.value++
  }
}

watch(vehicleOpen, (open) => {
  if (open) {
    objectPageCount.value = 1
  } else {
    clearTimeout(hoverTimer.value)
    hoverVisible.value = false
    hoverItem.value    = null
  }
})
watch(vehicleSearch, () => {
  objectPageCount.value = 1
})

watch(() => props.el?.id, () => {
  if (props.el?.type === 'model') {
    modelTypeTab.value = props.el.modelType ?? 'vehicle'
  }
})

function modelLabel(id)
{
  if (modelTypeTab.value === 'vehicle') return SA_VEHICLE_MAP[id] ?? 'Unknown'
  if (modelTypeTab.value === 'skin')    return SA_SKIN_MAP[id]    ?? 'Unknown'
  void objectsReady.value
  return SA_OBJECTS.find(o => o.id === id)?.model ?? 'Unknown'
}

const currentList = computed(() => {
  if (modelTypeTab.value === 'vehicle') return filteredVehicles.value
  if (modelTypeTab.value === 'skin')    return filteredSkins.value
  return visibleObjects.value
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
.font-arrow { font-size:9px; color:var(--text2); margin-left:6px; flex-shrink:0; }
.font-dropdown { position:absolute; top:100%; left:0; right:0; background:var(--bg2); border:1px solid var(--border2); border-radius:3px; z-index:999; box-shadow:2px 4px 12px rgba(0,0,0,0.6); }
.font-option { padding:4px 8px; font-size:13px; cursor:pointer; color:var(--text0); }
.font-option:hover { background:var(--accent-dim); color:var(--text0); }
.font-option.active { color:var(--accent); }

/* ── Vehicle picker ── */
.model-vehicle-select { gap: 4px; }
.vehicle-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }
.vehicle-id { font-size: 9px; color: var(--text2); font-weight: 700; flex-shrink: 0; }

.vehicle-dropdown {
  min-width: 100%;
  max-height: 220px;
  display: flex;
  flex-direction: column;
}

.vehicle-search-wrap {
  padding: 4px 6px;
  border-bottom: 1px solid var(--border2);
  flex-shrink: 0;
}

.vehicle-search {
  width: 100%;
  box-sizing: border-box;
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  padding: 2px 4px;
  background: var(--bg0);
  border: 1px solid var(--border2);
  border-radius: 2px;
  color: var(--text0);
  outline: none;
}
.vehicle-search:focus { border-color: var(--accent); }

.vehicle-list {
  overflow-y: auto;
  flex: 1;
}

.vehicle-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  padding: 3px 8px;
}

.vehicle-opt-id {
  font-size: 9px;
  color: var(--text2);
  font-weight: 700;
  flex-shrink: 0;
  margin-left: 6px;
}

/* ── Colour palette dropdown ── */
.colour-dropdown-trigger { gap: 4px; min-width: 0; }
.colour-preview {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  border: 1px solid var(--border2);
  flex-shrink: 0;
}
.colour-trigger-id {
  flex: 1;
  font-size: 10px;
  color: var(--text2);
  font-weight: 700;
}
.colour-palette-dropdown {
  padding: 6px;
  width: 160px;
  left: 0;
  right: auto;
}
.colour-palette-dropdown--right {
  left: auto !important;
  right: 0 !important;
}
.colour-palette-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  max-height: 140px;
  overflow-y: auto;
}
.colour-swatch {
  width: 12px;
  height: 12px;
  border-radius: 1px;
  cursor: pointer;
  border: 1px solid transparent;
  box-sizing: border-box;
  flex-shrink: 0;
}
.colour-id-input-row {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 4px 5px;
  border-bottom: 1px solid var(--border2);
  margin-bottom: 5px;
}
.colour-preview-sm {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  border: 1px solid var(--border2);
  flex-shrink: 0;
}
.colour-id-input {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  padding: 2px 4px;
  background: var(--bg0);
  border: 1px solid var(--border2);
  border-radius: 2px;
  color: var(--text0);
  outline: none;
}
.colour-id-input:focus { border-color: var(--accent); }
.colour-id-input::-webkit-inner-spin-button,
.colour-id-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.colour-id-input { -moz-appearance: textfield; }
.colour-swatch:hover {
  border-color: var(--text0);
  transform: scale(1.3);
  z-index: 1;
  position: relative;
}
.colour-swatch.active {
  border-color: var(--accent);
  transform: scale(1.4);
  z-index: 2;
  position: relative;
}

.object-load-hint {
  text-align: center;
  font-size: 10px;
  color: var(--text2);
  padding: 6px 0 4px;
  font-family: 'Tahoma', sans-serif;
  user-select: none;
}

.model-hover-preview {
  position: fixed;
  width: 110px;
  height: 90px;
  background: var(--bg1);
  border: 1px solid var(--border2);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 2px 4px 14px rgba(0,0,0,0.7);
  pointer-events: none;
  z-index: 9999;
}

.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.1s ease;
}
.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}
</style>
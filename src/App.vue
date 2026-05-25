<template>
  <div class="app" @mousemove="onMove" @mouseup="onUp">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="logo-block">
        <img class="logo-badge" :src="saoLogo" alt="SAO Logo" @click="openGithub">
        <span class="logo-text"><em>TextDraw Designer</em></span>
      </div>

      <div style="flex:1" />

      <span class="bar-label">BG</span>
      <input type="range" min="0" max="100" v-model.number="bgOpacity" class="slider" style="width:60px" />

      <div class="sep" />

      <span class="bar-label">Zoom</span>
      <input type="range" min="50" max="500" step="10"
        :value="Math.round((zoom-1)*100)"
        @input="zoom = +$event.target.value/100+1"
        class="slider" style="width:80px" />
      <span class="zoom-val">{{ Math.round((zoom-1)*100) }}%</span>

      <div class="sep" />

      <button class="btn" @click="store.undo()">Undo</button>
      <button class="btn" @click="store.redo()">Redo</button>
      <div class="sep" />
      <button class="btn" @click="onOpenJson">Import</button>
      <button class="btn primary" @click="onExport">Export Pawn</button>
    </div>


    <!-- BODY -->
    <div class="body">
      <LeftPanel
        :sorted="sorted"
        :selected="selected"
        :warnings="warnings"
        :bgImage="bgImage"
        :refs="refs"
        :selRef="selRef"
        @add-element="onAddElement"
        @add-preset="onAddPreset"
        @select="onLayerSelect"
        @multi-select="onLayerMultiSelect"
        @toggle-visible="el  => store.updEl(el.id, { visible: !el.visible })"
        @toggle-lock="el => store.updEl(el.id, { locked: !el.locked })"
        @contextmenu="onContextMenu"
        @insert-sprite="onInsertSprite"
        @notify="onNotify"
        @upload-bg="bgImg.upload"
        @remove-bg="bgImg.remove"
        @upload-refs="refImages.upload"
        @select-ref="onSelectRef"
        @toggle-ref-visible="r => refImages.update(r.id, { visible: !r.visible })"
        @toggle-ref-lock="r => refImages.update(r.id, { locked: !r.locked })"
        @delete-ref="onDeleteRef"
        @reorder="onReorder"
      />

      <div class="canvas-wrap" ref="canvasWrap">
        <DesignerCanvas
          ref="canvas"
          :sorted="sorted"
          :selected="selected"
          :refs="refs"
          :selRef="selRef"
          :marquee="marquee.marquee.value"
          :zoom="zoom"
          :showGrid="showGrid"
          :gridSize="gridSize"
          :bgImage="bgImg.bgImage.value"
          :bgOpacity="bgOpacity"
          :widescreen="widescreen"
          :snapLines="snapLines"
          @canvas-mousedown="onCanvasMD"
          @el-mousedown="onElMD"
          @el-resize-start="onElRS"
          @ref-mousedown="onRefMD"
          @ref-resize-start="onRefRS"
          @contextmenu="onContextMenu"
          @sprite-drop="onSpriteDrop"
        />
        <svg class="snap-lines" :viewBox="`0 0 ${CW} ${CH}`"
          :style="{ width: CW * zoom + 'px', height: CH * zoom + 'px' }">
        <template v-for="line in snapLines" :key="line.axis + line.value">
          <line v-if="line.axis === 'x'"
            :x1="line.value" y1="0" :x2="line.value" :y2="CH"
            stroke="#C80041" stroke-width="0.5" stroke-dasharray="3 2" />
          <line v-else
            x1="0" :y1="line.value" :x2="CW" :y2="line.value"
            stroke="#C80041" stroke-width="0.5" stroke-dasharray="3 2" />
        </template>
      </svg>
      </div>

      <RightPanel
        :selOne="selOne"
        :selArr="selArr"
        :selRefObj="selRefObj"
        @update-el="(id, patches) => onUpdateEl(id, patches)"
        @duplicate="store.duplicate"
        @delete="store.deleteSelected"
        @update-ref="(id, patches) => refImages.update(id, patches)"
        @delete-ref="onDeleteRef"
        @align="onAlign"
        @copy-style="onCopyStyle"
        @paste-style="onPasteStyle"
        @batch-rename="onBatchRename"
        @update-multi="onUpdateMulti"
      />
    </div>

    <ExportModal :show="showExport" :code="exportCode" :prefix="prefix" @close="showExport = false" />
    <JsonModal :show="showJson" :json="jsonText" @close="showJson = false" @load="onJsonLoad" @load-pawn="onImportLoad" />
    <ContextMenu
      v-if="ctxPos"
      :pos="ctxPos"
      :isCanvas="ctxIsCanvas"
      :showGrid="showGrid"
      :snapMode="snapMode"
      :gridSize="gridSize"
      :prefix="prefix"
      :isLocked="selOne?.locked ?? false"
      :isVisible="selOne?.visible ?? true"
      :widescreen="widescreen"
      @widescreen="widescreen = $event"
      @action="onCtxAction"
      @close="ctxPos = null"
      @grid="showGrid = $event"
      @snapMode="snapMode = $event"
      @gridSize="gridSize = $event"
      @update:prefix="prefix = $event"
    />
    <NotificationStack :notifs="notifs" />
  </div>
</template>

<script setup>
import saoLogo from './resources/sao-logo.png'
import { ref, computed, onMounted, onUnmounted } from 'vue'

import { CW, CH } from './constants/canvas'

import { useElementStore } from './composables/useElementStore'
import { useSnap } from './composables/useSnap'
import { useDrag } from './composables/useDrag'
import { useResize } from './composables/useResize'
import { useMarquee } from './composables/useMarquee'
import { useRefDrag } from './composables/useRefDrag'
import { useBgImage } from './composables/useBgImage'
import { useRefImages } from './composables/useRefImages'
import { useValidation } from './composables/useValidation'
import { useKeyboard } from './composables/useKeyboard'


import { exportPawn } from './utils/exportPawn'
import { importPawn } from './utils/importPawn'

import LeftPanel from './components/left-panel/LeftPanel.vue'
import RightPanel from './components/right-panel/RightPanel.vue'
import DesignerCanvas from './components/canvas/DesignerCanvas.vue'
import ExportModal from './components/modals/ExportModal.vue'
import JsonModal from './components/modals/JsonModal.vue'
import ContextMenu from './components/modals/ContextMenu.vue'
import NotificationStack from './components/modals/NotificationStack.vue'

const widescreen = ref(false);

const store      = useElementStore()
const snapUtil   = useSnap()
const bgImg      = useBgImage()
const refImages  = useRefImages()
const validation = useValidation(store.els)

const drag = useDrag(store.els, store.selected, snapUtil.snapV, CW, CH, snapUtil.snapMode, snapUtil.snapElement, snapUtil.clearSnapLines)
const resize = useResize(store.els, store.selected, snapUtil.snapV, snapUtil.snapResize, snapUtil.clearSnapLines)
const marquee = useMarquee(store.els, store.selected)
const refDrag = useRefDrag(refImages.refs, snapUtil.snapV)

const snapMode  = snapUtil.snapMode
const gridSize  = snapUtil.gridSize
const snapLines = snapUtil.snapLines

const prefix     = ref('td')
const zoom       = ref(2)
const showGrid   = ref(true)
const bgOpacity  = ref(100)
const mp         = ref({ x: 0, y: 0 })
const ctxPos     = ref(null)
const showExport = ref(false)
const showJson   = ref(false)
const exportCode = ref('')
const jsonText   = ref('')
const notifs     = ref([])
const copiedStyle = ref(null)
const canvas     = ref(null)
const canvasWrap = ref(null)

const selRefObj = computed(() =>
  refImages.selRef.value
    ? refImages.refs.value.find(r => r.id === refImages.selRef.value) ?? null
    : null
)

const selOne   = computed(() => store.selOne.value)
const sorted   = computed(() => store.sorted.value)
const selected = computed(() => store.selected.value)
const selArr   = computed(() => store.selArr.value)
const elCount  = computed(() => store.els.value.length)
const warnings = computed(() => validation.warnings.value)
const refs     = computed(() => refImages.refs.value)
const selRef   = computed(() => refImages.selRef.value)
const bgImage  = computed(() => bgImg.bgImage.value)

function openGithub() {
  window.open('https://github.com/San-Andreas-Online', '_blank')
}

function onNotify(msg, type = 'info') {
  const id = Math.random().toString(36).slice(2, 7)
  notifs.value.push({ id, msg, type })
  setTimeout(() => { notifs.value = notifs.value.filter(n => n.id !== id) }, 2200)
}

function cvPos(e) {
  if (!canvas.value) return { x: 0, y: 0 }
  return canvas.value.canvasPos(e)
}

function onCanvasMD(e, pos) {
  store.clearSelection()
  refImages.clearSelection()
  marquee.start(pos)
}

function onSpriteDrop(text, pos) {
  store.addEl('sprite', prefix.value, { text, x: pos.x, y: pos.y })
  onNotify(`Added ${text}`)
}

function onElMD(e, el) {
  refImages.clearSelection()
  if (!store.selected.value.has(el.id)) {
    if (e.shiftKey || e.ctrlKey) store.toggleSelect(el.id, true)
    else store.toggleSelect(el.id, false)
  }
  if (!el.locked) drag.start(cvPos(e), store.selArr.value.includes(el.id) ? store.selArr.value : [el.id])
}

function onElRS(e, el)
{
  if (!store.selected.value.has(el.id)) store.toggleSelect(el.id, false)
  refImages.clearSelection()
  resize.start(cvPos(e), el)
}

function onRefMD(e, r) {
  store.clearSelection()
  refImages.select(r.id)
  if (!r.locked) refDrag.dragStart(cvPos(e), r)
}

function onRefRS(e, r) {
  refImages.select(r.id)
  refDrag.resizeStart(cvPos(e), r)
}

function onMove(e) {
  const r = canvasWrap.value?.querySelector('[data-cw]')?.getBoundingClientRect?.()
  if (r) {
    mp.value = {
      x: Math.max(0, Math.round((e.clientX - r.left) / zoom.value)),
      y: Math.max(0, Math.round((e.clientY - r.top)  / zoom.value)),
    }
  }
  const pos = cvPos(e)
  drag.move(pos)
  resize.move(pos)
  marquee.move(pos)
  refDrag.move(pos)
}

function onUp(e) {
  const pos = cvPos(e)
  drag.stop(next => store.commitEls(next))
  resize.stop(next => store.commitEls(next))
  marquee.stop(pos)
  refDrag.stop()
}

const ctxIsCanvas = ref(false)

function onContextMenu(e, el)
{
  if (el) {
    if (!store.selected.value.has(el.id)) store.toggleSelect(el.id, false)
  }
  ctxIsCanvas.value = !el
  ctxPos.value = { x: e.clientX, y: e.clientY }
}

function onCtxAction(action) {
  ctxPos.value = null
  if (action === 'del')             store.deleteSelected()
  else if (action === 'dup')        store.duplicate()
  else if (action === 'front')      store.bringToFront()
  else if (action === 'back')       store.sendToBack()
  else if (action === 'copyStyle')  onCopyStyle()
  else if (action === 'pasteStyle') onPasteStyle()
  else if (action === 'toggleLock')    store.updEl(store.selOne.value.id, { locked: !store.selOne.value.locked })
  else if (action === 'toggleVisible') store.updEl(store.selOne.value.id, { visible: !store.selOne.value.visible })
}

function onAddElement(type) {
  store.addEl(type, prefix.value, {
    x: snapUtil.snapV(100),
    y: snapUtil.snapV(100),
  })
  refImages.clearSelection()
}

function onAddPreset(preset) {
  store.addEl(preset.type || preset.label.toLowerCase(), prefix.value, {
    ...preset.extra,
    name: `${prefix.value}_${preset.label.toLowerCase()}`,
  })
  refImages.clearSelection()
}

function onInsertSprite(s) {
  store.addEl('sprite', prefix.value, { text: `${s.lib}:${s.tex}` })
  onNotify(`Added ${s.lib}:${s.tex}`)
}

function onLayerSelect(el) {
  refImages.clearSelection()
  store.toggleSelect(el.id, false)
}

function onLayerMultiSelect(el) {
  refImages.clearSelection()
  store.toggleSelect(el.id, true)
}

function onSelectRef(id) {
  store.clearSelection()
  refImages.select(id)
}

function onDeleteRef(id) {
  refImages.remove(id)
}

function onUpdateEl(id, patches)
{
  const el = store.els.value.find(e => e.id === id)
  if (!el) return store.updEl(id, patches)

  const merged = { ...patches }
  const align = 'align' in patches ? patches.align : el.align
  const w = 'w' in patches ? patches.w : el.w
  const x = 'x' in patches ? patches.x : el.x

  if ('h' in patches) merged.letterY = parseFloat((patches.h * 0.135).toFixed(3))

  if ('w' in patches || 'align' in patches) {
    if (align === 1) {
      merged.textSizeX = 0
      merged.textSizeY = w * 1.08125
    } else if (align === 2) {
      merged.textSizeX = x
      merged.textSizeY = el.h
    } else {
      merged.textSizeX = x + w
      merged.textSizeY = el.h
    }
  }

  store.updEl(id, merged)
}

function onAlign(mode) {
  const sel = store.selArr.value
  if (!sel.length) return
  const s = store.els.value.filter(e => sel.includes(e.id))
  const minX = Math.min(...s.map(e => e.x)), maxX = Math.max(...s.map(e => e.x + e.w))
  const minY = Math.min(...s.map(e => e.y)), maxY = Math.max(...s.map(e => e.y + e.h))

  const next = store.els.value.map(el => {
    if (!sel.includes(el.id)) return el
    if (mode === 'left')    return { ...el, x: minX }
    if (mode === 'right')   return { ...el, x: maxX - el.w }
    if (mode === 'top')     return { ...el, y: minY }
    if (mode === 'bottom')  return { ...el, y: maxY - el.h }
    if (mode === 'centerH') return { ...el, x: Math.round((minX + maxX) / 2 - el.w / 2) }
    if (mode === 'centerV') return { ...el, y: Math.round((minY + maxY) / 2 - el.h / 2) }
    if (mode === 'distH' && s.length >= 3) {
      const sorted = [...s].sort((a, b) => a.x - b.x)
      const totalW = sorted.reduce((t, e) => t + e.w, 0)
      const gap = (sorted[sorted.length-1].x + sorted[sorted.length-1].w - sorted[0].x - totalW) / (sorted.length - 1)
      let cx = sorted[0].x + sorted[0].w
      for (let i = 1; i < sorted.length - 1; i++) {
        if (el.id === sorted[i].id) return { ...el, x: Math.round(cx) }
        cx += sorted[i].w + gap
      }
    }
    if (mode === 'distV' && s.length >= 3) {
      const sorted = [...s].sort((a, b) => a.y - b.y)
      const totalH = sorted.reduce((t, e) => t + e.h, 0)
      const gap = (sorted[sorted.length-1].y + sorted[sorted.length-1].h - sorted[0].y - totalH) / (sorted.length - 1)
      let cy = sorted[0].y + sorted[0].h
      for (let i = 1; i < sorted.length - 1; i++) {
        if (el.id === sorted[i].id) return { ...el, y: Math.round(cy) }
        cy += sorted[i].h + gap
      }
    }
    return el
  })
  store.commit(next)
}

function onCopyStyle() {
  const el = store.selOne.value
  if (el) copiedStyle.value = { color: el.color, boxColor: el.boxColor, font: el.font }
}

function onPasteStyle() {
  if (!copiedStyle.value) return
  const next = store.els.value.map(e =>
    store.selected.value.has(e.id) ? { ...e, ...copiedStyle.value } : e
  )
  store.commitEls(next)
}

function onBatchRename() {
  const p = window.prompt('Prefix for selected elements:', 'td_')
  if (!p) return
  store.batchRename(p)
}

function onExport() {
  exportCode.value = exportPawn(store.els.value, prefix.value)
  showExport.value = true
}

function onOpenJson() {
  jsonText.value = JSON.stringify(store.els.value, null, 2)
  showJson.value = true
}

function onJsonLoad(text) {
  try {
    const d = JSON.parse(text)
    store.commitEls(d)
    showJson.value = false
    onNotify('Loaded!', 'success')
  } catch {
    onNotify('Invalid JSON', 'error')
  }
}

function onImportLoad(text) {
  try {
    const els = importPawn(text)
    if (!els.length) return onNotify('No elements found', 'error')
    store.commitEls(els)
    showJson.value = false
    onNotify(`Imported ${els.length} elements`, 'success')
  } catch (e) {
    onNotify('Import failed: ' + e.message, 'error')
  }
}

function onReorder(dragId, targetId) {
  const els = store.els.value
  const dragEl   = els.find(e => e.id === dragId)
  const targetEl = els.find(e => e.id === targetId)
  if (!dragEl || !targetEl) return

  const dragLayer   = dragEl.layer
  const targetLayer = targetEl.layer
  const min = Math.min(dragLayer, targetLayer)
  const max = Math.max(dragLayer, targetLayer)
  const direction = dragLayer > targetLayer ? 1 : -1

  const next = els.map(e => {
    if (e.id === dragId) return { ...e, layer: targetLayer }
    if (e.layer >= min && e.layer <= max) return { ...e, layer: e.layer + direction }
    return e
  })
  store.commitEls(next)
}

function onUpdateMulti(patches)
{
  const next = store.els.value.map(el =>
    store.selected.value.has(el.id) ? { ...el, ...patches } : el
  )
  store.commitEls(next)
}

useKeyboard({
  undo: () => store.undo(),
  redo: () => store.redo(),
  duplicate: () => store.duplicate(),
  selectAll: () => store.selectAll(),
  deleteSelected: () => store.deleteSelected(),
  clearSelection: () => { store.clearSelection(); refImages.clearSelection() },
  deleteRef: (id) => refImages.remove(id),
  nudgeEls: (dx, dy) => {
    const next = store.els.value.map(el => {
      if (!store.selected.value.has(el.id)) return el
      return {
        ...el,
        x: Math.max(0, Math.min(CW - el.w, el.x + dx)),
        y: Math.max(0, Math.min(CH - el.h, el.y + dy)),
      }
    })
    store.commitEls(next)  // was store.commit
  },
  nudgeRef: (id, dx, dy) => refImages.update(id, {
    x: (selRefObj.value?.x ?? 0) + dx,
    y: (selRefObj.value?.y ?? 0) + dy,
  }),
  selRef: refImages.selRef,
  zoomBy: (delta) => {
    zoom.value = Math.min(6, Math.max(1, zoom.value + delta / 100))
  }
})

</script>

<style>
/* ── Global reset & scrollbars ── */
* { box-sizing: border-box; margin: 0; padding: 0; }
body { overflow: hidden; }

:root {
  --bg0: #0a0a0a;
  --bg1: #111111;
  --bg2: #161616;
  --bg3: #1e1e1e;
  --border: #252525;
  --border2: #2e2e2e;
  --accent: #C80041;
  --accent-dim: rgba(176, 48, 96, 0.15);
  --text0: #e0e0e0;
  --text1: #909090;
  --text2: #505050;
  --green: #3aaa6a;
  --red: #cc4444;
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg1); }
::-webkit-scrollbar-thumb { background: var(--bg3); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent); }
</style>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  background: var(--bg0);
  color: var(--text0);
  user-select: none;
}

/* ── TOPBAR ── */
.topbar {
  height: 42px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  background: var(--bg1);
  border-bottom: 1px solid var(--border2);
  flex-shrink: 0;
}

.logo-block {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-right: 4px;
}
.logo-badge {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
.logo-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--text0);
  letter-spacing: 0.3px;
}
.logo-text em {
  font-style: normal;
  color: var(--accent);
}

.sep {
  width: 1px;
  height: 20px;
  background: var(--border2);
  margin: 0 4px;
  flex-shrink: 0;
}

.bar-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text2);
  white-space: nowrap;
}

.bar-input {
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  padding: 3px 6px;
  background: var(--bg0);
  border: 1px solid var(--border2);
  border-radius: 3px;
  color: var(--text0);
  outline: none;
}
.bar-input:focus {
  border-color: var(--accent);
}

.btn {
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 10px;
  cursor: pointer;
  color: var(--text1);
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 3px;
  outline: none;
  white-space: nowrap;
  user-select: none;
  letter-spacing: 0.2px;
  transition: border-color 0.1s, color 0.1s, background 0.1s;
}
.btn:hover {
  border-color: var(--accent);
  color: var(--text0);
  background: var(--bg2);
}
.btn:active {
  background: var(--bg0);
  border-color: #C80041;
}
.btn.primary {
  background: var(--accent);
  color: #fff;
  border-color: #c84070;
  font-weight: 700;
}
.btn.primary:hover {
  background: #C80041;
  border-color: #d85080;
}
.btn.primary:active {
  background: #C80041;
}
.btn.sm {
  padding: 3px 7px;
  font-size: 9px;
}

/* ── SECONDBAR ── */
.secondbar {
  height: 28px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  background: var(--bg1);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.sep-v {
  width: 1px;
  height: 14px;
  background: var(--border2);
  flex-shrink: 0;
}

.cb-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text1);
  cursor: pointer;
}
.cb-row input[type="checkbox"] {
  accent-color: var(--accent);
  cursor: pointer;
}

.slider {
  accent-color: var(--accent);
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--bg3);
  outline: none;
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

.zoom-val {
  color: var(--accent);
  font-weight: 700;
  font-size: 10px;
  min-width: 32px;
}

.coord-display, .count-display {
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 3px;
}
.coord-axis {
  color: var(--text2);
}
.coord-val {
  color: var(--text0);
  font-weight: 700;
}
.coord-val.accent {
  color: var(--accent);
}

/* ── BODY ── */
.body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.canvas-wrap {
  flex: 1;
  background: #1a1a1a;
  overflow: auto;
}
</style>
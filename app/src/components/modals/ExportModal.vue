<template>
  <div v-if="show" class="modal-overlay" @mousedown.self="emit('close')">
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">Export</span>
        <div class="header-actions">
          <label class="toggle-label" @mousedown.stop>
            <span>open.mp</span>
            <button
              class="toggle-btn"
              :class="{ active: openMp }"
              @click.stop="openMp = !openMp"
            >
              <span class="toggle-thumb" />
            </button>
          </label>
          <button class="btn" @click.stop="copyCode">Copy</button>
          <button class="btn icon-btn" @click.stop="emit('close')">✕</button>
        </div>
      </div>
      <pre class="code-area" v-html="highlighted" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  show:   { type: Boolean, default: false },
  code:   { type: String,  default: '' },
  prefix: { type: String,  default: 'td' },
})

const emit = defineEmits(['close'])
const openMp = ref(false)

const displayCode = computed(() => {
  if (!props.code || !openMp.value) return props.code

  return props.code
    .replace(/\bTextDrawColor\b/g,           'TextDrawColour')
    .replace(/\bTextDrawBackgroundColor\b/g,  'TextDrawBackgroundColour')
    .replace(/\bTextDrawBoxColor\b/g,         'TextDrawBoxColour')
    .replace(/\bPlayerTextDrawColor\b/g,      'PlayerTextDrawColour')
    .replace(/\bPlayerTextDrawBackgroundColor\b/g, 'PlayerTextDrawBackgroundColour')
    .replace(/\bPlayerTextDrawBoxColor\b/g,   'PlayerTextDrawBoxColour')
    .replace(/\bTextDrawFont\(([^,]+),\s*(\d)\)/g,      (_, r, f) => `TextDrawFont(${r}, ${fontConst(+f)})`)
    .replace(/\bPlayerTextDrawFont\(playerid,\s*([^,]+),\s*(\d)\)/g, (_, r, f) => `PlayerTextDrawFont(playerid, ${r}, ${fontConst(+f)})`)
    .replace(/\bTextDrawAlignment\(([^,]+),\s*(\d)\)/g,      (_, r, a) => `TextDrawAlignment(${r}, ${alignConst(+a)})`)
    .replace(/\bPlayerTextDrawAlignment\(playerid,\s*([^,]+),\s*(\d)\)/g, (_, r, a) => `PlayerTextDrawAlignment(playerid, ${r}, ${alignConst(+a)})`)
    .replace(/\bTextDrawSetProportional\(([^,]+),\s*1\)/g,      (_, r) => `TextDrawSetProportional(${r}, true)`)
    .replace(/\bPlayerTextDrawSetProportional\(playerid,\s*([^,]+),\s*1\)/g, (_, r) => `PlayerTextDrawSetProportional(playerid, ${r}, true)`)
    .replace(/\bTextDrawSetSelectable\(([^,]+),\s*1\)/g,        (_, r) => `TextDrawSetSelectable(${r}, true)`)
    .replace(/\bPlayerTextDrawSetSelectable\(playerid,\s*([^,]+),\s*1\)/g, (_, r) => `PlayerTextDrawSetSelectable(playerid, ${r}, true)`)
    .replace(/\bTextDrawUseBox\(([^,]+),\s*1\)/g,               (_, r) => `TextDrawUseBox(${r}, true)`)
    .replace(/\bPlayerTextDrawUseBox\(playerid,\s*([^,]+),\s*1\)/g, (_, r) => `PlayerTextDrawUseBox(playerid, ${r}, true)`)
    .replace(/^(\/\/ TextDraw Designer )sa-mp( | )/m, '$1open.mp$2')
})

const FONT_CONSTS  = ['TEXT_DRAW_FONT_0', 'TEXT_DRAW_FONT_1', 'TEXT_DRAW_FONT_2', 'TEXT_DRAW_FONT_3', 'TEXT_DRAW_FONT_SPRITE_DRAW', 'TEXT_DRAW_FONT_MODEL_PREVIEW']
const ALIGN_CONSTS = ['TEXT_DRAW_ALIGN_LEFT', 'TEXT_DRAW_ALIGN_CENTER', 'TEXT_DRAW_ALIGN_RIGHT']
const fontConst  = (n) => FONT_CONSTS[n]  ?? n
const alignConst = (n) => ALIGN_CONSTS[n - 1] ?? n

const highlighted = computed(() => {
  if (!displayCode.value) return ''
  return displayCode.value.split('\n').map(line => {
    let s = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    if (s.trimStart().startsWith('//')) {
      return `<span class="c-comment">${s}</span>`
    }
    return s
  }).join('\n')
})

function copyCode() {
  const lines = displayCode.value.split('\n')
  const start = lines.findIndex(l => l.startsWith('new '))
  navigator.clipboard.writeText(lines.slice(start).join('\n'))
}

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.modal-box {
  width: 700px;
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  background: var(--bg1);
  border: 1px solid var(--border2);
  border-radius: 4px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.7);
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  height: 38px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border2);
  flex-shrink: 0;
}
.modal-title {
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  user-select: none;
  cursor: pointer;
}
.toggle-btn {
  position: relative;
  width: 30px;
  height: 16px;
  border-radius: 8px;
  border: 1px solid var(--border2);
  background: var(--bg0);
  cursor: pointer;
  padding: 0;
  outline: none;
  transition: background 0.15s, border-color 0.15s;
}
.toggle-btn.active {
  background: var(--accent);
  border-color: var(--accent);
}
.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--text2);
  transition: transform 0.15s, background 0.15s;
}
.toggle-btn.active .toggle-thumb {
  transform: translateX(14px);
  background: #fff;
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
.icon-btn {
  padding: 4px 8px;
  color: var(--text2);
}
.icon-btn:hover {
  color: var(--red);
  border-color: var(--red);
}
.code-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  background: var(--bg0);
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text0);
  min-height: 400px;
  width: 100%;
  box-sizing: border-box;
  border: none;
  outline: none;
  resize: none;
  user-select: text !important;
  -webkit-user-select: text !important;
}
.code-area::selection {
  background: var(--accent-dim);
}
</style>
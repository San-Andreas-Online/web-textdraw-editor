<template>
  <div v-if="show" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-box">

      <div class="modal-titlebar">
        <div class="modal-title">
          <span class="modal-icon">{ }</span>
          Import Pawn
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="modal-toolbar">
        <button class="xp-btn primary" @click="onLoad">⬆ Import into editor</button>
        <div style="flex:1" />
        <button class="xp-btn" @click="emit('close')">Close</button>
      </div>

      <div class="hint-bar">
        Paste Pawn TextDraw code here to import. Works with both Global and PlayerTextDraw.
      </div>

      <textarea
        class="code-area"
        :value="localText"
        @input="localText = $event.target.value"
        spellcheck="false"
        placeholder="Paste Pawn code here..."
      />

    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'load'])

const localText = ref('')

watch(() => props.show, (val) => {
  if (val) localText.value = ''
})

function onLoad() {
  emit('load', localText.value)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  width: 600px;
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  background: #ece9d8;
  border-top: 2px solid #fff;
  border-left: 2px solid #fff;
  border-right: 2px solid #848484;
  border-bottom: 2px solid #848484;
  box-shadow: 2px 2px 12px rgba(0, 0, 0, 0.5);
}
.modal-titlebar {
  display: flex;
  align-items: center;
  padding: 4px 6px 4px 8px;
  background: linear-gradient(to bottom, #1a4890, #0a2060);
  flex-shrink: 0;
}
.modal-title {
  flex: 1;
  font-family: 'Tahoma', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
}
.modal-icon {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #9db8e8;
}
.close-btn {
  width: 21px;
  height: 21px;
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #000;
  cursor: pointer;
  background: linear-gradient(to bottom, #f5f5f5, #dfdfdf);
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-right: 1px solid #848484;
  border-bottom: 1px solid #848484;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.close-btn:hover { background: linear-gradient(to bottom, #ff6060, #cc2020); color: #fff; }
.modal-toolbar {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 8px;
  background: #d4d0c8;
  border-bottom: 1px solid #a0a0a0;
  flex-shrink: 0;
}
.hint-bar {
  padding: 4px 10px;
  font-family: 'Tahoma', sans-serif;
  font-size: 10px;
  color: #555;
  background: #ece9d8;
  border-bottom: 1px solid #c0bdb4;
  flex-shrink: 0;
}
.code-area {
  flex: 1;
  min-height: 360px;
  padding: 12px 14px;
  background: #0a0e14;
  color: #89b4fa;
  font-family: 'Courier New', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1.6;
  border: none;
  outline: none;
  resize: none;
  overflow: auto;
  border-top: 2px inset #808080;
}
.xp-btn {
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  padding: 3px 10px;
  cursor: pointer;
  color: #000;
  background: linear-gradient(to bottom, #f5f5f5, #dfdfdf);
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-right: 1px solid #848484;
  border-bottom: 1px solid #848484;
  outline: none;
  white-space: nowrap;
  user-select: none;
}
.xp-btn:hover { background: linear-gradient(to bottom, #fff, #e8e8e8); }
.xp-btn:active {
  border-top: 1px solid #848484;
  border-left: 1px solid #848484;
  border-right: 1px solid #fff;
  border-bottom: 1px solid #fff;
}
.xp-btn.primary {
  background: linear-gradient(to bottom, #4a90d9, #1e5fb5);
  color: #fff;
  border-top: 1px solid #7ab4f0;
  border-left: 1px solid #7ab4f0;
  border-right: 1px solid #0a246a;
  border-bottom: 1px solid #0a246a;
}
.xp-btn.primary:hover { background: linear-gradient(to bottom, #5aa0e9, #2e6fc5); }
</style>
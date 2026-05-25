<template>
  <div class="add-tab">
    <div class="section-title">Elements</div>

    <div class="element-grid">
      <button
        v-for="type in elementTypes"
        :key="type"
        class="xp-btn type-btn"
        @click="emit('add-element', type)"
      >
        {{ type }}
      </button>
    </div>
    <div class="shortcut-box">
      <div class="shortcut-list">

      <div class="shortcut-row">
        <div class="shortcut-keys"><kbd>Ctrl</kbd><span>+</span><kbd>Z</kbd><span></span></div>
        <div class="shortcut-desc">Undo</div>
      </div>
      <div class="shortcut-row">
        <div class="shortcut-keys"><kbd>Ctrl</kbd><span>+</span><kbd>Y</kbd></div>
        <div class="shortcut-desc">Redo</div>
      </div>
      <div class="shortcut-row">
        <div class="shortcut-keys"><kbd>Ctrl</kbd><span>+</span><kbd>D</kbd></div>
        <div class="shortcut-desc">Duplicate</div>
      </div>
      <div class="shortcut-row">
        <div class="shortcut-keys"><kbd>Ctrl</kbd><span>+</span><kbd>A</kbd></div>
        <div class="shortcut-desc">Select All</div>
      </div>
      <div class="shortcut-row">
        <div class="shortcut-keys"><kbd>Ctrl</kbd><span>+</span><kbd>Scroll</kbd></div>
        <div class="shortcut-desc">Zoom</div>
      </div>
      <div class="shortcut-row">
        <div class="shortcut-keys"><kbd>Del</kbd></div>
        <div class="shortcut-desc">Delete</div>
      </div>
      <div class="shortcut-divider"></div>

      <div class="shortcut-row">
        <div class="shortcut-keys"><kbd>Drag</kbd></div>
        <div class="shortcut-desc">Multi Select</div>
      </div>
      <div class="shortcut-row">
        <div class="shortcut-keys"><kbd>RMB</kbd></div>
        <div class="shortcut-desc">Context Menu</div>
      </div>

    </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['add-element', 'add-preset'])

const elementTypes = ['label', 'box', 'sprite']

</script>

<style scoped>
.add-tab {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  display: flex;
  flex-direction: column;
  background: var(--bg1);
  box-sizing: border-box;
}

.section-title {
  font-family: Tahoma, sans-serif;
  font-size: 9px;
  font-weight: 700;
  color: var(--text2);
  border-bottom: 1px solid var(--border2);
  padding-bottom: 3px;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.smart-section {
  margin-top: 10px;
}

.element-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px;
  margin-bottom: 4px;
}

.type-btn {
  text-align: center;
  text-transform: capitalize;
  font-size: 11px;
  padding: 5px 2px;
}

.smart-btn {
  width: 100%;
  text-align: left;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  font-size: 11px;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

/* ── Shortcut box ── */
.shortcut-box {
  margin-top: 14px;
  padding: 10px;
  background: var(--bg0);
  border: 1px solid var(--border2);
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shortcut-divider {
  height: 1px;
  background: var(--border2);
  margin: 6px 0;
}

.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 22px;
}

.shortcut-desc {
  flex: 1;
  min-width: 0;
  text-align: right;
  word-break: break-word;
  font-family: Tahoma, sans-serif;
  font-size: 10px;
  color: var(--text1);
  line-height: 1.2;
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.shortcut-keys span {
  font-size: 10px;
  color: var(--text2);
  line-height: 1;
}

kbd {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 2px;
  border: 1px solid var(--border2);
  background: var(--bg3);
  color: var(--text0);
  font-size: 10px;
  font-family: Tahoma, sans-serif;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 0 rgba(0,0,0,0.4);
}

/* ── Buttons ── */
.xp-btn {
  font-family: Tahoma, sans-serif;
  font-size: 11px;
  padding: 4px 8px;
  cursor: pointer;
  color: var(--text1);
  background: var(--bg3);
  border: 1px solid var(--border2);
  outline: none;
  user-select: none;
  transition: border-color 0.1s, color 0.1s, background 0.1s;
}

.xp-btn:hover {
  background: var(--bg2);
  border-color: var(--accent);
  color: var(--text0);
}

.xp-btn:active {
  background: var(--bg0);
  border-color: #C80041;
}

.add-tab * {
  box-sizing: border-box;
  max-width: 100%;
}

.smart-btn,
.type-btn,
.xp-btn {
  width: 100%;
  min-width: 0;
}
</style>
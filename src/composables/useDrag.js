import { ref } from 'vue'

export function useDrag(els, selected, snapV, CW, CH) {
  const dragging = ref(false)
  const dragStart = ref({ x: 0, y: 0 })
  const dragOrigins = ref({})

  function start(pos, selArr) {
    dragging.value = true
    dragStart.value = { ...pos }
    dragOrigins.value = {}

    // Only record origins for unlocked elements in the selection.
    // If the drag was started from an unlocked element, locked elements
    // that are also selected will still move with the group.
    const hasUnlocked = selArr.some(id => {
      const el = els.value.find(e => e.id === id)
      return el && !el.locked
    })

    if (!hasUnlocked) return

    selArr.forEach(id => {
      const el = els.value.find(e => e.id === id)
      // Never move locked elements, even in a group drag
      if (el && !el.locked) dragOrigins.value[id] = { x: el.x, y: el.y }
    })
  }

  function move(pos) {
    if (!dragging.value) return
    const dx = pos.x - dragStart.value.x
    const dy = pos.y - dragStart.value.y
    els.value = els.value.map(el => {
      const origin = dragOrigins.value[el.id]
      if (!origin) return el
      return {
        ...el,
        x: snapV(origin.x + dx),
        y: snapV(origin.y + dy),
      }
    })
  }

  function stop(commit) {
    if (!dragging.value) return
    dragging.value = false
    commit(els.value)
  }

  return { dragging, start, move, stop }
}
import { ref } from 'vue'

export function useRefDrag(refs, snapV) {
  const dragging = ref(false)
  const dragId = ref(null)
  const dragStart = ref({ x: 0, y: 0 })
  const dragOrigin = ref({ x: 0, y: 0 })

  const resizing = ref(false)
  const resizeId = ref(null)
  const resizeOrig = ref({})

  function dragStart_(pos, r) {
    dragging.value = true
    dragId.value = r.id
    dragStart.value = { ...pos }
    const orig = refs.value.find(x => x.id === r.id)
    dragOrigin.value = { x: orig.x, y: orig.y }
  }

  function resizeStart(pos, r) {
    resizing.value = true
    resizeId.value = r.id
    const orig = refs.value.find(x => x.id === r.id)
    resizeOrig.value = { x: pos.x, y: pos.y, w: orig.w, h: orig.h }
  }

  function move(pos) {
    if (dragging.value && !resizing.value && dragId.value) {
      const dx = pos.x - dragStart.value.x
      const dy = pos.y - dragStart.value.y
      refs.value = refs.value.map(r => r.id !== dragId.value ? r : {
        ...r,
        x: snapV(dragOrigin.value.x + dx),
        y: snapV(dragOrigin.value.y + dy),
      })
    }

    if (resizing.value && resizeId.value) {
      const o = resizeOrig.value
      refs.value = refs.value.map(r => r.id !== resizeId.value ? r : {
        ...r,
        w: Math.max(20, snapV(o.w + (pos.x - o.x))),
        h: Math.max(20, snapV(o.h + (pos.y - o.y))),
      })
    }
  }

  function stop() {
    dragging.value = false
    dragId.value = null
    resizing.value = false
    resizeId.value = null
  }

  return { dragStart: dragStart_, resizeStart, move, stop }
}

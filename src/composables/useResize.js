import { ref } from 'vue'

export function useResize(els, selected, snapV, snapResize, clearSnapLines)
{
  const resizing = ref(false)
  const resizeId = ref(null)
  const resizeOrig = ref({})

  function start(pos, el)
  {
    resizing.value = true
    resizeId.value = el.id
    resizeOrig.value = { x: pos.x, y: pos.y, w: el.w, h: el.h }
  }

  function move(pos)
  {
    if (!resizing.value || !resizeId.value) return
    const o = resizeOrig.value

    const rawW = o.w + (pos.x - o.x)
    const rawH = o.h + (pos.y - o.y)

    const primary = els.value.find(e => e.id === resizeId.value)
    if (!primary) return

    const { w, h } = snapResize({ ...primary, w: rawW, h: rawH }, els.value)
    const dw = w - primary.w
    const dh = h - primary.h

    els.value = els.value.map(el => {
      if (!selected.value.has(el.id)) return el
      const newH = el.h + dh
      const newW = el.w + dw
      return {
        ...el,
        w: newW, h: newH,
        letterY: parseFloat((Math.abs(newH) / 9.5).toFixed(3)),
        textSizeX: el.align === 1 ? 0 : el.align === 2 ? el.x : el.x + newW,
        textSizeY: el.align === 1 ? newW * 1.08125 : el.h + dh,
      }
    })
  }

  function stop(commit)
  {
    if (!resizing.value) return
    resizing.value = false
    resizeId.value = null
    clearSnapLines()
    commit(els.value)
  }

  return { resizing, resizeId, start, move, stop }
}
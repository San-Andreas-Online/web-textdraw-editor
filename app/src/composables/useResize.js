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
    const ratios = new Map()
    els.value.forEach(e => {
      if (selected.value.has(e.id)) {
        ratios.set(e.id, e.letterY > 0 ? e.letterX / e.letterY : 0.26)
      }
    })
    resizeOrig.value = { x: pos.x, y: pos.y, w: el.w, h: el.h, ratios }
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
      const newLetterY = parseFloat((Math.abs(newH) / 9.5).toFixed(3))
      const ratio = o.ratios.get(el.id) ?? 0.26
      return {
        ...el,
        w: newW, h: newH,
        letterY: newLetterY,
        letterX: parseFloat((newLetterY * ratio).toFixed(4)),
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
    const r = (v) => Math.round(v * 10) / 10
    commit(els.value.map(el => {
      if (!selected.value.has(el.id)) return el
      return { ...el, w: r(el.w), h: r(el.h) }
    }))
  }

  return { resizing, resizeId, start, move, stop }
}
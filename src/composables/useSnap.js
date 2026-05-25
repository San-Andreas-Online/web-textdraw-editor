import { ref } from 'vue'

const SNAP_THRESHOLD = 6
const BOX_OFFSET_X = 4
const BOX_OFFSET_Y = 4
const BOX_OFFSET_W = 2.1
const BOX_OFFSET_H = 12

const LABEL_BOX_OFFSET_X = [-1, -1, -1, -1, 0]
const LABEL_BOX_OFFSET_Y = [-5, -5, -3, -4, 0]
const LABEL_BOX_OFFSET_W = [-2, -2, -2, -2, 0]
const LABEL_BOX_OFFSET_H = [5, 5, 3.6, 5, 0]

function visualBounds(el) {
  const isBox = el.type === 'box'
  const isLabel = el.type === 'label'
  const font = el.font ?? 0
  const x = el.w < 0 ? el.x + el.w : el.x
  const y = el.h < 0 ? el.y + el.h : el.y
  const w = Math.abs(el.w)
  const h = Math.abs(el.h)

  if (isBox) {
    return {
      x: x - BOX_OFFSET_X,
      y: y - BOX_OFFSET_Y,
      w: w + BOX_OFFSET_W,
      h: h + BOX_OFFSET_H,
    }
  }

  if (isLabel) {
    return {
      x: x + (LABEL_BOX_OFFSET_X[font] ?? 0),
      y: y + (LABEL_BOX_OFFSET_Y[font] ?? 0),
      w: w + (LABEL_BOX_OFFSET_W[font] ?? 0),
      h: h + (LABEL_BOX_OFFSET_H[font] ?? 0),
    }
  }

  return { x, y, w, h }
}

function findBestSnap(pairs)
{
  let best = null, bestD = SNAP_THRESHOLD + 1
  for (const { my, their, value } of pairs) {
    const d = Math.abs(my - their)
    if (d < bestD) {
      bestD = d
      best = { snap: value, line: their }
    }
  }
  return best
}

export function useSnap() {
  const snapMode = ref('grid')
  const gridSize = ref(5)
  const snapLines = ref([])

  function snapV(value) {
    if (snapMode.value === 'grid') {
      return Math.round(value / gridSize.value) * gridSize.value
    }
    return Math.round(value)
  }

  function snapElement(el, allEls, draggingIds)
  {
    if (snapMode.value !== 'element') {
      snapLines.value = []
      return { x: Math.round(el.x), y: Math.round(el.y) }
    }

    const others = allEls.filter(e => !draggingIds.includes(e.id))
    const vel = visualBounds(el)
    const lines = []
    let bestX = null, bestY = null

    for (const other of others) {
      const vo = visualBounds(other)

      const x = findBestSnap([
        { my: vel.x,           their: vo.x + vo.w, value: el.x + (vo.x + vo.w - vel.x) },
        { my: vel.x + vel.w,   their: vo.x,        value: el.x + (vo.x - vel.x - vel.w) },
        { my: vel.x,           their: vo.x,        value: el.x + (vo.x - vel.x) },
        { my: vel.x + vel.w,   their: vo.x + vo.w, value: el.x + (vo.x + vo.w - vel.x - vel.w) },
        { my: vel.x + vel.w/2, their: vo.x + vo.w/2, value: el.x + (vo.x + vo.w/2 - vel.x - vel.w/2) },
      ])
      if (x && (!bestX || Math.abs(x.line - (vel.x + vel.w/2)) < Math.abs(bestX.line - (vel.x + vel.w/2))))
        bestX = x

      const y = findBestSnap([
        { my: vel.y + vel.h,   their: vo.y,          value: el.y + (vo.y - vel.y - vel.h) },
        { my: vel.y,           their: vo.y + vo.h,   value: el.y + (vo.y + vo.h - vel.y) },
        { my: vel.y,           their: vo.y,           value: el.y + (vo.y - vel.y) },
        { my: vel.y + vel.h,   their: vo.y + vo.h,   value: el.y + (vo.y + vo.h - vel.y - vel.h) },
        { my: vel.y + vel.h/2, their: vo.y + vo.h/2, value: el.y + (vo.y + vo.h/2 - vel.y - vel.h/2) },
      ])
      if (y && (!bestY || Math.abs(y.line - (vel.y + vel.h/2)) < Math.abs(bestY.line - (vel.y + vel.h/2))))
        bestY = y
    }

    if (bestX) lines.push({ axis: 'x', value: bestX.line })
    if (bestY) lines.push({ axis: 'y', value: bestY.line })
    snapLines.value = lines

    return {
      x: Math.round(bestX ? bestX.snap : el.x),
      y: Math.round(bestY ? bestY.snap : el.y),
    }
  }

  function snapResize(el, allEls)
  {
    if (snapMode.value !== 'element') {
      snapLines.value = []
      return { w: snapV(el.w), h: snapV(el.h) }
    }

    const others = allEls.filter(e => e.id !== el.id)
    const vel = visualBounds(el)
    const lines = []
    let bestW = null, bestH = null

    for (const other of others) {
      const vo = visualBounds(other)

      const myEdgeX = el.w >= 0 ? vel.x + vel.w : vel.x
      const myEdgeY = el.h >= 0 ? vel.y + vel.h : vel.y

      const w = findBestSnap([
        { my: myEdgeX, their: vo.x,        value: el.w + (vo.x - myEdgeX) },
        { my: myEdgeX, their: vo.x + vo.w, value: el.w + (vo.x + vo.w - myEdgeX) },
      ])
      if (w && (!bestW || Math.abs(w.line - myEdgeX) < Math.abs(bestW.line - myEdgeX)))
        bestW = w

      const h = findBestSnap([
        { my: myEdgeY, their: vo.y,        value: el.h + (vo.y - myEdgeY) },
        { my: myEdgeY, their: vo.y + vo.h, value: el.h + (vo.y + vo.h - myEdgeY) },
      ])
      if (h && (!bestH || Math.abs(h.line - myEdgeY) < Math.abs(bestH.line - myEdgeY)))
        bestH = h
    }

    if (bestW) lines.push({ axis: 'x', value: bestW.line })
    if (bestH) lines.push({ axis: 'y', value: bestH.line })
    snapLines.value = lines

    return {
      w: bestW ? Math.round(bestW.snap) : snapV(el.w),
      h: bestH ? Math.round(bestH.snap) : snapV(el.h),
    }
  }

  function clearSnapLines() {
    snapLines.value = []
  }

  return { snapMode, gridSize, snapV, snapElement, snapResize, snapLines, clearSnapLines }
}
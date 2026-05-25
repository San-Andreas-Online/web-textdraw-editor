import { onMounted, onUnmounted } from 'vue'

export function useKeyboard({ undo, redo, duplicate, selectAll, deleteSelected, clearSelection, deleteRef, nudgeEls, nudgeRef, selRef, zoomBy })
{
  function onKeyDown(e)
  {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    const ctrl = e.ctrlKey || e.metaKey

    if (ctrl && e.key === 'z') { e.preventDefault(); undo() }
    if (ctrl && e.key === 'y') { e.preventDefault(); redo() }
    if (ctrl && e.key === 'd') { e.preventDefault(); duplicate() }
    if (ctrl && e.key === 'a') { e.preventDefault(); selectAll() }

    if (e.key === 'Escape') clearSelection()

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selRef.value) deleteRef(selRef.value)
      else deleteSelected()
    }

    const step = e.shiftKey ? 10 : 1
    const arrows = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
    if (arrows.includes(e.key)) {
      e.preventDefault()
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
      const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0
      if (selRef.value) nudgeRef(selRef.value, dx, dy)
      else nudgeEls(dx, dy)
    }
  }

  function onWheel(e)
  {
    if (!e.ctrlKey) return
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? 25 : -25)
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('wheel', onWheel, { passive: false })
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('wheel', onWheel)
  })
}
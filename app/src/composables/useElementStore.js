import { ref, computed } from 'vue'
import { makeElement } from '../utils/makeElement'
import { useHistory } from './useHistory'

export function useElementStore() {
  const els = ref([])
  const selected = ref(new Set())
  const { push, undo: histUndo, redo: histRedo, canUndo, canRedo } = useHistory()

  const sorted = computed(() => [...els.value].sort((a, b) => (a.layer || 0) - (b.layer || 0)))
  const selArr = computed(() => [...selected.value])
  const selOne = computed(() => selArr.value.length === 1 ? els.value.find(e => e.id === selArr.value[0]) : null)

  function commit(next) {
    els.value = next
    push(next)
  }

  function addEl(type, prefix, extra = {}) {
    const el = { ...makeElement(type), ...extra }
    const count = els.value.filter(e => e.type === type).length + 1
    el.name = `${prefix}_${type}${count}`
    el.layer = els.value.length
    const next = [...els.value, el]
    commit(next)
    selected.value = new Set([el.id])
  }

  function deleteSelected() {
    if (!selected.value.size) return
    commit(els.value.filter(e => !selected.value.has(e.id)))
    selected.value = new Set()
  }

  function duplicate()
  {
    if (!selected.value.size) return
    const copies = selArr.value
      .map(id => els.value.find(e => e.id === id))
      .filter(Boolean)
      .map(el => {
        const base = el.name.replace(/\(\d+\)$/, '').trimEnd()
        const nums = els.value
          .map(e => { const m = e.name.match(/^(.+?)\((\d+)\)$/) ; return m && m[1] === base ? +m[2] : 0 })
          .filter(n => n > 0)
        const next = nums.length ? Math.max(...nums) + 1 : 1
        return {
          ...JSON.parse(JSON.stringify(el)),
          id: Math.random().toString(36).slice(2, 9),
          x: el.x + 10,
          y: el.y + 10,
          name: `${base}(${next})`,
        }
      })
    const next = [...els.value, ...copies]
    commit(next)
    selected.value = new Set(copies.map(e => e.id))
  }

  function updEl(id, patches) {
    const next = els.value.map(e => e.id === id ? { ...e, ...patches } : e)
    commit(next)
  }

  function batchRename(prefix) {
    let i = 0
    const next = els.value.map(e => selected.value.has(e.id) ? { ...e, name: `${prefix}${i++}` } : e)
    commit(next)
  }

  function selectAll() {
    selected.value = new Set(els.value.map(e => e.id))
  }

  function clearSelection() {
    selected.value = new Set()
  }

  function toggleSelect(id, multi = false) {
    if (multi) {
      const n = new Set(selected.value)
      n.has(id) ? n.delete(id) : n.add(id)
      selected.value = n
    } else {
      selected.value = new Set([id])
    }
  }

  function undo() {
    const state = histUndo()
    if (state !== null) els.value = state
  }

  function redo() {
    const state = histRedo()
    if (state !== null) els.value = state
  }

  function bringToFront() {
    const max = Math.max(...els.value.map(e => e.layer || 0))
    const next = els.value.map(e => selected.value.has(e.id) ? { ...e, layer: max + 1 } : e)
    commit(next)
  }

  function sendToBack() {
    const min = Math.min(...els.value.map(e => e.layer || 0))
    const next = els.value.map(e => selected.value.has(e.id) ? { ...e, layer: min - 1 } : e)
    commit(next)
  }

  return {
    els, selected, sorted, selArr, selOne,
    addEl, deleteSelected, duplicate, updEl, batchRename,
    selectAll, clearSelection, toggleSelect,
    undo, redo, canUndo, canRedo,
    bringToFront, sendToBack,
    commitEls: commit,
  }
}
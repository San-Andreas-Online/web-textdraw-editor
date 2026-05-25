import { ref } from 'vue'

export function useRefImages() {
  const refs = ref([])
  const selRef = ref(null)

  function upload(files) {
    [...files].forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        refs.value.push({
          id: Math.random().toString(36).slice(2, 9),
          name: file.name.replace(/\.[^.]+$/, ''),
          src: e.target.result,
          x: 40, y: 40, w: 240, h: 180,
          opacity: 50,
          locked: false,
          visible: true,
        })
      }
      reader.readAsDataURL(file)
    })
  }

  function update(id, patches) {
    refs.value = refs.value.map(r => r.id === id ? { ...r, ...patches } : r)
  }

  function remove(id) {
    refs.value = refs.value.filter(r => r.id !== id)
    if (selRef.value === id) selRef.value = null
  }

  function select(id) {
    selRef.value = id
  }

  function clearSelection() {
    selRef.value = null
  }

  const selected = () => refs.value.find(r => r.id === selRef.value) ?? null

  return { refs, selRef, upload, update, remove, select, clearSelection, selected }
}

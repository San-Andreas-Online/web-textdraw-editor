import { shallowRef, computed } from 'vue'
import { parseTxd } from '../utils/parseTxd'

function genId() { return Math.random().toString(36).slice(2, 9) }

export function useTxdStore() {
  const txdEntries = shallowRef([])

  async function addTxd(file, modelId) {
    console.log('addTxd called', file, modelId)
    file = file instanceof File ? file : new File([file], file.name, { type: file.type })
    const id = genId()
    const entry = {
      id,
      filename: file.name,
      modelId: String(modelId).trim(),
      textures: [],
      loading: true,
      error: null,
    }
    txdEntries.value = [...txdEntries.value, entry]

    try {
      const buffer = await file.arrayBuffer()
      const textures = parseTxd(buffer)
      console.log('parsed textures:', textures)
      const idx = txdEntries.value.findIndex(e => e.id === id)
      if (idx !== -1) {
        const next = [...txdEntries.value]
        next[idx] = { ...entry, textures, loading: false }
        txdEntries.value = next
      }
    } catch (err) {
      console.error('parseTxd error:', err)
      const idx = txdEntries.value.findIndex(e => e.id === id)
      if (idx !== -1) {
        const next = [...txdEntries.value]
        next[idx] = { ...entry, loading: false, error: err.message }
        txdEntries.value = next
      }
    }
  }

  function removeTxd(id) {
    txdEntries.value = txdEntries.value.filter(e => e.id !== id)
  }

  const txdSprites = computed(() =>
  txdEntries.value.flatMap(entry => {
    console.log('entry:', JSON.stringify(entry))
      if (entry.loading) return []
      if (entry.error || !entry.textures.length) {
        return [{
          lib: `mdl-${entry.modelId}`,
          tex: String(entry.filename).replace(/\.txd$/i, ''),
          path: null,
          fromTxd: true,
          txdId: entry.id,
          placeholder: true,
          error: entry.error,
        }]
      }
      return entry.textures.map(({ name, dataURL }) => ({
        lib: `mdl-${entry.modelId}`,
        tex: name,
        path: dataURL,
        fromTxd: true,
        txdId: entry.id,
        placeholder: false,
      }))
    })
  )

  return { txdEntries, txdSprites, addTxd, removeTxd }
}
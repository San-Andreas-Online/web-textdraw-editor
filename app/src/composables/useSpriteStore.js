import { ref, computed } from 'vue'
import { KNOWN_SPRITES, spriteImagePath } from '../constants/sprites'

export function useSpriteStore() {
  const search = ref('')
  const filterLib = ref('')
  const selected = ref(null)

  const libs = computed(() => ['', ...new Set(KNOWN_SPRITES.map(s => s.lib))])

  const sprites = computed(() => {
    return KNOWN_SPRITES
      .filter(s => filterLib.value === '' || s.lib === filterLib.value)
      .filter(s => (s.lib + ':' + s.tex).toLowerCase().includes(search.value.toLowerCase()))
      .map(s => ({ ...s, path: spriteImagePath(s.lib, s.tex) }))
  })

  function select(sprite) {
    selected.value = sprite
  }

  return { search, filterLib, libs, sprites, selected, select }
}

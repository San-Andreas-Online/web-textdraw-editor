import { ref } from 'vue'

export function useBgImage() {
  const bgImage = ref(null)

  function upload(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => { bgImage.value = e.target.result }
    reader.readAsDataURL(file)
  }

  function remove() {
    bgImage.value = null
  }

  return { bgImage, upload, remove }
}

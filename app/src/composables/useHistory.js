import { ref } from 'vue'

export function useHistory() {
  const stack = ref([[]])
  const index = ref(0)

  function push(state) {
    const snapshot = JSON.parse(JSON.stringify(state))
    stack.value = stack.value.slice(0, index.value + 1)
    stack.value.push(snapshot)
    index.value = stack.value.length - 1
  }

  function undo() {
    if (index.value > 0) {
      index.value--
      return JSON.parse(JSON.stringify(stack.value[index.value]))
    }
    return null
  }

  function redo() {
    if (index.value < stack.value.length - 1) {
      index.value++
      return JSON.parse(JSON.stringify(stack.value[index.value]))
    }
    return null
  }

  const canUndo = () => index.value > 0
  const canRedo = () => index.value < stack.value.length - 1

  return { push, undo, redo, canUndo, canRedo }
}

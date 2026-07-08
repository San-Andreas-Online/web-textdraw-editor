import { ref } from 'vue'
import { saveProject, listProjects, getProject, deleteProject, makeProjectId } from '../utils/projectsDb'

export function useProjects() {
  const projects = ref([])       // metadata list: { id, name, updatedAt }
  const currentId = ref(null)    // id of the project currently loaded, or null if unsaved

  async function refresh() {
    const all = await listProjects()
    projects.value = all.map(p => ({ id: p.id, name: p.name, updatedAt: p.updatedAt }))
  }

  // snapshot = { els, prefix, bgImage, refs, widescreen, showGrid, gridSize, zoom }
  async function saveAsNew(name, snapshot) {
    const project = {
      id: makeProjectId(),
      name,
      updatedAt: Date.now(),
      data: snapshot,
    }
    await saveProject(project)
    currentId.value = project.id
    await refresh()
    return project.id
  }

  async function saveExisting(id, name, snapshot) {
    const project = {
      id,
      name,
      updatedAt: Date.now(),
      data: snapshot,
    }
    await saveProject(project)
    currentId.value = id
    await refresh()
  }

  async function load(id) {
    const project = await getProject(id)
    if (!project) return null
    currentId.value = project.id
    return project
  }

  async function remove(id) {
    await deleteProject(id)
    if (currentId.value === id) currentId.value = null
    await refresh()
  }

  return { projects, currentId, refresh, saveAsNew, saveExisting, load, remove }
}
import { ref } from 'vue'
import { saveProject, listProjects, getProject, deleteProject, makeProjectId } from '../utils/projectsDb'
import { useGistSync } from './useGistSync'

export function useProjects() {
  const projects = ref([])
  const currentId = ref(null)
  const gistSync = useGistSync()

  async function refresh() {
    const all = await listProjects()
    projects.value = all.map(p => ({ id: p.id, name: p.name, updatedAt: p.updatedAt }))
  }

  async function syncToCloud() {
    if (!gistSync.token.value) return
    const all = await listProjects()
    await gistSync.push(all)
  }

  async function pullFromCloud() {
    const remote = await gistSync.pull()
    if (!remote?.projects?.length) return 0

    let imported = 0
    for (const project of remote.projects) {
      const existing = await getProject(project.id)
      if (!existing || existing.updatedAt < project.updatedAt) {
        await saveProject(project)
        imported++
      }
    }
    await refresh()
    return imported
  }

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
    await syncToCloud()
    return project.id
  }

  async function saveExisting(id, name, snapshot) {
    const project = { id, name, updatedAt: Date.now(), data: snapshot }
    await saveProject(project)
    currentId.value = id
    await refresh()
    await syncToCloud()
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
    await syncToCloud()
  }

  return {
    projects,
    currentId,
    syncing: gistSync.syncing,
    lastSynced: gistSync.lastSynced,
    refresh,
    saveAsNew,
    saveExisting,
    load,
    remove,
    pullFromCloud,
    syncToCloud,
  }
}
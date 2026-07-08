import { ref } from 'vue'

const GIST_FILENAME = 'textdraw-editor-projects.json'
const GIST_DESCRIPTION = 'TextDraw Editor cloud save (do not delete)'

const token = ref(localStorage.getItem('gh_token') ?? null)
const gistId = ref(localStorage.getItem('gh_gist_id') ?? null)
const syncing = ref(false)
const lastSynced = ref(null)

function authHeaders() {
  return {
    Authorization: `Bearer ${token.value}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }
}

async function findExistingGist() {
  let page = 1
  while (true) {
    const res = await fetch(`https://api.github.com/gists?per_page=100&page=${page}`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error('Failed to list gists')
    const gists = await res.json()
    if (!gists.length) break

    const found = gists.find(g => g.description === GIST_DESCRIPTION && g.files[GIST_FILENAME])
    if (found) return found.id

    if (gists.length < 100) break
    page++
  }
  return null
}

async function createGist() {
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify({ projects: [] }) } },
    }),
  })
  if (!res.ok) throw new Error('Failed to create gist')
  const data = await res.json()
  return data.id
}

async function resolveGistId() {
  if (gistId.value) return gistId.value
  let id = await findExistingGist()
  if (!id) id = await createGist()
  gistId.value = id
  localStorage.setItem('gh_gist_id', id)
  return id
}

export function useGistSync() {
  function setToken(t) {
    token.value = t
    localStorage.setItem('gh_token', t)
  }

  function clearAuth() {
    token.value = null
    gistId.value = null
    localStorage.removeItem('gh_token')
    localStorage.removeItem('gh_gist_id')
  }

  async function pull() {
    if (!token.value) return null
    syncing.value = true
    try {
      const id = await resolveGistId()
      const res = await fetch(`https://api.github.com/gists/${id}`, { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch gist')
      const data = await res.json()
      const raw = data.files[GIST_FILENAME]?.content ?? '{}'
      lastSynced.value = Date.now()
      return JSON.parse(raw)
    } finally {
      syncing.value = false
    }
  }

  async function push(projects) {
    if (!token.value) return
    syncing.value = true
    try {
      const id = await resolveGistId()
      const res = await fetch(`https://api.github.com/gists/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          files: { [GIST_FILENAME]: { content: JSON.stringify({ projects }) } },
        }),
      })
      if (!res.ok) throw new Error('Failed to update gist')
      lastSynced.value = Date.now()
    } finally {
      syncing.value = false
    }
  }

  return { token, syncing, lastSynced, setToken, clearAuth, pull, push }
}
const GITHUB_CLIENT_ID = 'Ov23liCvYfbOUjgELdKY'
const WORKER_URL = 'https://web-textdraw-editor-auth.hiilpyhal.workers.dev'
const REDIRECT_URI = window.location.origin + window.location.pathname

function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function startGithubLogin() {
  const state = base64url(crypto.getRandomValues(new Uint8Array(16)))
  sessionStorage.setItem('gh_oauth_state', state)

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'gist',
    state,
  })

  const url = `https://github.com/login/oauth/authorize?${params}`
  console.log('Redirecting to:', url)
  window.location.href = url
}

export async function handleGithubCallback() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')

  if (!code) return null

  const savedState = sessionStorage.getItem('gh_oauth_state')
  sessionStorage.removeItem('gh_oauth_state')
  if (state !== savedState) throw new Error('OAuth state mismatch')

  window.history.replaceState({}, '', window.location.pathname)
  return { code }
}

export async function exchangeCodeForToken(code) {
  console.log('[auth] sending code to worker:', code)
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  console.log('[auth] worker status:', res.status)
  if (!res.ok) throw new Error('Token exchange failed')
  const data = await res.json()
  console.log('[auth] worker response:', JSON.stringify(data))
  if (data.error) throw new Error(data.error_description ?? data.error)
  return data.access_token
}

export async function fetchGithubUser(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error('Failed to fetch GitHub user')
  return res.json()
}
import { ref, computed } from 'vue'
import { startGithubLogin, handleGithubCallback, exchangeCodeForToken, fetchGithubUser } from '../utils/githubAuth'
import { useGistSync } from './useGistSync'

const user = ref(JSON.parse(localStorage.getItem('gh_user') ?? 'null'))
const authError = ref(null)
const authLoading = ref(false)
let callbackHandled = false

export function useGithubAuth() {
  const gistSync = useGistSync()
  const isLoggedIn = computed(() => !!user.value && !!gistSync.token.value)

  async function login() {
    authError.value = null
    await startGithubLogin()
  }

  async function handleCallback() {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    console.log('[auth] handleCallback fired, code:', code)

    if (!code) return false
    if (callbackHandled) {
      console.log('[auth] already handled, skipping')
      return false
    }
    callbackHandled = true

    authLoading.value = true
    authError.value = null
    try {
      console.log('[auth] calling handleGithubCallback...')
      const result = await handleGithubCallback()
      console.log('[auth] handleGithubCallback result:', result)

      console.log('[auth] exchanging code for token...')
      const token = await exchangeCodeForToken(result.code)
      console.log('[auth] got token:', !!token)

      gistSync.setToken(token)

      console.log('[auth] fetching github user...')
      const ghUser = await fetchGithubUser(token)
      console.log('[auth] github user:', ghUser.login)

      user.value = { id: ghUser.id, login: ghUser.login, avatar: ghUser.avatar_url }
      localStorage.setItem('gh_user', JSON.stringify(user.value))
      return true
    } catch (e) {
      console.error('[auth] error:', e)
      authError.value = e.message
      callbackHandled = false
      return false
    } finally {
      authLoading.value = false
    }
  }

  function logout() {
    user.value = null
    authError.value = null
    callbackHandled = false
    localStorage.removeItem('gh_user')
    gistSync.clearAuth()
  }

  return { user, isLoggedIn, authLoading, authError, login, handleCallback, logout }
}
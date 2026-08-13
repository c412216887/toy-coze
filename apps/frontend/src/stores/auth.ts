import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, fetchMe, type LoginPayload, type UserProfile } from '@/api/auth'

const TOKEN_KEY = 'coze_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<UserProfile | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  const displayName = computed(() => user.value?.username ?? user.value?.email ?? '')

  const avatarLetter = computed(() => {
    const name = user.value?.username ?? user.value?.email ?? '?'
    return name.charAt(0).toUpperCase()
  })

  async function login(payload: LoginPayload): Promise<void> {
    const res = await loginApi(payload)
    token.value = res.accessToken
    localStorage.setItem(TOKEN_KEY, res.accessToken)
    await loadUser()
  }

  async function loadUser(): Promise<void> {
    if (!token.value) return
    try {
      user.value = await fetchMe()
    } catch {
      logout()
    }
  }

  function logout(): void {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  return { token, user, isLoggedIn, displayName, avatarLetter, login, loadUser, logout }
})

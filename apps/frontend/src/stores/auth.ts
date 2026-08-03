import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi } from '@/api/auth'
import type { LoginPayload } from '@/api/auth'

const TOKEN_KEY = 'coze_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))

  const isLoggedIn = computed(() => !!token.value)

  async function login(payload: LoginPayload): Promise<void> {
    const res = await loginApi(payload)
    token.value = res.access_token
    localStorage.setItem(TOKEN_KEY, res.access_token)
  }

  function logout(): void {
    token.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  return { token, isLoggedIn, login, logout }
})

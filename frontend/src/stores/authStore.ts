import { create } from 'zustand'
import * as authService from '../services/authService'
import type { User } from '../types/auth'

type AuthStore = {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (email: string, nickname: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const authKey = 'context-reader-auth'

function readAuth() {
  const raw = localStorage.getItem(authKey)
  if (!raw) {
    return { token: null, user: null }
  }

  try {
    return JSON.parse(raw) as { token: string | null; user: User | null }
  } catch {
    return { token: null, user: null }
  }
}

function saveAuth(token: string, user: User) {
  localStorage.setItem(authKey, JSON.stringify({ token, user }))
}

const initialAuth = readAuth()

export const useAuthStore = create<AuthStore>((set) => ({
  token: initialAuth.token,
  user: initialAuth.user,
  isAuthenticated: Boolean(initialAuth.token && initialAuth.user),
  login: async (email, password) => {
    try {
      const response = await authService.login(email, password)
      saveAuth(response.accessToken, response.user)
      set({ token: response.accessToken, user: response.user, isAuthenticated: true })
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '邮箱或密码错误' }
    }
  },
  register: async (email, nickname, password) => {
    try {
      const response = await authService.register(email, nickname, password)
      saveAuth(response.accessToken, response.user)
      set({ token: response.accessToken, user: response.user, isAuthenticated: true })
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '注册失败' }
    }
  },
  logout: () => {
    localStorage.removeItem(authKey)
    set({ token: null, user: null, isAuthenticated: false })
  },
}))

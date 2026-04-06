import { create } from 'zustand'
import { http } from '../utils/api'
import type { UserWithoutPassword } from '@hmoa/types'

interface AuthState {
  user: UserWithoutPassword | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  login: async (username: string, password: string) => {
    const res = await http.post<{ user: UserWithoutPassword }>('/auth/login', { username, password })
    set({ user: res.user })
  },

  logout: async () => {
    await http.post('/auth/logout')
    set({ user: null })
  },

  checkAuth: async () => {
    try {
      const res = await http.get<{ user: UserWithoutPassword }>('/auth/me', { skipAuthRedirect: true })
      set({ user: res.user })
    } catch {
      set({ user: null })
    }
  },
}))

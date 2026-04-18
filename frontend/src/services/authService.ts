import { apiRequest } from './api'
import type { AuthResponse, User } from '../types/auth'

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function register(email: string, nickname: string, password: string, inviteCode: string) {
  return apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, nickname, password, inviteCode }),
  })
}

export function getMe() {
  return apiRequest<User>('/api/auth/me')
}

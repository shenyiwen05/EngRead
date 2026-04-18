export type User = {
  id: string
  email: string
  nickname: string
}

export type AuthState = {
  token: string | null
  user: User | null
}

export type AuthResponse = {
  accessToken: string
  user: User
}

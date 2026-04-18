const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
const authKey = 'context-reader-auth'

function authToken() {
  const raw = localStorage.getItem(authKey)
  if (!raw) {
    return null
  }

  try {
    return (JSON.parse(raw) as { token?: string }).token ?? null
  } catch {
    return null
  }
}

function clearAuthAndRedirect() {
  localStorage.removeItem(authKey)
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login')
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authToken()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearAuthAndRedirect()
    throw new Error('未登录')
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.detail ?? '请求失败')
  }

  return body as T
}

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export function LoginPage() {
  const [email, setEmail] = useState('reader@example.com')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = await login(email, password)
    if (!result.ok) {
      setError(result.error ?? '邮箱或密码错误')
      return
    }

    navigate('/')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <form className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-medium text-gray-950">登录</h1>
        <label className="mt-5 block text-sm text-gray-700">
          邮箱
          <input className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-gray-900 outline-none transition-colors focus:border-gray-400" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="mt-4 block text-sm text-gray-700">
          密码
          <input className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-gray-900 outline-none transition-colors focus:border-gray-400" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button className="mt-5 w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700" type="submit">
          进入
        </button>
        <Link className="mt-4 block text-center text-sm text-gray-600 transition-colors hover:text-gray-900" to="/register">
          注册新账号
        </Link>
      </form>
    </main>
  )
}

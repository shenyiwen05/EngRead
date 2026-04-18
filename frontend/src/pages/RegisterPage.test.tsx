import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterPage } from './RegisterPage'

const register = vi.fn()

vi.mock('../stores/authStore', () => ({
  useAuthStore: (selector: (state: { register: typeof register }) => typeof register) =>
    selector({ register }),
}))

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<p>dashboard reached</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    register.mockReset()
  })

  it('submits the invite code with valid registration details', async () => {
    const user = userEvent.setup()
    register.mockResolvedValueOnce({ ok: true })

    renderRegisterPage()

    fireEvent.change(screen.getByLabelText(/邮箱/), { target: { value: 'reader@example.com' } })
    fireEvent.change(screen.getByLabelText(/昵称/), { target: { value: 'reader' } })
    fireEvent.change(screen.getByLabelText(/^密码/), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/确认密码/), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/邀请码/), { target: { value: 'sywww' } })
    await user.click(screen.getByRole('button', { name: '注册并进入' }))

    expect(register).toHaveBeenCalledWith('reader@example.com', 'reader', 'password123', 'sywww')
    expect(await screen.findByText('dashboard reached')).toBeInTheDocument()
  })

  it('shows the backend invite code error when registration fails', async () => {
    const user = userEvent.setup()
    register.mockResolvedValueOnce({ ok: false, error: '邀请码无效' })

    renderRegisterPage()

    fireEvent.change(screen.getByLabelText(/邮箱/), { target: { value: 'reader@example.com' } })
    fireEvent.change(screen.getByLabelText(/^密码/), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/确认密码/), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/邀请码/), { target: { value: 'wrong' } })
    await user.click(screen.getByRole('button', { name: '注册并进入' }))

    expect(await screen.findByText('邀请码无效')).toBeInTheDocument()
  })
})

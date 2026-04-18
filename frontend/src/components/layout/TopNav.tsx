import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const navItems = [
  { to: '/articles', label: '我的文章' },
  { to: '/import', label: '导入文章' },
  { to: '/favorites', label: '收藏' },
]

export function TopNav() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const isReaderPage = location.pathname.startsWith('/reader/')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white">
      <div
        className={`mx-auto flex items-center justify-between gap-5 px-6 ${
          isReaderPage ? 'max-w-[1400px] py-3' : 'max-w-[1200px] py-3'
        }`}
      >
        <NavLink to="/" className={`${isReaderPage ? 'text-sm' : 'text-base'} font-medium text-gray-900`}>
          Context Reader
        </NavLink>
        <nav className="flex flex-wrap items-center gap-5 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `transition-colors ${
                  isActive ? 'text-gray-950' : 'text-gray-500 hover:text-gray-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="hidden max-w-28 truncate sm:inline">{user?.nickname}</span>
          <button
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
            onClick={handleLogout}
          >
            退出
          </button>
        </div>
      </div>
    </header>
  )
}

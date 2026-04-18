import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { TopNav } from './TopNav'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const isReaderPage = location.pathname.startsWith('/reader/')
  const containerClass = isReaderPage ? 'max-w-[1400px]' : 'max-w-[1200px]'

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <TopNav />
      <main className={`mx-auto px-6 ${containerClass} ${isReaderPage ? 'py-6' : 'py-12'}`}>{children}</main>
      <footer className={`mx-auto ${containerClass} px-6 pb-8 text-xs leading-6 text-gray-400`}>
        AI 生成的翻译和解释仅供学习参考，可能存在错误，请结合原文判断。
      </footer>
    </div>
  )
}

import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ArticleListPage } from '../pages/ArticleListPage'
import { DashboardPage } from '../pages/DashboardPage'
import { FavoritesPage } from '../pages/FavoritesPage'
import { ImportPage } from '../pages/ImportPage'
import { LoginPage } from '../pages/LoginPage'
import { ReaderPage } from '../pages/ReaderPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ReviewPage } from '../pages/ReviewPage'
import { ProtectedRoute } from './ProtectedRoute'

function protectedPage(page: ReactNode) {
  return <ProtectedRoute>{page}</ProtectedRoute>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={protectedPage(<DashboardPage />)} />
        <Route path="/articles" element={protectedPage(<ArticleListPage />)} />
        <Route path="/import" element={protectedPage(<ImportPage />)} />
        <Route path="/reader/:articleId" element={protectedPage(<ReaderPage />)} />
        <Route path="/review/:articleId" element={protectedPage(<ReviewPage />)} />
        <Route path="/favorites" element={protectedPage(<FavoritesPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

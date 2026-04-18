import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { analyzeArticle } from '../services/articleService'
import { ImportPage } from './ImportPage'

vi.mock('../services/articleService', () => ({
  analyzeArticle: vi.fn(),
}))

const validArticleText = Array.from(
  { length: 90 },
  (_, index) => `word${index + 1}`,
).join(' ')

function renderImportPage() {
  return render(
    <MemoryRouter initialEntries={['/import']}>
      <Routes>
        <Route path="/import" element={<ImportPage />} />
        <Route path="/reader/:articleId" element={<p>reader reached</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ImportPage', () => {
  beforeEach(() => {
    vi.mocked(analyzeArticle).mockReset()
  })

  it('submits valid article text and navigates to the draft reader after analysis starts', async () => {
    const user = userEvent.setup()
    let resolveAnalyze: (value: Awaited<ReturnType<typeof analyzeArticle>>) => void = () => {}
    vi.mocked(analyzeArticle).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveAnalyze = resolve
      }),
    )

    renderImportPage()

    fireEvent.change(screen.getByLabelText(/标题/), { target: { value: 'Market Note' } })
    fireEvent.change(screen.getByLabelText(/英文文章/), { target: { value: validArticleText } })
    await user.click(screen.getByRole('button', { name: '开始分析' }))

    expect(analyzeArticle).toHaveBeenCalledWith({ title: 'Market Note', rawText: validArticleText })
    expect(screen.getByRole('button', { name: '分析中...' })).toBeDisabled()
    expect(screen.getByText('正在拆分句子...')).toBeInTheDocument()

    resolveAnalyze({ articleId: 'article-123', status: 'analyzing' })

    expect(await screen.findByText('reader reached')).toBeInTheDocument()
  })

  it('shows the failure message when analysis fails', async () => {
    const user = userEvent.setup()
    vi.mocked(analyzeArticle).mockRejectedValueOnce(new Error('network failed'))

    renderImportPage()

    fireEvent.change(screen.getByLabelText(/英文文章/), { target: { value: validArticleText } })
    await user.click(screen.getByRole('button', { name: '开始分析' }))

    await waitFor(() => {
      expect(screen.getByText('文章分析失败，请稍后重试')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: '开始分析' })).toBeEnabled()
  })
})

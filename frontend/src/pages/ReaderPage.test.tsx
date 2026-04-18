import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAnalysisStatus, getArticle } from '../services/articleService'
import type { Article } from '../types/article'
import { ReaderPage } from './ReaderPage'

vi.mock('../services/articleService', () => ({
  getArticle: vi.fn(),
  getAnalysisStatus: vi.fn(),
}))

const draftArticle: Article = {
  id: 'article-123',
  ownerId: 'user-1',
  title: 'Draft Article',
  sourceType: 'user_imported',
  analysisStatus: 'analyzing',
  createdAt: '2026-04-18T00:00:00Z',
  updatedAt: '2026-04-18T00:00:00Z',
  paragraphs: [
    {
      id: 'p1',
      order: 1,
      originalText: 'Small firms face pressure.',
      sentences: [
        {
          id: 's1_1',
          order: 1,
          text: 'Small firms face pressure.',
          translation: '',
          isLongSentence: false,
          tokens: [],
          phrases: [],
        },
      ],
    },
  ],
  review: {
    keyPhrases: [],
    familiarButShiftedWords: [],
    longSentences: [],
    summary: '',
  },
}

const readyArticle: Article = {
  ...draftArticle,
  analysisStatus: 'ready',
  paragraphs: [
    {
      ...draftArticle.paragraphs[0],
      sentences: [
        {
          ...draftArticle.paragraphs[0].sentences[0],
          translation: '小公司面临压力。',
        },
      ],
    },
  ],
}

function renderReaderPage() {
  return render(
    <MemoryRouter initialEntries={['/reader/article-123']}>
      <Routes>
        <Route path="/reader/:articleId" element={<ReaderPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ReaderPage', () => {
  beforeEach(() => {
    vi.mocked(getArticle).mockReset()
    vi.mocked(getAnalysisStatus).mockReset()
  })

  it('shows the draft article while analysis runs and refreshes when analysis is ready', async () => {
    vi.mocked(getArticle).mockResolvedValueOnce(draftArticle).mockResolvedValueOnce(readyArticle)
    vi.mocked(getAnalysisStatus).mockResolvedValueOnce({ articleId: 'article-123', status: 'ready', errorMessage: null })

    renderReaderPage()

    expect(await screen.findByText('Draft Article')).toBeInTheDocument()
    expect(screen.getByText('Small firms face pressure.')).toBeInTheDocument()
    expect(screen.getByText(/AI 正在分析这篇文章/)).toBeInTheDocument()

    await waitFor(() => {
      expect(getAnalysisStatus).toHaveBeenCalledWith('article-123')
      expect(getArticle).toHaveBeenCalledTimes(2)
      expect(screen.queryByText(/AI 正在分析这篇文章/)).not.toBeInTheDocument()
    }, { timeout: 3500 })
  })
})

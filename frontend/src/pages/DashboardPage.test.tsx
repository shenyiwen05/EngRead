import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { listArticles } from '../services/articleService'
import type { Article } from '../types/article'
import { DashboardPage } from './DashboardPage'

vi.mock('../services/articleService', () => ({
  listArticles: vi.fn(),
}))

const articles: Article[] = [
  {
    id: 'sample-1',
    ownerId: null,
    title: 'Sample Article',
    sourceType: 'sample',
    topic: 'Business',
    difficulty: 'B2',
    estimatedReadingMinutes: 4,
    createdAt: '2026-04-16T00:00:00.000Z',
    updatedAt: '2026-04-16T00:00:00.000Z',
    paragraphs: [],
    review: { keyPhrases: [], familiarButShiftedWords: [], longSentences: [], summary: '' },
  },
  {
    id: 'recent-1',
    ownerId: 'user1',
    title: 'Recently Read Article',
    sourceType: 'user_imported',
    topic: 'Markets',
    difficulty: 'B1',
    estimatedReadingMinutes: 2,
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T00:00:00.000Z',
    lastReadAt: '2026-04-18T00:00:00.000Z',
    paragraphs: [],
    review: { keyPhrases: [], familiarButShiftedWords: [], longSentences: [], summary: '' },
  },
]

describe('DashboardPage', () => {
  it('shows real recent reading, current import copy, and AI disclaimer', async () => {
    vi.mocked(listArticles).mockResolvedValueOnce(articles)

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Sample Article')).toBeInTheDocument()
    expect(screen.getByText('Recently Read Article')).toBeInTheDocument()
    expect(screen.queryByText(/Phase 1/)).not.toBeInTheDocument()
    expect(screen.getByText(/AI 生成的翻译和解释仅供学习参考/)).toBeInTheDocument()
  })
})

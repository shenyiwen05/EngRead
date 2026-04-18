import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listArticles } from '../services/articleService'
import { listFavorites } from '../services/favoriteService'
import { useFavoriteStore } from '../stores/favoriteStore'
import type { Article } from '../types/article'
import { ArticleListPage } from './ArticleListPage'

vi.mock('../services/articleService', () => ({
  listArticles: vi.fn(),
}))

vi.mock('../services/favoriteService', () => ({
  listFavorites: vi.fn(),
  createFavorite: vi.fn(),
  deleteFavorite: vi.fn(),
}))

const articles: Article[] = [
  {
    id: 'article-favorited',
    ownerId: 'user1',
    title: 'Favorited Article',
    sourceType: 'user_imported',
    topic: 'Business',
    difficulty: 'B2',
    estimatedReadingMinutes: 3,
    createdAt: '2026-04-18T00:00:00.000Z',
    updatedAt: '2026-04-18T00:00:00.000Z',
    paragraphs: [],
    review: { keyPhrases: [], familiarButShiftedWords: [], longSentences: [], summary: '' },
  },
  {
    id: 'article-plain',
    ownerId: 'user1',
    title: 'Plain Article',
    sourceType: 'user_imported',
    topic: 'Business',
    difficulty: 'B1',
    estimatedReadingMinutes: 2,
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T00:00:00.000Z',
    paragraphs: [],
    review: { keyPhrases: [], familiarButShiftedWords: [], longSentences: [], summary: '' },
  },
]

describe('ArticleListPage', () => {
  beforeEach(() => {
    useFavoriteStore.setState({ favorites: [], isLoading: false, error: '' })
    vi.mocked(listArticles).mockReset()
    vi.mocked(listFavorites).mockReset()
  })

  it('filters articles to backend favorites when 收藏过的 is selected', async () => {
    const user = userEvent.setup()
    vi.mocked(listArticles).mockResolvedValueOnce(articles)
    vi.mocked(listFavorites).mockResolvedValueOnce([
      {
        id: 'fav1',
        articleId: 'article-favorited',
        articleTitle: 'Favorited Article',
        itemType: 'phrase',
        itemId: 'ph1',
        snapshot: {
          id: 'ph1',
          text: 'cash flow',
          start: 0,
          end: 9,
          type: 'collocation',
          meaningInSentence: '现金流',
        },
        createdAt: '2026-04-18T00:00:00.000Z',
      },
    ])

    render(
      <MemoryRouter>
        <ArticleListPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Favorited Article')).toBeInTheDocument()
    expect(screen.getByText('Plain Article')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '收藏过的' }))

    expect(screen.getByText('Favorited Article')).toBeInTheDocument()
    expect(screen.queryByText('Plain Article')).not.toBeInTheDocument()
  })
})

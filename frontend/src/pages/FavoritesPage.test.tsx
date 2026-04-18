import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listFavorites, deleteFavorite } from '../services/favoriteService'
import { useFavoriteStore } from '../stores/favoriteStore'
import { FavoritesPage } from './FavoritesPage'

vi.mock('../services/favoriteService', () => ({
  listFavorites: vi.fn(),
  deleteFavorite: vi.fn(),
  createFavorite: vi.fn(),
}))

describe('FavoritesPage', () => {
  beforeEach(() => {
    useFavoriteStore.setState({ favorites: [], isLoading: false, error: '' })
    vi.mocked(listFavorites).mockReset()
    vi.mocked(deleteFavorite).mockReset()
  })

  it('loads and displays persisted favorites with source article and meaning', async () => {
    vi.mocked(listFavorites).mockResolvedValueOnce([
      {
        id: 'fav1',
        articleId: 'article1',
        articleTitle: 'Market Note',
        itemType: 'phrase',
        itemId: 'ph1',
        snapshot: {
          id: 'ph1',
          text: 'come under pressure',
          start: 0,
          end: 19,
          type: 'collocation',
          meaningInSentence: '承受压力',
        },
        createdAt: '2026-04-18T00:00:00.000Z',
      },
    ])

    render(
      <MemoryRouter>
        <FavoritesPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('come under pressure')).toBeInTheDocument()
    expect(screen.getByText(/承受压力/)).toBeInTheDocument()
    expect(screen.getByText(/Market Note/)).toBeInTheDocument()
  })

  it('deletes a favorite from the page', async () => {
    const user = userEvent.setup()
    vi.mocked(listFavorites).mockResolvedValueOnce([
      {
        id: 'fav1',
        articleId: 'article1',
        articleTitle: 'Market Note',
        itemType: 'word',
        itemId: 'pressure',
        snapshot: {
          word: 'pressure',
          meaningInSentence: '压力',
          commonMeanings: ['压力'],
        },
        createdAt: '2026-04-18T00:00:00.000Z',
      },
    ])
    vi.mocked(deleteFavorite).mockResolvedValueOnce({ ok: true })

    render(
      <MemoryRouter>
        <FavoritesPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('pressure')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '取消收藏' }))

    await waitFor(() => {
      expect(screen.queryByText('pressure')).not.toBeInTheDocument()
    })
  })
})

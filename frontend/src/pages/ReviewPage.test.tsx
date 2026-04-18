import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { getArticle } from '../services/articleService'
import { ReviewPage } from './ReviewPage'

vi.mock('../services/articleService', () => ({
  getArticle: vi.fn(),
}))

describe('ReviewPage', () => {
  it('loads review content from backend article detail', async () => {
    vi.mocked(getArticle).mockResolvedValueOnce({
      id: 'article1',
      ownerId: 'user1',
      title: 'Imported Article',
      sourceType: 'user_imported',
      createdAt: '2026-04-18T00:00:00.000Z',
      updatedAt: '2026-04-18T00:00:00.000Z',
      paragraphs: [],
      review: {
        summary: 'A real backend summary.',
        keyPhrases: [
          {
            id: 'ph1',
            text: 'cash flow',
            start: 0,
            end: 9,
            type: 'collocation',
            meaningInSentence: '现金流',
          },
        ],
        familiarButShiftedWords: [
          {
            word: 'signal',
            meaningInSentence: '表明',
            commonMeanings: ['信号'],
          },
        ],
        longSentences: [{ sentenceId: 's1', text: 'Long sentence.', reason: '信息密度高' }],
      },
    })

    render(
      <MemoryRouter initialEntries={['/review/article1']}>
        <Routes>
          <Route path="/review/:articleId" element={<ReviewPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('A real backend summary.')).toBeInTheDocument()
    expect(screen.getByText(/cash flow/)).toBeInTheDocument()
    expect(screen.getByText(/signal/)).toBeInTheDocument()
    expect(screen.getByText(/信息密度高/)).toBeInTheDocument()
    expect(getArticle).toHaveBeenCalledWith('article1')
  })
})

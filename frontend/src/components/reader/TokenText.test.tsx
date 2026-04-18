import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TokenText } from './TokenText'
import type { Phrase, Sentence, WordExplanation } from '../../types/article'

const phrase: Phrase = {
  id: 'phrase_pressure',
  text: 'come under pressure',
  start: 19,
  end: 38,
  type: 'academic_expression',
  meaningInSentence: '承压、受到压力',
  commonMeaning: '受到压力',
  whyImportant: '三个词组合后表达政策或市场承压。',
  collocations: ['come under pressure from investors'],
  sentenceTranslation: '工资增速开始承压。',
}

const modestExplanation: WordExplanation = {
  word: 'modest',
  meaningInSentence: '有限的、不大的',
  commonMeanings: ['谦虚的', '适度的'],
  isFamiliarButShifted: true,
  note: '这里不是“谦虚”，而是表示幅度有限。',
}

const sentence: Sentence = {
  id: 'sentence_1',
  order: 1,
  text: 'Wage gains began to come under pressure after a modest slowdown.',
  translation: '工资增长在一次有限放缓后开始承压。',
  isLongSentence: false,
  tokens: [
    { id: 'token_wage', text: 'Wage', start: 0, end: 4, isClickable: false },
    { id: 'token_gains', text: 'gains', start: 5, end: 10, isClickable: false },
    { id: 'token_began', text: 'began', start: 11, end: 16, isClickable: false },
    { id: 'token_come', text: 'come', start: 20, end: 24, phraseId: 'phrase_pressure', isClickable: true },
    { id: 'token_under', text: 'under', start: 25, end: 30, phraseId: 'phrase_pressure', isClickable: true },
    { id: 'token_pressure', text: 'pressure', start: 31, end: 39, phraseId: 'phrase_pressure', isClickable: true },
    { id: 'token_after', text: 'after', start: 40, end: 45, isClickable: false },
    {
      id: 'token_modest',
      text: 'modest',
      start: 48,
      end: 54,
      isClickable: true,
      isFamiliarButShifted: true,
      explanation: modestExplanation,
    },
    { id: 'token_slowdown', text: 'slowdown', start: 55, end: 63, isClickable: false },
  ],
  phrases: [phrase],
}

describe('TokenText', () => {
  it.each(['come', 'under', 'pressure'])('selects the full phrase when clicking %s', async (word) => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<TokenText sentence={sentence} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: word }))

    expect(onSelect).toHaveBeenCalledWith({ type: 'phrase', data: phrase })
  })

  it('selects the word explanation for a normal clickable word', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<TokenText sentence={sentence} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: /modest/ }))

    expect(onSelect).toHaveBeenCalledWith({ type: 'word', data: modestExplanation })
    expect(screen.getByText('熟词生义')).toBeInTheDocument()
  })

  it('treats phrase tokens as clickable when AI omits isClickable', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const aiSentence: Sentence = {
      ...sentence,
      tokens: sentence.tokens.map((token) =>
        token.phraseId === 'phrase_pressure' ? { ...token, isClickable: undefined as unknown as boolean } : token,
      ),
    }

    render(<TokenText sentence={aiSentence} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: 'come' }))

    expect(onSelect).toHaveBeenCalledWith({ type: 'phrase', data: phrase })
  })

  it('uses token text as the word title when AI explanation omits the word field', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const aiSentence: Sentence = {
      ...sentence,
      tokens: [
        {
          id: 'token_meet',
          text: 'meet',
          start: 20,
          end: 24,
          isClickable: true,
          explanation: {
            meaningInSentence: '满足、实现',
            commonMeanings: [],
          } as unknown as WordExplanation,
        },
      ],
      phrases: [],
      text: 'They need to meet a promise.',
    }

    render(<TokenText sentence={aiSentence} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: 'meet' }))

    expect(onSelect).toHaveBeenCalledWith({
      type: 'word',
      data: {
        word: 'meet',
        meaningInSentence: '满足、实现',
        commonMeanings: [],
      },
    })
  })

  it('repairs shifted token spans from AI output when token text is unique', () => {
    const onSelect = vi.fn()
    const aiSentence: Sentence = {
      ...sentence,
      tokens: [
        {
          id: 'token_meet',
          text: 'meet',
          start: 22,
          end: 26,
          isClickable: true,
          explanation: {
            word: 'meet',
            meaningInSentence: '满足、实现',
            commonMeanings: [],
          },
        },
      ],
      phrases: [],
      text: 'And it is too low to meet a promise.',
    }

    const { container } = render(<TokenText sentence={aiSentence} onSelect={onSelect} />)

    expect(screen.getByRole('button', { name: 'meet' })).toHaveTextContent('meet')
    expect(container).toHaveTextContent('And it is too low to meet a promise.')
  })
})

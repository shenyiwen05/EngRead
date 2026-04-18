import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SentenceBlock } from './SentenceBlock'
import type { Sentence } from '../../types/article'

const longSentence: Sentence = {
  id: 'sentence_long',
  order: 1,
  text:
    'Although consumer spending remained resilient, smaller manufacturers began to come under pressure as borrowing costs stayed stubbornly high.',
  translation: '尽管消费者支出仍有韧性，但随着借贷成本顽固地保持高位，小型制造商开始承压。',
  isLongSentence: true,
  breakdown: {
    mainClause: 'smaller manufacturers began to come under pressure',
    modifiers: ['Although consumer spending remained resilient', 'as borrowing costs stayed stubbornly high'],
    logic: '让步背景加原因说明，突出压力出现的条件。',
    explanation: '先读主干，再把 although 和 as 引导的部分补回去。',
  },
  tokens: [
    { id: 'token_although', text: 'Although', start: 0, end: 8, isClickable: false },
    { id: 'token_consumer', text: 'consumer', start: 9, end: 17, isClickable: false },
    { id: 'token_spending', text: 'spending', start: 18, end: 26, isClickable: false },
    { id: 'token_remained', text: 'remained', start: 27, end: 35, isClickable: false },
    { id: 'token_resilient', text: 'resilient', start: 36, end: 45, isClickable: false },
    { id: 'token_smaller', text: 'smaller', start: 47, end: 54, isClickable: false },
    { id: 'token_manufacturers', text: 'manufacturers', start: 55, end: 68, isClickable: false },
    { id: 'token_began', text: 'began', start: 69, end: 74, isClickable: false },
    { id: 'token_come', text: 'come', start: 78, end: 82, phraseId: 'phrase_pressure', isClickable: true },
    { id: 'token_under', text: 'under', start: 83, end: 88, phraseId: 'phrase_pressure', isClickable: true },
    { id: 'token_pressure', text: 'pressure', start: 89, end: 97, phraseId: 'phrase_pressure', isClickable: true },
    { id: 'token_as', text: 'as', start: 98, end: 100, isClickable: false },
    { id: 'token_borrowing', text: 'borrowing', start: 101, end: 110, isClickable: false },
    { id: 'token_costs', text: 'costs', start: 111, end: 116, isClickable: false },
    { id: 'token_stayed', text: 'stayed', start: 117, end: 123, isClickable: false },
    { id: 'token_stubbornly', text: 'stubbornly', start: 124, end: 134, isClickable: true },
    { id: 'token_high', text: 'high', start: 135, end: 139, isClickable: true },
  ],
  phrases: [
    {
      id: 'phrase_pressure',
      text: 'come under pressure',
      start: 78,
      end: 97,
      type: 'academic_expression',
      meaningInSentence: '开始承压',
    },
    {
      id: 'phrase_high',
      text: 'stubbornly high',
      start: 124,
      end: 139,
      type: 'collocation',
      meaningInSentence: '顽固地保持高位',
    },
  ],
}

describe('SentenceBlock', () => {
  it('does not toggle translation when a token is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<SentenceBlock sentence={longSentence} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: 'come' }))

    expect(screen.queryByText(longSentence.translation)).not.toBeInTheDocument()
  })

  it('opens and closes translation when the sentence is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<SentenceBlock sentence={longSentence} onSelect={onSelect} />)
    await user.click(screen.getByTestId('sentence-sentence_long'))
    expect(screen.getByText(longSentence.translation)).toBeInTheDocument()

    await user.click(screen.getByTestId('sentence-sentence_long'))
    expect(screen.queryByText(longSentence.translation)).not.toBeInTheDocument()
  })

  it('shows the long sentence breakdown', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<SentenceBlock sentence={longSentence} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: '拆解' }))

    expect(screen.getByText('mainClause')).toBeInTheDocument()
    expect(screen.getByText(longSentence.breakdown!.mainClause)).toBeInTheDocument()
    expect(screen.getByText('modifiers')).toBeInTheDocument()
    expect(screen.getByText(longSentence.breakdown!.modifiers[0])).toBeInTheDocument()
    expect(screen.getByText('logic')).toBeInTheDocument()
    expect(screen.getByText(longSentence.breakdown!.logic)).toBeInTheDocument()
    expect(screen.getByText('explanation')).toBeInTheDocument()
    expect(screen.getByText(longSentence.breakdown!.explanation)).toBeInTheDocument()
  })

  it('opens an AI breakdown that omits modifiers without crashing', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const aiSentence: Sentence = {
      ...longSentence,
      breakdown: {
        mainClause: 'smaller manufacturers began to come under pressure',
        logic: '先给让步背景，再说明压力来源。',
        explanation: '先读主干，再补回 although 和 as 部分。',
      } as unknown as Sentence['breakdown'],
    }

    render(<SentenceBlock sentence={aiSentence} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: '拆解' }))

    expect(screen.getByText('mainClause')).toBeInTheDocument()
    expect(screen.getByText('modifiers')).toBeInTheDocument()
    expect(screen.queryByText(longSentence.breakdown!.modifiers[0])).not.toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ExplanationPanel } from './ExplanationPanel'
import type { SelectedExplanation } from '../../types/article'

describe('ExplanationPanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders AI word explanations that omit common meanings without crashing', () => {
    const selection = {
      type: 'word',
      data: {
        meaningInSentence: '转机、好转',
        note: '这里指经济或业务情况改善。',
      },
    } as unknown as SelectedExplanation

    render(<ExplanationPanel articleId="article_1" selection={selection} />)

    expect(screen.getByRole('heading', { name: '单词解释' })).toBeInTheDocument()
    expect(screen.getByText('本句义：转机、好转')).toBeInTheDocument()
    expect(screen.getByText('提示：这里指经济或业务情况改善。')).toBeInTheDocument()
    expect(screen.queryByText(/^常见义：/)).not.toBeInTheDocument()
  })

  it('renders AI word explanations when common meanings are not an array', () => {
    const selection = {
      type: 'word',
      data: {
        word: 'slashed',
        meaningInSentence: '大幅削减',
        commonMeanings: '削减',
      },
    } as unknown as SelectedExplanation

    render(<ExplanationPanel articleId="article_1" selection={selection} />)

    expect(screen.getByRole('heading', { name: 'slashed' })).toBeInTheDocument()
    expect(screen.getByText('本句义：大幅削减')).toBeInTheDocument()
    expect(screen.queryByText(/^常见义：/)).not.toBeInTheDocument()
  })

  it('renders phrase explanations when AI returns collocations in a non-array shape', () => {
    const selection = {
      type: 'phrase',
      data: {
        id: 'phrase_1',
        text: 'hold growth back',
        start: 0,
        end: 16,
        type: 'academic_expression',
        meaningInSentence: '拖累增长',
        collocations: 'hold back investment',
      },
    } as unknown as SelectedExplanation

    render(<ExplanationPanel articleId="article_1" selection={selection} />)

    expect(screen.getByRole('heading', { name: 'hold growth back' })).toBeInTheDocument()
    expect(screen.getByText('本句义：拖累增长')).toBeInTheDocument()
    expect(screen.queryByText(/^搭配：/)).not.toBeInTheDocument()
  })

  it('does not render an empty phrase meaning row when meaningInSentence is missing', () => {
    const selection = {
      type: 'phrase',
      data: {
        id: 'phrase_2',
        text: 'in power',
        start: 0,
        end: 8,
        type: 'academic_expression',
        commonMeaning: '执政时',
      },
    } as unknown as SelectedExplanation

    render(<ExplanationPanel articleId="article_1" selection={selection} />)

    expect(screen.queryByText('本句义：')).not.toBeInTheDocument()
    expect(screen.getByText('常见义：执政时')).toBeInTheDocument()
  })
})

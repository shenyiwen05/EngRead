import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { KaoyanTrainingPanel } from './KaoyanTrainingPanel'
import { buildSentenceEvidenceMap } from './trainingEvidence'
import type { TrainingQuestion, TrainingSet } from '../../types/training'

const question: TrainingQuestion = {
  id: 'q1',
  order: 1,
  questionType: 'detail',
  testedAbility: 'detail_location',
  stem: 'What is suggested?',
  answer: 'A',
  sourceSentenceIds: ['s1'],
  explanation: '定位第 1 句。',
  trapAnalysis: { B: '偷换概念', C: '原文未支持', D: '扩大范围' },
  options: [
    { label: 'A', text: 'Correct', sourceSentenceIds: ['s1'], role: 'correct_evidence' },
    { label: 'B', text: 'Wrong', sourceSentenceIds: ['s2'], role: 'distractor_evidence' },
    { label: 'C', text: 'Unsupported', sourceSentenceIds: [], role: 'unsupported' },
    { label: 'D', text: 'Wrong again', sourceSentenceIds: ['s3'], role: 'distractor_evidence' },
  ],
}

describe('buildSentenceEvidenceMap', () => {
  it('maps correct and distractor evidence to sentence ids', () => {
    expect(buildSentenceEvidenceMap(question)).toEqual({
      s1: 'correct',
      s2: 'distractor',
      s3: 'distractor',
    })
  })
})

const trainingSet: TrainingSet = {
  id: 'set1',
  articleId: 'article1',
  examProfile: 'kaoyan',
  questionCount: 1,
  questions: [question],
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.000Z',
}

describe('KaoyanTrainingPanel', () => {
  it('lets the user answer and reveal explanation', async () => {
    const user = userEvent.setup()
    const onActiveQuestionChange = vi.fn()

    render(
      <KaoyanTrainingPanel
        isGenerating={false}
        trainingSet={trainingSet}
        onGenerate={vi.fn()}
        onActiveQuestionChange={onActiveQuestionChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: /A/ }))
    await user.click(screen.getByRole('button', { name: '查看解析' }))

    expect(screen.getByText('回答正确')).toBeInTheDocument()
    expect(screen.getByText(/定位第 1 句/)).toBeInTheDocument()
    expect(onActiveQuestionChange).toHaveBeenCalledWith(question)
  })
})

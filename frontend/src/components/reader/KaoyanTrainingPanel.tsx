import { useState } from 'react'
import type { TrainingQuestion, TrainingSet } from '../../types/training'

export type TrainingEvidenceSentence = {
  id: string
  text: string
  translation: string
}

type KaoyanTrainingPanelProps = {
  trainingSet: TrainingSet | null
  isGenerating: boolean
  error?: string
  evidenceSentences?: TrainingEvidenceSentence[]
  onGenerate: () => void
  onActiveQuestionChange: (question: TrainingQuestion | null) => void
}

export function KaoyanTrainingPanel({
  trainingSet,
  isGenerating,
  error,
  evidenceSentences = [],
  onGenerate,
  onActiveQuestionChange,
}: KaoyanTrainingPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [openExplanationId, setOpenExplanationId] = useState<string | null>(null)

  return (
    <section className="mt-12 border-t border-gray-100 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium text-gray-950">考研阅读训练</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">根据本文生成考研风格阅读题，解析会回到原文证据。</p>
        </div>
        <button
          className="rounded-md bg-gray-950 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          disabled={isGenerating}
          onClick={onGenerate}
          type="button"
        >
          {isGenerating ? '正在生成...' : trainingSet ? '重新生成' : '生成考研训练题'}
        </button>
      </div>

      {error ? <p className="mt-4 rounded-md border border-red-100 bg-white px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {trainingSet ? (
        <div className="mt-6 space-y-5">
          {trainingSet.questions.map((question) => {
            const selected = answers[question.id]
            const isOpen = openExplanationId === question.id
            return (
              <article className="rounded-lg border border-gray-200 bg-white p-5" key={question.id}>
                <p className="text-xs text-gray-500">
                  第 {question.order} 题 · {question.questionType}
                </p>
                <h3 className="mt-2 text-base font-medium leading-7 text-gray-950">{question.stem}</h3>
                <div className="mt-4 grid gap-2">
                  {question.options.map((option) => (
                    <button
                      className={`rounded-md border px-3 py-2 text-left text-sm leading-6 transition-colors ${
                        selected === option.label
                          ? 'border-gray-900 bg-gray-50 text-gray-950'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                      key={option.label}
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.label }))}
                      type="button"
                    >
                      {option.label}. {option.text}
                    </button>
                  ))}
                </div>
                {selected ? (
                  <p className={`mt-3 text-sm ${selected === question.answer ? 'text-teal-700' : 'text-red-700'}`}>
                    {selected === question.answer ? '回答正确' : `回答错误，正确答案是 ${question.answer}`}
                  </p>
                ) : null}
                <button
                  className="mt-4 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:border-gray-300 hover:text-gray-900"
                  onClick={() => {
                    const nextOpen = isOpen ? null : question.id
                    setOpenExplanationId(nextOpen)
                    onActiveQuestionChange(nextOpen ? question : null)
                  }}
                  type="button"
                >
                  {isOpen ? '收起解析' : '查看解析'}
                </button>
                {isOpen ? (
                  <div className="mt-4 rounded-md bg-gray-50 p-4 text-sm leading-7 text-gray-700">
                    <p>{question.explanation}</p>
                    <div className="mt-3 space-y-1">
                      {Object.entries(question.trapAnalysis).map(([label, text]) => (
                        <p key={label}>
                          {label}：{text}
                        </p>
                      ))}
                    </div>
                    {evidenceSentences.length ? (
                      <div className="mt-4 border-t border-gray-200 pt-3">
                        <p className="text-xs font-medium text-gray-500">原文证据</p>
                        <div className="mt-2 space-y-3">
                          {evidenceSentences.map((sentence) => (
                            <div key={sentence.id}>
                              <p className="text-gray-900">{sentence.text}</p>
                              <p className="mt-1 text-gray-500">{sentence.translation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

import { useState } from 'react'
import { useFavoriteStore } from '../../stores/favoriteStore'
import type { SelectedExplanation } from '../../types/article'

type ExplanationPanelProps = {
  articleId: string
  selection: SelectedExplanation
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function selectionId(selection: NonNullable<SelectedExplanation>) {
  if (selection.type === 'word') {
    return selection.data.word || selection.data.lemma || selection.data.meaningInSentence || 'word'
  }

  return selection.data.id
}

export function ExplanationPanel({ articleId, selection }: ExplanationPanelProps) {
  const [isSaving, setIsSaving] = useState(false)
  const addFavorite = useFavoriteStore((state) => state.addFavorite)
  const favoriteFor = useFavoriteStore((state) => state.favoriteFor)

  if (!selection) {
    return (
      <aside className="reader-explanation reader-explanation-empty">
        点击文章中的词组、单词或长句，这里会显示解释。
      </aside>
    )
  }

  const itemId = selectionId(selection)
  const saved = Boolean(favoriteFor(articleId, selection.type, itemId))
  const phraseCollocations = selection.type === 'phrase' ? stringList(selection.data.collocations) : []
  const wordCommonMeanings = selection.type === 'word' ? stringList(selection.data.commonMeanings) : []

  return (
    <aside className="reader-explanation">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-medium leading-6 text-gray-900">
          {selection.type === 'phrase' ? selection.data.text : null}
          {selection.type === 'word' ? selection.data.word || selection.data.lemma || '单词解释' : null}
          {selection.type === 'sentence' ? '长句拆解' : null}
        </h2>
        <button
          className="rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-default disabled:opacity-60"
          disabled={saved || isSaving}
          onClick={async () => {
            setIsSaving(true)
            try {
              await addFavorite({
                articleId,
                itemType: selection.type,
                itemId,
                snapshot: selection.data,
              })
            } finally {
              setIsSaving(false)
            }
          }}
          type="button"
        >
          {saved ? '已收藏' : isSaving ? '收藏中...' : '收藏'}
        </button>
      </div>
      {selection.type === 'phrase' ? (
        <div className="mt-4 space-y-3 text-sm leading-7 text-gray-700">
          <p>本句义：{selection.data.meaningInSentence}</p>
          {selection.data.commonMeaning ? <p>常见义：{selection.data.commonMeaning}</p> : null}
          {selection.data.whyImportant ? <p>为什么重要：{selection.data.whyImportant}</p> : null}
          {phraseCollocations.length ? <p>搭配：{phraseCollocations.join('；')}</p> : null}
        </div>
      ) : null}
      {selection.type === 'word' ? (
        <div className="mt-4 space-y-3 text-sm leading-7 text-gray-700">
          <p>本句义：{selection.data.meaningInSentence}</p>
          {wordCommonMeanings.length ? <p>常见义：{wordCommonMeanings.join('；')}</p> : null}
          {selection.data.note ? <p>提示：{selection.data.note}</p> : null}
        </div>
      ) : null}
      {selection.type === 'sentence' && selection.data.breakdown ? (
        <div className="mt-4 space-y-3 text-sm leading-7 text-gray-700">
          <p>主干：{selection.data.breakdown.mainClause}</p>
          <p>逻辑：{selection.data.breakdown.logic}</p>
          <p>理解提示：{selection.data.breakdown.explanation}</p>
        </div>
      ) : null}
    </aside>
  )
}

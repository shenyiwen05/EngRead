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

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
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
  const phraseMeaning = selection.type === 'phrase' ? textValue(selection.data.meaningInSentence) : ''
  const phraseCommonMeaning = selection.type === 'phrase' ? textValue(selection.data.commonMeaning) : ''
  const phraseWhyImportant = selection.type === 'phrase' ? textValue(selection.data.whyImportant) : ''
  const sentenceBreakdown = selection.type === 'sentence' ? selection.data.breakdown : null
  const sentenceMainClause = textValue(sentenceBreakdown?.mainClause)
  const sentenceModifiers = sentenceBreakdown ? stringList(sentenceBreakdown.modifiers) : []
  const sentenceLogic = textValue(sentenceBreakdown?.logic)
  const sentenceExplanation = textValue(sentenceBreakdown?.explanation)

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
          {phraseMeaning ? <p>本句义：{phraseMeaning}</p> : null}
          {phraseCommonMeaning ? <p>常见义：{phraseCommonMeaning}</p> : null}
          {phraseWhyImportant ? <p>为什么重要：{phraseWhyImportant}</p> : null}
          {phraseCollocations.length ? <p>搭配：{phraseCollocations.join('；')}</p> : null}
          {!phraseMeaning && !phraseCommonMeaning && !phraseWhyImportant && !phraseCollocations.length ? <p>释义暂未生成。</p> : null}
        </div>
      ) : null}
      {selection.type === 'word' ? (
        <div className="mt-4 space-y-3 text-sm leading-7 text-gray-700">
          <p>本句义：{selection.data.meaningInSentence}</p>
          {wordCommonMeanings.length ? <p>常见义：{wordCommonMeanings.join('；')}</p> : null}
          {selection.data.note ? <p>提示：{selection.data.note}</p> : null}
        </div>
      ) : null}
      {selection.type === 'sentence' && sentenceBreakdown ? (
        <div className="mt-4 space-y-3 text-sm leading-7 text-gray-700">
          {sentenceMainClause ? <p>主干：{sentenceMainClause}</p> : null}
          {sentenceModifiers.length ? <p>修饰信息：{sentenceModifiers.join('；')}</p> : null}
          {sentenceLogic ? <p>句子逻辑：{sentenceLogic}</p> : null}
          {sentenceExplanation ? <p>阅读提示：{sentenceExplanation}</p> : null}
        </div>
      ) : null}
    </aside>
  )
}

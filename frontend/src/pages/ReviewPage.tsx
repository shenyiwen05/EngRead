import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { getArticle } from '../services/articleService'
import type { Article } from '../types/article'

export function ReviewPage() {
  const { articleId } = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!articleId) {
      return
    }

    getArticle(articleId)
      .then(setArticle)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : '复盘加载失败'))
  }, [articleId])

  if (error) {
    return (
      <AppLayout>
        <p className="rounded-lg border border-red-100 bg-white p-5 text-red-700">{error}</p>
      </AppLayout>
    )
  }

  if (!article) {
    return (
      <AppLayout>
        <p className="text-gray-500">正在加载复盘...</p>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-medium text-gray-950">本文复盘</h1>
        <Link className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900" to={`/reader/${article.id}`}>
          返回阅读
        </Link>
      </div>
      <p className="mt-6 rounded-lg border border-gray-200 bg-white p-5 leading-7 text-gray-700">{article.review.summary}</p>
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="font-medium text-gray-900">重点词组</h2>
          {article.review.keyPhrases.map((phrase) => (
            <p className="mt-3 text-sm leading-6 text-gray-700" key={phrase.id}>
              {phrase.text}：{phrase.meaningInSentence}
            </p>
          ))}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="font-medium text-gray-900">熟词生义</h2>
          {article.review.familiarButShiftedWords.map((word) => (
            <p className="mt-3 text-sm leading-6 text-gray-700" key={word.word}>
              {word.word}：{word.meaningInSentence}
            </p>
          ))}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="font-medium text-gray-900">长句</h2>
          {article.review.longSentences.map((sentence) => (
            <p className="mt-3 text-sm leading-6 text-gray-700" key={sentence.sentenceId}>
              {sentence.reason}
            </p>
          ))}
        </div>
      </section>
    </AppLayout>
  )
}

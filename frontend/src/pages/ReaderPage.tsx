import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { ReaderLayout } from '../components/reader/ReaderLayout'
import { getAnalysisStatus, getArticle } from '../services/articleService'
import { useFavoriteStore } from '../stores/favoriteStore'
import type { Article, SelectedExplanation } from '../types/article'

export function ReaderPage() {
  const { articleId } = useParams()
  const [selection, setSelection] = useState<SelectedExplanation>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const loadFavorites = useFavoriteStore((state) => state.loadFavorites)

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  useEffect(() => {
    if (!articleId) {
      return
    }

    getArticle(articleId)
      .then((loadedArticle) => {
        setArticle(loadedArticle)
        setNotice('')
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : '文章加载失败'))
  }, [articleId])

  useEffect(() => {
    if (!articleId || article?.analysisStatus !== 'analyzing') {
      return undefined
    }

    let isMounted = true
    const timer = window.setInterval(async () => {
      try {
        const status = await getAnalysisStatus(articleId)
        if (!isMounted) {
          return
        }

        if (status.status === 'ready') {
          const refreshedArticle = await getArticle(articleId)
          if (!isMounted) {
            return
          }
          setArticle(refreshedArticle)
          setSelection(null)
          setNotice('分析完成，解释已更新。')
          return
        }

        if (status.status === 'failed') {
          setArticle((current) =>
            current
              ? {
                  ...current,
                  analysisStatus: 'failed',
                  analysisErrorMessage: status.errorMessage ?? '文章分析失败，请稍后重试',
                }
              : current,
          )
        }
      } catch {
        // Keep the draft readable if a transient status request fails.
      }
    }, 2000)

    return () => {
      isMounted = false
      window.clearInterval(timer)
    }
  }, [articleId, article?.analysisStatus])

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
        <p className="text-gray-500">正在加载文章...</p>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="max-w-3xl">
          <p className="text-xs uppercase text-gray-500">
            {article.topic} · {article.difficulty}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal leading-tight text-gray-950">{article.title}</h1>
        </div>
        <Link className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900" to={`/review/${article.id}`}>
          本文复盘
        </Link>
      </div>
      {article.analysisStatus === 'analyzing' ? (
        <p className="mb-4 rounded-md border border-teal-100 bg-white px-4 py-3 text-sm text-teal-800">
          AI 正在分析这篇文章。你可以先阅读英文，翻译、词组和长句拆解稍后自动出现。
        </p>
      ) : null}
      {article.analysisStatus === 'failed' ? (
        <p className="mb-4 rounded-md border border-amber-100 bg-white px-4 py-3 text-sm text-amber-900">
          {article.analysisErrorMessage || '文章分析失败，请稍后重试'}。你仍然可以先阅读英文原文。
        </p>
      ) : null}
      {notice ? <p className="mb-4 rounded-md border border-teal-100 bg-white px-4 py-3 text-sm text-teal-800">{notice}</p> : null}
      <ReaderLayout article={article} selection={selection} onSelect={setSelection} />
    </AppLayout>
  )
}

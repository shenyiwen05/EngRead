import { useEffect, useMemo, useState } from 'react'
import { ArticleList } from '../components/article/ArticleList'
import { AppLayout } from '../components/layout/AppLayout'
import { listArticles } from '../services/articleService'
import { useFavoriteStore } from '../stores/favoriteStore'
import type { Article } from '../types/article'

const filters = ['全部', '我的导入', '系统示例', '收藏过的'] as const
const sortLabels = ['最近阅读', '最近创建', '标题'] as const

export function ArticleListPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('全部')
  const [sortLabel, setSortLabel] = useState<(typeof sortLabels)[number]>('最近阅读')
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [error, setError] = useState('')
  const favorites = useFavoriteStore((state) => state.favorites)
  const loadFavorites = useFavoriteStore((state) => state.loadFavorites)

  useEffect(() => {
    listArticles()
      .then(setAllArticles)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : '文章加载失败'))
  }, [])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  const articles = useMemo(() => {
    const favoritedArticleIds = new Set(favorites.map((favorite) => favorite.articleId))
    const filtered = allArticles.filter((article) => {
      if (filter === '系统示例') {
        return article.sourceType === 'sample'
      }

      if (filter === '我的导入') {
        return article.sourceType === 'user_imported'
      }

      if (filter === '收藏过的') {
        return favoritedArticleIds.has(article.id)
      }

      return true
    })

    return [...filtered].sort((left, right) => {
      if (sortLabel === '标题') {
        return left.title.localeCompare(right.title)
      }

      const leftDate = sortLabel === '最近阅读' ? left.lastReadAt ?? left.updatedAt : left.createdAt
      const rightDate = sortLabel === '最近阅读' ? right.lastReadAt ?? right.updatedAt : right.createdAt
      return rightDate.localeCompare(leftDate)
    })
  }, [allArticles, favorites, filter, sortLabel])

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-medium text-gray-950">我的文章</h1>
        <select className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors hover:border-gray-300 focus:border-gray-400" value={sortLabel} onChange={(event) => setSortLabel(event.target.value as (typeof sortLabels)[number])}>
          {sortLabels.map((label) => (
            <option key={label}>{label}</option>
          ))}
        </select>
      </div>
      <div className="my-6 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            className={`rounded-md border px-3 py-2 text-sm transition-colors ${
              filter === item ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
            key={item}
            onClick={() => setFilter(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      {error ? <p className="mb-4 rounded-lg border border-red-100 bg-white p-5 text-red-700">{error}</p> : null}
      <ArticleList articles={articles} />
    </AppLayout>
  )
}

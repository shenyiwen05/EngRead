import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArticleList } from '../components/article/ArticleList'
import { AppLayout } from '../components/layout/AppLayout'
import { listArticles } from '../services/articleService'
import type { Article } from '../types/article'

export function DashboardPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    listArticles()
      .then(setArticles)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : '文章加载失败'))
  }, [])

  const recentArticles = [...articles]
    .filter((article) => article.lastReadAt)
    .sort((left, right) => (right.lastReadAt ?? '').localeCompare(left.lastReadAt ?? ''))
    .slice(0, 3)

  return (
    <AppLayout>
      <section className="grid gap-8 md:grid-cols-[1.25fr_0.75fr] md:items-end">
        <div>
          <p className="text-sm text-gray-500">外刊语境阅读器</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-medium leading-tight text-gray-950">先读英文，再按需打开中文辅助。</h1>
          <p className="mt-3 max-w-2xl text-gray-600">点击句子看翻译，点击词组或熟词生义看语境解释。</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="font-medium text-gray-900">导入文章</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">粘贴你有权使用的英文文章，生成适合精读的语境辅助。</p>
          <Link className="mt-4 inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700" to="/import">
            去导入
          </Link>
        </div>
      </section>
      <section className="mt-12">
        <h2 className="mb-4 text-xl font-medium text-gray-900">系统示例文章</h2>
        {error ? <p className="rounded-lg border border-red-100 bg-white p-5 text-red-700">{error}</p> : null}
        <ArticleList articles={articles.filter((article) => article.sourceType === 'sample')} />
      </section>
      <section className="mt-12">
        <h2 className="mb-3 text-xl font-medium text-gray-900">最近阅读</h2>
        {recentArticles.length ? (
          <ArticleList articles={recentArticles} />
        ) : (
          <p className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-500">打开文章后，这里会成为你的阅读入口。</p>
        )}
      </section>
    </AppLayout>
  )
}

import type { Article } from '../../types/article'
import { ArticleCard } from './ArticleCard'

type ArticleListProps = {
  articles: Article[]
}

export function ArticleList({ articles }: ArticleListProps) {
  if (articles.length === 0) {
    return <p className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-500">暂无文章。</p>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  )
}

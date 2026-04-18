import { Link } from 'react-router-dom'
import type { Article } from '../../types/article'

type ArticleCardProps = {
  article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="group rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>{article.sourceType === 'sample' ? '系统示例' : '我的导入'}</span>
        <span className="text-gray-300">·</span>
        <span>{article.topic}</span>
        <span className="text-gray-300">·</span>
        <span>{article.difficulty}</span>
        <span className="text-gray-300">·</span>
        <span>{article.estimatedReadingMinutes} 分钟</span>
      </div>
      <h2 className="mt-3 text-base font-medium leading-snug text-gray-900">{article.title}</h2>
      <p className="mt-2 text-sm text-gray-500">创建于 {new Date(article.createdAt).toLocaleDateString()}</p>
      <Link
        to={`/reader/${article.id}`}
        className="mt-4 inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
      >
        开始阅读
      </Link>
    </article>
  )
}

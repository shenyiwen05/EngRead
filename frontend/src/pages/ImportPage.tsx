import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { analyzeArticle } from '../services/articleService'

const loadingMessages = [
  '正在拆分句子...',
  '正在识别词组...',
  '正在分析熟词生义...',
  '正在生成翻译...',
  '正在整理长句拆解...',
]

function countEnglishWords(text: string) {
  return text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length ?? 0
}

export function ImportPage() {
  const [title, setTitle] = useState('')
  const [articleText, setArticleText] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const navigate = useNavigate()
  const wordCount = useMemo(() => countEnglishWords(articleText), [articleText])

  useEffect(() => {
    if (!isSubmitting) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setLoadingMessageIndex((current) => (current + 1) % loadingMessages.length)
    }, 1600)

    return () => window.clearInterval(timer)
  }, [isSubmitting])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    if (wordCount < 80) {
      setMessage('文章少于 80 个英文词，暂不开始分析。')
      return
    }

    if (wordCount > 2500) {
      setMessage('文章超过 2500 个英文词，请先缩短。')
      return
    }

    setMessage('')
    setLoadingMessageIndex(0)
    setIsSubmitting(true)
    try {
      const response = await analyzeArticle({
        title: title.trim() || undefined,
        rawText: articleText.trim(),
      })
      navigate(`/reader/${response.articleId}`)
    } catch {
      setMessage('文章分析失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-gray-950">导入文章</h1>
      </div>
      <form className="max-w-[900px] space-y-6" onSubmit={handleSubmit}>
        <label className="block text-sm text-gray-700">
          标题（可选）
          <input className="mt-2 w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="block text-sm text-gray-700">
          英文文章
          <textarea className="mt-2 min-h-96 w-full resize-none rounded-md border border-gray-200 bg-white px-4 py-3 leading-7 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400" value={articleText} onChange={(event) => setArticleText(event.target.value)} />
        </label>
        <p className="text-sm text-gray-500">当前约 {wordCount} 个英文词。请只导入你有权使用的原创、公开授权或公共领域内容。</p>
        {isSubmitting ? <p className="rounded-md border border-teal-100 bg-white px-4 py-3 text-sm text-teal-800">{loadingMessages[loadingMessageIndex]}</p> : null}
        {!isSubmitting && message ? <p className="rounded-md border border-teal-100 bg-white px-4 py-3 text-sm text-teal-800">{message}</p> : null}
        <div className="flex gap-3">
          <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300" disabled={isSubmitting} type="submit">
            {isSubmitting ? '分析中...' : '开始分析'}
          </button>
          <button className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400" disabled={isSubmitting} onClick={() => setArticleText('')} type="button">
            清空
          </button>
        </div>
      </form>
    </AppLayout>
  )
}

import { mockArticles } from '../mock/mockArticle'
import type { Article, ArticleAnalysisStatusResponse } from '../types/article'
import { apiRequest } from './api'

type ArticleListResponse = {
  items: Article[]
}

type ArticleDetailResponse = {
  article: Article
}

type ArticleAnalyzeResponse = {
  articleId: string
  status: ArticleAnalysisStatusResponse['status']
}

type AnalyzeArticleInput = {
  title?: string
  rawText: string
}

const emptyReview = {
  keyPhrases: [],
  familiarButShiftedWords: [],
  longSentences: [],
  summary: '',
}

function normalizeListItem(article: Article): Article {
  return {
    ...article,
    paragraphs: article.paragraphs ?? [],
    review: article.review ?? emptyReview,
  }
}

function useMockFallback() {
  return import.meta.env.VITE_USE_MOCK_ARTICLES === 'true'
}

export async function listArticles(sourceType = 'all') {
  if (useMockFallback()) {
    return mockArticles
  }

  const response = await apiRequest<ArticleListResponse>(`/api/articles?sourceType=${sourceType}`)
  return response.items.map(normalizeListItem)
}

export async function getArticle(articleId: string) {
  if (useMockFallback()) {
    return mockArticles.find((item) => item.id === articleId) ?? mockArticles[0]
  }

  const response = await apiRequest<ArticleDetailResponse>(`/api/articles/${articleId}`)
  return response.article
}

export async function analyzeArticle(input: AnalyzeArticleInput) {
  return apiRequest<ArticleAnalyzeResponse>('/api/articles/analyze', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      rawText: input.rawText,
    }),
  })
}

export async function getAnalysisStatus(articleId: string) {
  return apiRequest<ArticleAnalysisStatusResponse>(`/api/articles/${articleId}/analysis-status`)
}

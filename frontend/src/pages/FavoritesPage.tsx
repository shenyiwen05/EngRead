import { useMemo, useState } from 'react'
import { useEffect } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { useFavoriteStore } from '../stores/favoriteStore'
import type { Favorite, FavoriteItemType } from '../types/favorite'

const filters = ['全部', '词组', '熟词生义', '长句'] as const

function itemTitle(favorite: Favorite) {
  const snapshot = favorite.snapshot
  if (typeof snapshot === 'object' && snapshot && 'text' in snapshot && typeof snapshot.text === 'string') {
    return snapshot.text
  }

  if (typeof snapshot === 'object' && snapshot && 'word' in snapshot && typeof snapshot.word === 'string') {
    return snapshot.word
  }

  return '收藏'
}

function itemMeaning(favorite: Favorite) {
  const snapshot = favorite.snapshot
  if (typeof snapshot === 'object' && snapshot && 'meaningInSentence' in snapshot && typeof snapshot.meaningInSentence === 'string') {
    return snapshot.meaningInSentence
  }

  if (typeof snapshot === 'object' && snapshot && 'breakdown' in snapshot && snapshot.breakdown && typeof snapshot.breakdown === 'object' && 'explanation' in snapshot.breakdown && typeof snapshot.breakdown.explanation === 'string') {
    return snapshot.breakdown.explanation
  }

  return '已收藏的学习内容'
}

function itemTypeLabel(itemType: FavoriteItemType) {
  if (itemType === 'phrase') {
    return '词组'
  }

  if (itemType === 'word') {
    return '熟词生义'
  }

  return '长句'
}

function filterToType(filter: (typeof filters)[number]): FavoriteItemType | 'all' {
  if (filter === '词组') {
    return 'phrase'
  }

  if (filter === '熟词生义') {
    return 'word'
  }

  if (filter === '长句') {
    return 'sentence'
  }

  return 'all'
}

export function FavoritesPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('全部')
  const favorites = useFavoriteStore((state) => state.favorites)
  const isLoading = useFavoriteStore((state) => state.isLoading)
  const error = useFavoriteStore((state) => state.error)
  const loadFavorites = useFavoriteStore((state) => state.loadFavorites)
  const removeFavorite = useFavoriteStore((state) => state.removeFavorite)

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  const visibleFavorites = useMemo(() => {
    const itemType = filterToType(filter)
    return itemType === 'all' ? favorites : favorites.filter((favorite) => favorite.itemType === itemType)
  }, [favorites, filter])

  return (
    <AppLayout>
      <h1 className="text-3xl font-medium text-gray-950">收藏</h1>
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
      {isLoading ? <p className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-500">正在加载收藏...</p> : null}
      {error ? <p className="rounded-lg border border-red-100 bg-white p-5 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleFavorites.map((favorite) => (
          <article className="rounded-lg border border-gray-200 bg-white p-5" key={favorite.id}>
            <p className="text-xs text-gray-500">{itemTypeLabel(favorite.itemType)}</p>
            <h2 className="mt-2 font-medium text-gray-900">{itemTitle(favorite)}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{itemMeaning(favorite)}</p>
            <p className="mt-3 text-xs text-gray-500">来源文章：{favorite.articleTitle}</p>
            <p className="mt-1 text-xs text-gray-500">收藏时间：{new Date(favorite.createdAt).toLocaleDateString()}</p>
            <button
              className="mt-4 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
              onClick={() => removeFavorite(favorite.id)}
              type="button"
            >
              取消收藏
            </button>
          </article>
        ))}
      </div>
      {!isLoading && visibleFavorites.length === 0 ? <p className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-500">还没有收藏。</p> : null}
    </AppLayout>
  )
}

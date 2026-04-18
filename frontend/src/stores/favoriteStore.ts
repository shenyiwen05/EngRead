import { create } from 'zustand'
import * as favoriteService from '../services/favoriteService'
import type { Favorite, FavoriteCreateInput, FavoriteItemType } from '../types/favorite'

type FavoriteStore = {
  favorites: Favorite[]
  isLoading: boolean
  error: string
  loadFavorites: (itemType?: FavoriteItemType | 'all') => Promise<void>
  addFavorite: (input: FavoriteCreateInput) => Promise<void>
  removeFavorite: (favoriteId: string) => Promise<void>
  favoriteFor: (articleId: string, itemType: FavoriteItemType, itemId: string) => Favorite | undefined
  favoriteArticleIds: () => Set<string>
}

export const useFavoriteStore = create<FavoriteStore>((set, get) => ({
  favorites: [],
  isLoading: false,
  error: '',
  loadFavorites: async (itemType = 'all') => {
    set({ isLoading: true, error: '' })
    try {
      const favorites = await favoriteService.listFavorites(itemType)
      set({ favorites, isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : '收藏加载失败' })
    }
  },
  addFavorite: async (input) => {
    const existing = get().favoriteFor(input.articleId, input.itemType, input.itemId)
    if (existing) {
      return
    }

    const favorite = await favoriteService.createFavorite(input)
    set({ favorites: [favorite, ...get().favorites] })
  },
  removeFavorite: async (favoriteId) => {
    await favoriteService.deleteFavorite(favoriteId)
    set({ favorites: get().favorites.filter((favorite) => favorite.id !== favoriteId) })
  },
  favoriteFor: (articleId, itemType, itemId) =>
    get().favorites.find(
      (favorite) => favorite.articleId === articleId && favorite.itemType === itemType && favorite.itemId === itemId,
    ),
  favoriteArticleIds: () => new Set(get().favorites.map((favorite) => favorite.articleId)),
}))

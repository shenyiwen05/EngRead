import type { Phrase, Sentence, WordExplanation } from './article'

export type FavoriteItemType = 'word' | 'phrase' | 'sentence'

export type FavoriteSnapshot = Phrase | WordExplanation | Sentence

export type Favorite = {
  id: string
  articleId: string
  articleTitle: string
  itemType: FavoriteItemType
  itemId: string
  snapshot: FavoriteSnapshot
  createdAt: string
}

export type FavoriteListResponse = {
  items: Favorite[]
}

export type FavoriteCreateInput = {
  articleId: string
  itemType: FavoriteItemType
  itemId: string
  snapshot: FavoriteSnapshot
}

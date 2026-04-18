import type { Favorite, FavoriteCreateInput, FavoriteItemType, FavoriteListResponse } from '../types/favorite'
import { apiRequest } from './api'

export async function listFavorites(itemType: FavoriteItemType | 'all' = 'all') {
  const response = await apiRequest<FavoriteListResponse>(`/api/favorites?itemType=${itemType}`)
  return response.items
}

export async function createFavorite(input: FavoriteCreateInput) {
  return apiRequest<Favorite>('/api/favorites', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function deleteFavorite(favoriteId: string) {
  return apiRequest<{ ok: true }>(`/api/favorites/${favoriteId}`, {
    method: 'DELETE',
  })
}

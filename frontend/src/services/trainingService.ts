import type { TrainingSet } from '../types/training'
import { apiRequest } from './api'

export async function generateKaoyanTraining(articleId: string, forceRegenerate = false) {
  return apiRequest<TrainingSet>(`/api/articles/${articleId}/training/kaoyan`, {
    method: 'POST',
    body: JSON.stringify({ forceRegenerate }),
  })
}

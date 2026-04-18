export type Article = {
  id: string
  ownerId: string | null
  title: string
  sourceType: 'sample' | 'user_imported'
  analysisStatus?: ArticleAnalysisStatus
  analysisErrorMessage?: string | null
  topic?: string
  difficulty?: string
  estimatedReadingMinutes?: number
  createdAt: string
  updatedAt: string
  lastReadAt?: string
  paragraphs: Paragraph[]
  review: ArticleReview
}

export type ArticleAnalysisStatus = 'analyzing' | 'ready' | 'failed'

export type ArticleAnalysisStatusResponse = {
  articleId: string
  status: ArticleAnalysisStatus
  errorMessage?: string | null
}

export type Paragraph = {
  id: string
  order: number
  originalText: string
  sentences: Sentence[]
}

export type Sentence = {
  id: string
  order: number
  text: string
  translation: string
  isLongSentence: boolean
  breakdown?: SentenceBreakdown
  tokens: Token[]
  phrases: Phrase[]
}

export type Token = {
  id: string
  text: string
  lemma?: string
  start: number
  end: number
  phraseId?: string
  isClickable: boolean
  isFamiliarButShifted?: boolean
  explanation?: WordExplanation
}

export type Phrase = {
  id: string
  text: string
  start: number
  end: number
  type: 'collocation' | 'phrasal_verb' | 'idiom' | 'academic_expression'
  meaningInSentence: string
  commonMeaning?: string
  whyImportant?: string
  collocations?: string[]
  sentenceTranslation?: string
}

export type WordExplanation = {
  word: string
  lemma?: string
  meaningInSentence: string
  commonMeanings: string[]
  isFamiliarButShifted?: boolean
  note?: string
  collocations?: string[]
}

export type SentenceBreakdown = {
  mainClause: string
  modifiers: string[]
  logic: string
  explanation: string
}

export type ArticleReview = {
  keyPhrases: Phrase[]
  familiarButShiftedWords: WordExplanation[]
  longSentences: { sentenceId: string; text: string; reason: string }[]
  summary: string
}

export type SelectedExplanation =
  | { type: 'word'; data: WordExplanation }
  | { type: 'phrase'; data: Phrase }
  | { type: 'sentence'; data: Sentence }
  | null

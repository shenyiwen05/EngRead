export type ExamProfile = 'kaoyan'

export type QuestionType = 'detail' | 'inference' | 'main_idea' | 'attitude' | 'vocabulary_in_context'

export type TrainingOptionRole = 'correct_evidence' | 'distractor_evidence' | 'unsupported'

export type TrainingOption = {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
  sourceSentenceIds: string[]
  role: TrainingOptionRole
}

export type TrainingQuestion = {
  id: string
  order: number
  questionType: QuestionType
  testedAbility: string
  stem: string
  options: TrainingOption[]
  answer: 'A' | 'B' | 'C' | 'D'
  sourceSentenceIds: string[]
  explanation: string
  trapAnalysis: Record<string, string>
}

export type TrainingSet = {
  id: string
  articleId: string
  examProfile: ExamProfile
  questionCount: number
  questions: TrainingQuestion[]
  createdAt: string
  updatedAt: string
}

export type SentenceEvidenceRole = 'correct' | 'distractor' | 'source'

export type SentenceEvidenceMap = Record<string, SentenceEvidenceRole>

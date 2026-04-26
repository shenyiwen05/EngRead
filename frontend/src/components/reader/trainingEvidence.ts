import type { SentenceEvidenceMap, TrainingQuestion } from '../../types/training'

export function buildSentenceEvidenceMap(question: TrainingQuestion | null): SentenceEvidenceMap {
  if (!question) {
    return {}
  }

  const evidence: SentenceEvidenceMap = {}
  for (const sentenceId of question.sourceSentenceIds) {
    evidence[sentenceId] = 'source'
  }

  for (const option of question.options) {
    for (const sentenceId of option.sourceSentenceIds) {
      if (option.role === 'correct_evidence') {
        evidence[sentenceId] = 'correct'
      } else if (option.role === 'distractor_evidence' && evidence[sentenceId] !== 'correct') {
        evidence[sentenceId] = 'distractor'
      }
    }
  }

  return evidence
}

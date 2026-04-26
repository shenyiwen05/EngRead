import type { Paragraph, SelectedExplanation } from '../../types/article'
import type { SentenceEvidenceMap } from '../../types/training'
import { SentenceBlock } from './SentenceBlock'

type ParagraphBlockProps = {
  paragraph: Paragraph
  onSelect: (selection: SelectedExplanation) => void
  sentenceEvidence?: SentenceEvidenceMap
}

export function ParagraphBlock({ paragraph, onSelect, sentenceEvidence = {} }: ParagraphBlockProps) {
  return (
    <section id={paragraph.id} className="reader-paragraph">
      {paragraph.sentences
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((sentence) => (
          <SentenceBlock
            evidenceRole={sentenceEvidence[sentence.id]}
            key={sentence.id}
            sentence={sentence}
            onSelect={onSelect}
          />
        ))}
    </section>
  )
}

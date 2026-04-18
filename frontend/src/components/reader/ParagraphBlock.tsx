import type { Paragraph, SelectedExplanation } from '../../types/article'
import { SentenceBlock } from './SentenceBlock'

type ParagraphBlockProps = {
  paragraph: Paragraph
  onSelect: (selection: SelectedExplanation) => void
}

export function ParagraphBlock({ paragraph, onSelect }: ParagraphBlockProps) {
  return (
    <section id={paragraph.id} className="reader-paragraph">
      {paragraph.sentences
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((sentence) => (
          <SentenceBlock key={sentence.id} sentence={sentence} onSelect={onSelect} />
        ))}
    </section>
  )
}

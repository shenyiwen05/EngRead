import type { Article, SelectedExplanation } from '../../types/article'
import { ExplanationPanel } from './ExplanationPanel'
import { ParagraphBlock } from './ParagraphBlock'

type ReaderLayoutProps = {
  article: Article
  selection: SelectedExplanation
  onSelect: (selection: SelectedExplanation) => void
}

export function ReaderLayout({ article, selection, onSelect }: ReaderLayoutProps) {
  return (
    <div
      className="grid gap-8 lg:grid-cols-[96px_minmax(0,760px)_360px] lg:items-start"
      data-testid="reader-layout"
    >
      <nav
        aria-label="段落导航"
        className="hidden text-xs text-gray-500 lg:sticky lg:top-24 lg:block"
        data-testid="paragraph-nav"
      >
        <p className="mb-4 text-[11px] uppercase text-gray-400">Paragraphs</p>
        <div className="flex flex-col items-start gap-3">
          {article.paragraphs.map((paragraph) => (
            <a
              className="grid h-8 w-8 place-items-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-gray-900 hover:text-white"
              href={`#${paragraph.id}`}
              key={paragraph.id}
            >
              {paragraph.order.toString().padStart(2, '0')}
            </a>
          ))}
        </div>
      </nav>
      <article className="reader-canvas max-w-[760px]" data-testid="reading-canvas">
        {article.paragraphs.map((paragraph) => (
          <ParagraphBlock key={paragraph.id} paragraph={paragraph} onSelect={onSelect} />
        ))}
      </article>
      <div
        className="reader-support-panel lg:sticky lg:top-24 lg:self-start"
        data-testid="explanation-rail"
      >
        <ExplanationPanel articleId={article.id} selection={selection} />
      </div>
    </div>
  )
}

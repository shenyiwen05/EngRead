import { useState } from 'react'
import type { SelectedExplanation, Sentence } from '../../types/article'
import { BreakdownPanel } from './BreakdownPanel'
import { TokenText } from './TokenText'

type SentenceBlockProps = {
  sentence: Sentence
  onSelect: (selection: SelectedExplanation) => void
}

export function SentenceBlock({ sentence, onSelect }: SentenceBlockProps) {
  const [showTranslation, setShowTranslation] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  return (
    <div className="reader-sentence-block">
      <div
        className="reader-sentence"
        data-testid={`sentence-${sentence.id}`}
        onClick={() => setShowTranslation((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setShowTranslation((current) => !current)
          }
        }}
        role="button"
        tabIndex={0}
      >
        <TokenText sentence={sentence} onSelect={onSelect} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        {sentence.isLongSentence ? <span className="reader-long-label">长句</span> : null}
        {sentence.breakdown ? (
          <button
            className="reader-breakdown-button"
            onClick={(event) => {
              event.stopPropagation()
              setShowBreakdown((current) => !current)
              onSelect({ type: 'sentence', data: sentence })
            }}
            type="button"
          >
            拆解
          </button>
        ) : null}
      </div>
      {showTranslation ? <p className="reader-translation">{sentence.translation}</p> : null}
      {showBreakdown && sentence.breakdown ? <BreakdownPanel breakdown={sentence.breakdown} /> : null}
    </div>
  )
}

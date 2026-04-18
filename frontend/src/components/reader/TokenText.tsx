import type { ReactNode } from 'react'
import type { SelectedExplanation, Sentence, Token } from '../../types/article'

type TokenTextProps = {
  sentence: Sentence
  onSelect: (selection: SelectedExplanation) => void
}

function selectToken(token: Token, sentence: Sentence): SelectedExplanation {
  if (token.phraseId) {
    const phrase = sentence.phrases.find((item) => item.id === token.phraseId)
    if (phrase) {
      return { type: 'phrase', data: phrase }
    }
  }

  if (token.explanation) {
    return {
      type: 'word',
      data: {
        ...token.explanation,
        word: token.explanation.word || token.text,
        commonMeanings: token.explanation.commonMeanings ?? [],
      },
    }
  }

  return null
}

function isSelectableToken(token: Token) {
  return token.isClickable || Boolean(token.phraseId || token.explanation)
}

function phraseClassName(token: Token, sentence: Sentence) {
  if (!token.phraseId) {
    return ''
  }

  const phraseTokens = sentence.tokens.filter((item) => item.phraseId === token.phraseId)
  const first = phraseTokens[0]?.id === token.id
  const last = phraseTokens[phraseTokens.length - 1]?.id === token.id

  return [
    'reader-token-phrase',
    first ? 'reader-token-phrase-start' : '',
    last ? 'reader-token-phrase-end' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function gapClassName(text: string, cursor: number, sentence: Sentence) {
  const isPhraseGap = sentence.phrases.some((phrase) => cursor >= phrase.start && cursor + text.length <= phrase.end)
  return isPhraseGap ? 'reader-token-phrase-gap' : ''
}

function repairTokenSpan(token: Token, sentenceText: string): Token {
  if (sentenceText.slice(token.start, token.end) === token.text) {
    return token
  }

  const first = sentenceText.indexOf(token.text)
  if (first === -1 || sentenceText.indexOf(token.text, first + 1) !== -1) {
    return token
  }

  return {
    ...token,
    start: first,
    end: first + token.text.length,
  }
}

export function TokenText({ sentence, onSelect }: TokenTextProps) {
  const orderedTokens = sentence.tokens
    .map((token) => repairTokenSpan(token, sentence.text))
    .sort((left, right) => left.start - right.start)
  const nodes: ReactNode[] = []
  let cursor = 0

  orderedTokens.forEach((token) => {
    if (token.start > cursor) {
      const gapText = sentence.text.slice(cursor, token.start)
      nodes.push(
        <span className={gapClassName(gapText, cursor, sentence)} key={`${token.id}-gap`}>
          {gapText}
        </span>,
      )
    }

    const tokenText = sentence.text.slice(token.start, token.end) || token.text
    if (isSelectableToken(token)) {
      const className = [
        'reader-token',
        phraseClassName(token, sentence),
        token.isFamiliarButShifted ? 'reader-token-shifted' : '',
      ]
        .filter(Boolean)
        .join(' ')

      nodes.push(
        <button
          aria-label={token.text}
          className={className}
          key={token.id}
          onClick={(event) => {
            event.stopPropagation()
            onSelect(selectToken(token, sentence))
          }}
          type="button"
        >
          {tokenText}
          {token.isFamiliarButShifted ? (
            <>
              <span aria-hidden="true" className="reader-shifted-dot" />
              <span className="sr-only">熟词生义</span>
            </>
          ) : null}
        </button>,
      )
    } else {
      nodes.push(<span key={token.id}>{tokenText}</span>)
    }

    cursor = token.end
  })

  if (cursor < sentence.text.length) {
    nodes.push(<span key="tail">{sentence.text.slice(cursor)}</span>)
  }

  return <>{nodes}</>
}

import type { SentenceBreakdown } from '../../types/article'

type BreakdownPanelProps = {
  breakdown: SentenceBreakdown
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function BreakdownPanel({ breakdown }: BreakdownPanelProps) {
  const modifiers = stringList(breakdown.modifiers)

  return (
    <div className="reader-breakdown-panel">
      <dl className="space-y-3">
        <div>
          <dt className="font-medium text-gray-900">mainClause</dt>
          <dd className="mt-1 text-gray-700">{textValue(breakdown.mainClause)}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-900">modifiers</dt>
          <dd className="mt-1 space-y-1 text-gray-700">
            {modifiers.map((modifier) => (
              <p key={modifier}>{modifier}</p>
            ))}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-gray-900">logic</dt>
          <dd className="mt-1 text-gray-700">{textValue(breakdown.logic)}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-900">explanation</dt>
          <dd className="mt-1 text-gray-700">{textValue(breakdown.explanation)}</dd>
        </div>
      </dl>
    </div>
  )
}

import type { SentenceBreakdown } from '../../types/article'

type BreakdownPanelProps = {
  breakdown: SentenceBreakdown
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function BreakdownPanel({ breakdown }: BreakdownPanelProps) {
  const modifiers = stringList(breakdown.modifiers)
  const mainClause = textValue(breakdown.mainClause)
  const logic = textValue(breakdown.logic)
  const explanation = textValue(breakdown.explanation)

  return (
    <div className="reader-breakdown-panel">
      <dl className="space-y-3">
        {mainClause ? (
          <div>
            <dt className="font-medium text-gray-900">主干</dt>
            <dd className="mt-1 text-gray-700">{mainClause}</dd>
          </div>
        ) : null}
        {modifiers.length ? (
          <div>
            <dt className="font-medium text-gray-900">修饰信息</dt>
            <dd className="mt-1 space-y-1 text-gray-700">
              {modifiers.map((modifier) => (
                <p key={modifier}>{modifier}</p>
              ))}
            </dd>
          </div>
        ) : null}
        {logic ? (
          <div>
            <dt className="font-medium text-gray-900">句子逻辑</dt>
            <dd className="mt-1 text-gray-700">{logic}</dd>
          </div>
        ) : null}
        {explanation ? (
          <div>
            <dt className="font-medium text-gray-900">阅读提示</dt>
            <dd className="mt-1 text-gray-700">{explanation}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}

import { getConfidenceColor, confidenceLabel } from '@/lib/utils'

interface ConfidenceBadgeProps {
  confidence: string
  size?: 'sm' | 'md'
}

export function ConfidenceBadge({ confidence, size = 'md' }: ConfidenceBadgeProps) {
  const colorClass = getConfidenceColor(confidence)
  const label = confidenceLabel(confidence)
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'

  return (
    <span
      className={`inline-flex items-center rounded font-medium ${colorClass} ${sizeClass}`}
    >
      {label}
    </span>
  )
}

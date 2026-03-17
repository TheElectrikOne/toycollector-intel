import { getTrustLevelColor, getSourceTypeColor } from '@/lib/utils'

interface SourceBadgeProps {
  sourceName: string
  sourceType: string
  trustLevel: number
  showTrust?: boolean
  size?: 'sm' | 'md'
}

export function SourceBadge({
  sourceName,
  sourceType,
  trustLevel,
  showTrust = true,
  size = 'md',
}: SourceBadgeProps) {
  const typeColor = getSourceTypeColor(sourceType)
  const trustColor = getTrustLevelColor(trustLevel)
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'

  const typeLabels: Record<string, string> = {
    official_brand: 'Official',
    official_retailer: 'Retailer',
    press: 'Press',
    community: 'Community',
    rumor: 'Rumor',
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center rounded font-medium ${typeColor} ${sizeClass}`}>
        {typeLabels[sourceType] || sourceType}
      </span>
      <span className="text-zinc-400 text-xs font-medium">{sourceName}</span>
      {showTrust && (
        <span className={`inline-flex items-center rounded font-mono font-bold ${trustColor} ${sizeClass}`}>
          T{trustLevel}
        </span>
      )}
    </span>
  )
}

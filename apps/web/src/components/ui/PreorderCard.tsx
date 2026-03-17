import { ConfidenceBadge } from './ConfidenceBadge'
import { formatPrice, timeAgo } from '@/lib/utils'
import type { PreorderAlert, Product } from '@/lib/db/schema'

interface PreorderCardProps {
  alert: PreorderAlert & { product?: Product | null }
}

const alertTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  now_live: { label: 'Preorder Now Live', icon: '🛒', color: 'border-green-700 bg-green-900/20' },
  closing_soon: { label: 'Closing Soon', icon: '⚠️', color: 'border-yellow-700 bg-yellow-900/20' },
  restocked: { label: 'Restocked', icon: '🔄', color: 'border-blue-700 bg-blue-900/20' },
  cancelled: { label: 'Cancelled', icon: '❌', color: 'border-red-700 bg-red-900/20' },
}

export function PreorderCard({ alert }: PreorderCardProps) {
  const config = alertTypeConfig[alert.alert_type] || alertTypeConfig.now_live

  return (
    <div className={`rounded-lg border p-4 ${config.color}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span>{config.icon}</span>
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            {config.label}
          </span>
        </div>
        <ConfidenceBadge confidence={alert.confidence || 'unverified'} size="sm" />
      </div>

      {alert.product && (
        <div className="mb-3">
          <h3 className="font-bold text-zinc-100 text-sm leading-snug">
            {alert.product.product_name}
          </h3>
          <p className="text-xs text-orange-400 mt-0.5">{alert.product.brand}</p>
        </div>
      )}

      <div className="space-y-1 text-xs text-zinc-400 mb-3">
        <div className="flex justify-between">
          <span>Retailer</span>
          <span className="text-zinc-300 font-medium">{alert.retailer}</span>
        </div>
        {alert.price && (
          <div className="flex justify-between">
            <span>Price</span>
            <span className="text-zinc-300 font-medium">{formatPrice(alert.price)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Region</span>
          <span className="text-zinc-300">{alert.region}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {alert.retailer_url ? (
          <a
            href={alert.retailer_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
          >
            Order at {alert.retailer} →
          </a>
        ) : (
          <span className="text-xs text-zinc-600">No link available</span>
        )}
        <span className="text-xs text-zinc-600">
          {alert.detected_at ? timeAgo(alert.detected_at) : ''}
        </span>
      </div>

      {alert.confidence === 'retailer_placeholder' && (
        <p className="text-xs text-blue-400 mt-2 border-t border-zinc-700 pt-2">
          Retailer listing — not yet confirmed by brand
        </p>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PreorderAlert, Product } from '@/lib/db/schema'
import { formatPrice } from '@/lib/utils'

interface AlertBannerProps {
  alerts: (PreorderAlert & { product?: Product | null })[]
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || alerts.length === 0) return null

  const topAlert = alerts[0]
  if (!topAlert) return null

  return (
    <div className="bg-orange-500 text-white">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-sm font-bold whitespace-nowrap">
            🛒 PREORDER ALERT
          </span>
          <span className="text-sm truncate">
            {topAlert.product?.product_name || 'New Product'} —{' '}
            {topAlert.retailer}
            {topAlert.price ? ` · ${formatPrice(topAlert.price)}` : ''}
          </span>
          {alerts.length > 1 && (
            <Link
              href="/preorders"
              className="text-xs font-semibold whitespace-nowrap bg-orange-600 hover:bg-orange-700 px-2 py-0.5 rounded transition-colors"
            >
              +{alerts.length - 1} more
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {topAlert.retailer_url && (
            <a
              href={topAlert.retailer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold bg-white text-orange-600 hover:bg-orange-50 px-3 py-1 rounded transition-colors"
            >
              Order Now
            </a>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="text-orange-200 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

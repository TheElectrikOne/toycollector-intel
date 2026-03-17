'use client'

import Link from 'next/link'
import { ConfidenceBadge } from '../ui/ConfidenceBadge'
import { SourceBadge } from '../ui/SourceBadge'
import { timeAgo } from '@/lib/utils'
import type { RawDetection, Source } from '@/lib/db/schema'

interface QueueItemProps {
  detection: RawDetection & { source?: Source | null }
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onHold: (id: string) => void
}

export function QueueItem({ detection, onApprove, onReject, onHold }: QueueItemProps) {
  const extractedData = detection.extracted_json as {
    product?: { product_name?: string; brand?: string }
    classification?: { confidence_label?: string; post_type?: string }
  } | null

  const productName = extractedData?.product?.product_name || 'Unknown Product'
  const brand = extractedData?.product?.brand || 'Unknown Brand'
  const confidence = extractedData?.classification?.confidence_label || 'unverified'
  const postType = extractedData?.classification?.post_type || '—'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <ConfidenceBadge confidence={confidence} size="sm" />
            <span className="text-xs text-zinc-500 font-medium uppercase">{postType}</span>
          </div>
          <h4 className="font-semibold text-zinc-100 text-sm mb-0.5 truncate">{productName}</h4>
          <p className="text-xs text-orange-400 mb-2">{brand}</p>
          {detection.source && (
            <div className="mb-2">
              <SourceBadge
                sourceName={detection.source.name}
                sourceType={detection.source.source_type}
                trustLevel={detection.source.trust_level}
                size="sm"
              />
            </div>
          )}
          <a
            href={detection.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-zinc-300 truncate block max-w-sm transition-colors"
          >
            {detection.source_url}
          </a>
          <p className="text-xs text-zinc-600 mt-1">
            Detected {detection.detected_at ? timeAgo(detection.detected_at) : '—'}
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => onApprove(detection.id)}
            className="text-xs px-3 py-1.5 bg-green-900 hover:bg-green-800 text-green-300 border border-green-700 rounded transition-colors font-medium"
          >
            Approve
          </button>
          <Link
            href={`/admin/queue/${detection.id}`}
            className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded transition-colors text-center font-medium"
          >
            Review
          </Link>
          <button
            onClick={() => onHold(detection.id)}
            className="text-xs px-3 py-1.5 bg-yellow-900 hover:bg-yellow-800 text-yellow-300 border border-yellow-700 rounded transition-colors font-medium"
          >
            Hold
          </button>
          <button
            onClick={() => onReject(detection.id)}
            className="text-xs px-3 py-1.5 bg-red-900 hover:bg-red-800 text-red-300 border border-red-700 rounded transition-colors font-medium"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

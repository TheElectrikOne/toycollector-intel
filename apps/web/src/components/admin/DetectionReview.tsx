'use client'

import { useState } from 'react'
import { ConfidenceBadge } from '../ui/ConfidenceBadge'
import { SourceBadge } from '../ui/SourceBadge'
import { timeAgo } from '@/lib/utils'
import type { RawDetection, Source } from '@/lib/db/schema'

interface DetectionReviewProps {
  detection: RawDetection & { source?: Source | null }
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, reason: string) => Promise<void>
}

export function DetectionReview({ detection, onApprove, onReject }: DetectionReviewProps) {
  const [loading, setLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'extracted' | 'raw'>('extracted')

  const extractedData = detection.extracted_json as Record<string, unknown> | null

  const handleApprove = async () => {
    setLoading(true)
    try {
      await onApprove(detection.id)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      await onReject(detection.id, rejectReason)
      setShowRejectForm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 mb-1">
              Detection Review
            </h2>
            <p className="text-sm text-zinc-400">
              ID: <code className="text-zinc-300 bg-zinc-800 px-1 rounded">{detection.id}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded font-medium ${
                detection.processing_status === 'pending'
                  ? 'bg-yellow-900 text-yellow-300 border border-yellow-700'
                  : detection.processing_status === 'extracted'
                  ? 'bg-blue-900 text-blue-300 border border-blue-700'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}
            >
              {detection.processing_status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-zinc-500 text-xs mb-1">Source URL</p>
            <a
              href={detection.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 break-all transition-colors"
            >
              {detection.source_url}
            </a>
          </div>
          <div>
            <p className="text-zinc-500 text-xs mb-1">Detected</p>
            <p className="text-zinc-300">{detection.detected_at ? timeAgo(detection.detected_at) : '—'}</p>
          </div>
          {detection.source && (
            <div>
              <p className="text-zinc-500 text-xs mb-1">Source</p>
              <SourceBadge
                sourceName={detection.source.name}
                sourceType={detection.source.source_type}
                trustLevel={detection.source.trust_level}
              />
            </div>
          )}
          {detection.page_hash && (
            <div>
              <p className="text-zinc-500 text-xs mb-1">Page Hash</p>
              <code className="text-xs text-zinc-400">{detection.page_hash.slice(0, 16)}...</code>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-4 py-2 bg-green-900 hover:bg-green-800 text-green-300 border border-green-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Approve & Generate Draft'}
          </button>
          <button
            onClick={() => setShowRejectForm(!showRejectForm)}
            disabled={loading}
            className="px-4 py-2 bg-red-900 hover:bg-red-800 text-red-300 border border-red-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            Reject
          </button>
        </div>

        {showRejectForm && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <label className="text-xs text-red-400 font-medium block mb-2">
              Rejection Reason (optional)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500 resize-none"
              rows={2}
              placeholder="Duplicate, not a toy product, irrelevant content..."
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-3 py-1.5 bg-red-900 hover:bg-red-800 text-red-300 border border-red-700 rounded text-sm font-medium transition-colors"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => setShowRejectForm(false)}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data tabs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('extracted')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'extracted'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Extracted Data
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'raw'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Raw HTML
          </button>
        </div>
        <div className="p-4">
          {activeTab === 'extracted' ? (
            extractedData ? (
              <pre className="text-xs text-zinc-300 overflow-auto max-h-96 bg-zinc-950 p-4 rounded">
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            ) : (
              <p className="text-zinc-500 text-sm">No extracted data available.</p>
            )
          ) : (
            detection.raw_html ? (
              <pre className="text-xs text-zinc-400 overflow-auto max-h-96 bg-zinc-950 p-4 rounded whitespace-pre-wrap">
                {detection.raw_html.slice(0, 10000)}
                {detection.raw_html.length > 10000 && '\n\n...[truncated]'}
              </pre>
            ) : (
              <p className="text-zinc-500 text-sm">No raw HTML stored.</p>
            )
          )}
        </div>
      </div>
    </div>
  )
}

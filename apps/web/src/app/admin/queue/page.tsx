'use client'

import { useState, useEffect, useCallback } from 'react'
import { QueueItem } from '@/components/admin/QueueItem'
import type { RawDetection, Source } from '@/lib/db/schema'
import Link from 'next/link'

type DetectionWithSource = RawDetection & { source?: Source | null }

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || ''

export default function QueuePage() {
  const [detections, setDetections] = useState<DetectionWithSource[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchDetections = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/detections?status=${status}&limit=50`, {
        headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
      })
      const data = await res.json()
      setDetections(data.detections || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchDetections()
  }, [fetchDetections])

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/detections/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `Approved! Draft created: ${data.post?.slug}` })
        setDetections((prev) => prev.filter((d) => d.id !== id))
      } else {
        setMessage({ type: 'error', text: data.error || 'Approval failed' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setProcessingId(null)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleReject = async (id: string) => {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/detections/${id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ADMIN_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Rejected from queue' }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Detection rejected' })
        setDetections((prev) => prev.filter((d) => d.id !== id))
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setProcessingId(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleHold = async (id: string) => {
    setProcessingId(id)
    try {
      await fetch(`/api/detections/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${ADMIN_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ processing_status: 'reviewed', notes: 'On hold' }),
      })
      setDetections((prev) => prev.filter((d) => d.id !== id))
    } finally {
      setProcessingId(null)
    }
  }

  const statusTabs = [
    { value: 'pending', label: 'Pending' },
    { value: 'extracted', label: 'Extracted' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-zinc-100">Review Queue</h1>
        <button
          onClick={fetchDetections}
          disabled={loading}
          className="text-sm px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded transition-colors"
        >
          Refresh
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-900/50 text-green-300 border border-green-700'
              : 'bg-red-900/50 text-red-300 border border-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              status === tab.value
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading detections...</div>
      ) : detections.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p className="text-lg mb-2">Queue is empty</p>
          <p className="text-sm">No detections with status &quot;{status}&quot;</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-zinc-500 mb-4">{detections.length} items</p>
          {detections.map((detection) => (
            <QueueItem
              key={detection.id}
              detection={detection}
              onApprove={handleApprove}
              onReject={handleReject}
              onHold={handleHold}
            />
          ))}
        </div>
      )}
    </div>
  )
}

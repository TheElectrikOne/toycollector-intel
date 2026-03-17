'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DetectionReview } from '@/components/admin/DetectionReview'
import type { RawDetection, Source } from '@/lib/db/schema'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || ''

export default function QueueDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [detection, setDetection] = useState<(RawDetection & { source?: Source | null }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch(`/api/detections/${params.id}`, {
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
    })
      .then((r) => r.json())
      .then((d) => setDetection(d.detection))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/detections/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
    })
    const data = await res.json()
    if (res.ok) {
      setMessage({ type: 'success', text: `Draft created! Post ID: ${data.post?.id}` })
      setTimeout(() => router.push(`/admin/posts/${data.post?.id}`), 2000)
    } else {
      setMessage({ type: 'error', text: data.error || 'Approval failed' })
    }
  }

  const handleReject = async (id: string, reason: string) => {
    await fetch(`/api/detections/${id}/reject`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    })
    setMessage({ type: 'success', text: 'Detection rejected' })
    setTimeout(() => router.push('/admin/queue'), 1500)
  }

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading...</div>
  if (!detection) return <div className="text-center py-12 text-zinc-500">Detection not found</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to Queue
        </button>
        <h1 className="text-2xl font-black text-zinc-100">Detection Detail</h1>
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

      <DetectionReview
        detection={detection}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}

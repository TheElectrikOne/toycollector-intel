'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DraftEditor } from '@/components/admin/DraftEditor'
import type { NewsPost } from '@/lib/db/schema'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || ''

export default function AdminPostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [post, setPost] = useState<NewsPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch(`/api/posts/${params.id}`, {
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
    })
      .then((r) => r.json())
      .then((d) => setPost(d.post))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  const handleSave = async (updates: Partial<NewsPost>) => {
    const res = await fetch(`/api/posts/${params.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    if (res.ok) {
      setPost(data.post)
      setMessage({ type: 'success', text: 'Saved successfully' })
    } else {
      setMessage({ type: 'error', text: data.error || 'Save failed' })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const handlePublish = async (id: string) => {
    const res = await fetch(`/api/posts/${id}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
    })
    const data = await res.json()
    if (res.ok) {
      setPost((prev) => prev ? { ...prev, status: 'published', published_at: new Date() } : prev)
      setMessage({ type: 'success', text: `Published! ${data.post_url}` })
    } else {
      setMessage({ type: 'error', text: data.error || 'Publish failed' })
    }
    setTimeout(() => setMessage(null), 5000)
  }

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading...</div>
  if (!post) return <div className="text-center py-12 text-zinc-500">Post not found</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to Posts
        </button>
        <h1 className="text-2xl font-black text-zinc-100 truncate">Edit Post</h1>
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

      <DraftEditor post={post} onSave={handleSave} onPublish={handlePublish} />
    </div>
  )
}

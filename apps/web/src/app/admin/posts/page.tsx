'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { timeAgo, postTypeLabel } from '@/lib/utils'
import type { NewsPost, Source } from '@/lib/db/schema'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || ''

type PostWithSource = NewsPost & { primary_source?: Source | null }

const STATUS_TABS = ['all', 'draft', 'review', 'published', 'corrected', 'archived']

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostWithSource[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const url = status === 'all'
        ? '/api/posts?limit=100'
        : `/api/posts?status=${status}&limit=100`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
      })
      const data = await res.json()
      setPosts(data.posts || [])
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return
    await fetch(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
    })
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-zinc-100">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="text-sm px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors"
        >
          + New Post
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatus(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-colors ${
              status === tab
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">No posts found</div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Headline</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Confidence</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider hidden lg:table-cell">Updated</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-zinc-100 line-clamp-2 max-w-md">
                      {post.headline}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5 font-mono">{post.slug}</p>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="text-xs text-zinc-400">{postTypeLabel(post.post_type)}</span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <ConfidenceBadge confidence={post.confidence_label} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        post.status === 'published'
                          ? 'bg-green-900/50 text-green-400'
                          : post.status === 'draft'
                          ? 'bg-yellow-900/50 text-yellow-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell text-xs text-zinc-500">
                    {post.updated_at ? timeAgo(post.updated_at) : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        Edit
                      </Link>
                      {post.status === 'published' && (
                        <Link
                          href={`/news/${post.slug}`}
                          target="_blank"
                          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          View
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

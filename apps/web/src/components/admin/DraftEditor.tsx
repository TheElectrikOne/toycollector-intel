'use client'

import { useState } from 'react'
import { ConfidenceBadge } from '../ui/ConfidenceBadge'
import type { NewsPost } from '@/lib/db/schema'

interface DraftEditorProps {
  post: NewsPost
  onSave: (updates: Partial<NewsPost>) => Promise<void>
  onPublish: (id: string) => Promise<void>
}

export function DraftEditor({ post, onSave, onPublish }: DraftEditorProps) {
  const [headline, setHeadline] = useState(post.headline)
  const [summary, setSummary] = useState(post.summary || '')
  const [bodyMarkdown, setBodyMarkdown] = useState(post.body_markdown || '')
  const [confidenceLabel, setConfidenceLabel] = useState(post.confidence_label)
  const [seoTitle, setSeoTitle] = useState(post.seo_title || '')
  const [seoDescription, setSeoDescription] = useState(post.seo_description || '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave({
        headline,
        summary,
        body_markdown: bodyMarkdown,
        confidence_label: confidenceLabel,
        seo_title: seoTitle,
        seo_description: seoDescription,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    setLoading(true)
    try {
      await handleSave()
      await onPublish(post.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-1 rounded font-medium ${
              post.status === 'published'
                ? 'bg-green-900 text-green-300 border border-green-700'
                : post.status === 'draft'
                ? 'bg-yellow-900 text-yellow-300 border border-yellow-700'
                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
            }`}
          >
            {post.status}
          </span>
          <span className="text-xs text-zinc-500">
            Slug: <code className="text-zinc-400">{post.slug}</code>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-400">Saved!</span>}
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          {post.status !== 'published' && (
            <button
              onClick={handlePublish}
              disabled={loading}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-bold transition-colors disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {/* Content editor */}
      <div className="grid grid-cols-1 gap-6">
        {/* Headline */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
            Headline <span className="text-zinc-600 font-normal">({headline.length}/70)</span>
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            maxLength={100}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 text-lg font-semibold focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Confidence + post type row */}
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
              Confidence
            </label>
            <select
              value={confidenceLabel}
              onChange={(e) => setConfidenceLabel(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
            >
              <option value="confirmed">Confirmed</option>
              <option value="estimated">Estimated</option>
              <option value="retailer_placeholder">Retailer Listing</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
          <div className="pt-6">
            <ConfidenceBadge confidence={confidenceLabel} />
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
            Summary <span className="text-zinc-600 font-normal">({summary.length}/160)</span>
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={200}
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-300 text-sm focus:outline-none focus:border-orange-500 resize-none transition-colors"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
            Body (Markdown)
          </label>
          <textarea
            value={bodyMarkdown}
            onChange={(e) => setBodyMarkdown(e.target.value)}
            rows={15}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-300 text-sm font-mono focus:outline-none focus:border-orange-500 resize-y transition-colors"
          />
        </div>

        {/* SEO */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">SEO</h3>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              SEO Title ({seoTitle.length}/60)
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              maxLength={70}
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              SEO Description ({seoDescription.length}/155)
            </label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              maxLength={170}
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

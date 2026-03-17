import Link from 'next/link'
import { ConfidenceBadge } from './ConfidenceBadge'
import { formatDate, timeAgo, postTypeLabel } from '@/lib/utils'
import type { NewsPost, Source } from '@/lib/db/schema'

interface PostCardProps {
  post: NewsPost & { primary_source?: Source | null }
  variant?: 'default' | 'hero' | 'compact'
}

export function PostCard({ post, variant = 'default' }: PostCardProps) {
  if (variant === 'hero') {
    return (
      <Link
        href={`/news/${post.slug}`}
        className="group block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500 transition-colors"
      >
        {post.og_image_url && (
          <div className="aspect-[16/9] bg-zinc-800 overflow-hidden">
            <img
              src={post.og_image_url}
              alt={post.headline}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
              {postTypeLabel(post.post_type)}
            </span>
            <ConfidenceBadge confidence={post.confidence_label} size="sm" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2 group-hover:text-orange-400 transition-colors leading-tight">
            {post.headline}
          </h2>
          {post.summary && (
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">{post.summary}</p>
          )}
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            {post.primary_source && (
              <span className="text-zinc-400">{post.primary_source.name}</span>
            )}
            <span>·</span>
            <time dateTime={post.published_at?.toISOString()}>
              {post.published_at ? timeAgo(post.published_at) : 'Draft'}
            </time>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/news/${post.slug}`}
        className="group flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0 hover:bg-zinc-900/50 rounded px-2 -mx-2 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-orange-400 font-medium">
              {postTypeLabel(post.post_type)}
            </span>
            <ConfidenceBadge confidence={post.confidence_label} size="sm" />
          </div>
          <p className="text-sm font-medium text-zinc-100 group-hover:text-orange-400 transition-colors leading-snug line-clamp-2">
            {post.headline}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {post.published_at ? timeAgo(post.published_at) : 'Draft'}
          </p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/news/${post.slug}`}
      className="group block bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-orange-500 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
          {postTypeLabel(post.post_type)}
        </span>
        <ConfidenceBadge confidence={post.confidence_label} size="sm" />
      </div>
      <h3 className="font-bold text-zinc-100 mb-2 group-hover:text-orange-400 transition-colors leading-snug">
        {post.headline}
      </h3>
      {post.summary && (
        <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2 mb-3">{post.summary}</p>
      )}
      <div className="flex items-center gap-2 text-zinc-500 text-xs">
        {post.primary_source && (
          <span className="text-zinc-400">{post.primary_source.name}</span>
        )}
        <span>·</span>
        <time>{post.published_at ? timeAgo(post.published_at) : 'Draft'}</time>
      </div>
    </Link>
  )
}

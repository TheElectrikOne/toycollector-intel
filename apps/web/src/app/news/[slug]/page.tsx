import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { news_posts } from '@/lib/db/schema'
import { eq, or } from 'drizzle-orm'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { SourceBadge } from '@/components/ui/SourceBadge'
import { CorrectionNotice } from '@/components/ui/CorrectionNotice'
import { formatDateTime, postTypeLabel, timeAgo } from '@/lib/utils'
import Link from 'next/link'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await db.query.news_posts.findFirst({
    where: (p, { or, eq }) => or(eq(p.slug, params.slug), eq(p.id, params.slug)),
  })

  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.seo_title || post.headline,
    description: post.seo_description || post.summary || undefined,
    openGraph: {
      title: post.seo_title || post.headline,
      description: post.seo_description || post.summary || undefined,
      ...(post.og_image_url ? { images: [{ url: post.og_image_url }] } : {}),
      type: 'article',
      publishedTime: post.published_at?.toISOString(),
      modifiedTime: post.updated_at?.toISOString(),
    },
  }
}

export const revalidate = 300

export default async function NewsPostPage({ params }: PageProps) {
  const post = await db.query.news_posts.findFirst({
    where: (p, { or, eq, and }) =>
      and(
        or(eq(p.slug, params.slug), eq(p.id, params.slug)),
        eq(p.status, 'published')
      ),
    with: {
      primary_source: true,
      detection: true,
    },
  })

  if (!post) notFound()

  const isRumor = post.post_type === 'rumor' || post.confidence_label === 'unverified'
  const isCorrection = post.post_type === 'correction'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/" className="hover:text-zinc-300">Home</Link>
        <span>/</span>
        <Link href="/news" className="hover:text-zinc-300">News</Link>
        <span>/</span>
        <span className="text-zinc-300 truncate max-w-xs">{post.headline}</span>
      </nav>

      {/* Unverified warning */}
      {isRumor && (
        <div className="mb-6 bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start gap-3">
          <span className="text-red-400 text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-bold text-red-400 mb-1">Rumor Watch</p>
            <p className="text-sm text-zinc-300">
              This content is unverified. It has not been confirmed by the brand or a trusted official source.
              Do not make purchasing decisions based on rumor-watch posts.
            </p>
          </div>
        </div>
      )}

      {/* Article header */}
      <article>
        <header className="mb-8">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="text-sm font-bold text-orange-400 uppercase tracking-wider">
              {postTypeLabel(post.post_type)}
            </span>
            <ConfidenceBadge confidence={post.confidence_label} />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-zinc-100 leading-tight mb-4">
            {post.headline}
          </h1>

          {post.summary && (
            <p className="text-lg text-zinc-400 leading-relaxed mb-4">
              {post.summary}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 pt-4 border-t border-zinc-800">
            {post.primary_source && (
              <SourceBadge
                sourceName={post.primary_source.name}
                sourceType={post.primary_source.source_type}
                trustLevel={post.primary_source.trust_level}
              />
            )}
            <div className="flex items-center gap-1">
              <span>By</span>
              <span className="text-zinc-300 font-medium">{post.author}</span>
            </div>
            {post.published_at && (
              <time dateTime={post.published_at.toISOString()} title={formatDateTime(post.published_at)}>
                {timeAgo(post.published_at)}
              </time>
            )}
          </div>
        </header>

        {/* Hero image */}
        {post.og_image_url && (
          <div className="mb-8 rounded-xl overflow-hidden bg-zinc-900">
            <img
              src={post.og_image_url}
              alt={post.headline}
              className="w-full max-h-[500px] object-contain"
            />
          </div>
        )}

        {/* Correction notice */}
        {post.status === 'corrected' && post.correction_note && (
          <CorrectionNotice
            correctionNote={post.correction_note}
            correctedAt={post.updated_at}
          />
        )}

        {/* Body */}
        <div className="prose-dark space-y-4 mb-8">
          {post.body_markdown ? (
            <div
              className="prose-dark"
              dangerouslySetInnerHTML={{
                __html: markdownToHtml(post.body_markdown),
              }}
            />
          ) : post.body_html ? (
            <div
              className="prose-dark"
              dangerouslySetInnerHTML={{ __html: post.body_html }}
            />
          ) : (
            <p className="text-zinc-400 italic">No article body available.</p>
          )}
        </div>

        {/* Source footer */}
        {post.primary_source && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Primary Source</p>
            <div className="flex items-center justify-between">
              <SourceBadge
                sourceName={post.primary_source.name}
                sourceType={post.primary_source.source_type}
                trustLevel={post.primary_source.trust_level}
              />
              <a
                href={post.primary_source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-orange-400 hover:text-orange-300"
              >
                Visit Source →
              </a>
            </div>
            {post.primary_source.trust_level < 3 && (
              <p className="text-xs text-zinc-500 mt-2">
                This source has a trust level below 3. Information may be speculative or unconfirmed.
              </p>
            )}
          </div>
        )}

        {/* Confidence explanation */}
        <div className="mt-6 text-xs text-zinc-600">
          <p>
            <strong className="text-zinc-500">About confidence labels:</strong>{' '}
            <em>Confirmed</em> = verified by official brand source.{' '}
            <em>Estimated</em> = reported with hedging language.{' '}
            <em>Retailer Listing</em> = retailer listing only, unconfirmed by brand.{' '}
            <em>Unverified</em> = community rumor or low-trust source.
          </p>
        </div>
      </article>
    </div>
  )
}

// Simple markdown to HTML converter (no external dependency)
function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-zinc-100 mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-zinc-100 mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-black text-zinc-100 mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-100 font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/~~(.*?)~~/g, '<del class="line-through text-zinc-500">$1</del>')
    .replace(/`(.*?)`/g, '<code class="bg-zinc-800 text-zinc-200 px-1 rounded text-sm font-mono">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-orange-400 hover:text-orange-300">$1</a>')
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-orange-500 pl-4 italic text-zinc-400 my-4">$1</blockquote>')
    .replace(/^---$/gm, '<hr class="border-zinc-700 my-6">')
    .replace(/^\| (.+) \|$/gm, (match) => {
      if (match.includes('---')) {
        return ''
      }
      const cells = match
        .slice(2, -2)
        .split(' | ')
        .map((c) => `<td class="px-3 py-2 text-sm text-zinc-300 border-b border-zinc-800">${c}</td>`)
        .join('')
      return `<tr>${cells}</tr>`
    })
    .replace(/^- (.*$)/gm, '<li class="text-zinc-300 ml-4">• $1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="text-zinc-300 ml-4">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-zinc-300 leading-relaxed mb-4">')
    .replace(/^/, '<p class="text-zinc-300 leading-relaxed mb-4">')
    .replace(/$/, '</p>')
}

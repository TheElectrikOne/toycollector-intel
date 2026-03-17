import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { news_posts } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { PostCard } from '@/components/ui/PostCard'
import { formatDate, timeAgo } from '@/lib/utils'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Corrections',
  description: 'ToyIntel corrections log — transparent record of all articles that have been corrected.',
}

export const revalidate = 3600

export default async function CorrectionsPage() {
  const [corrections, correctedPosts] = await Promise.all([
    db.query.news_posts.findMany({
      where: (p, { eq }) => eq(p.post_type, 'correction'),
      with: { primary_source: true },
      orderBy: [desc(news_posts.published_at)],
      limit: 50,
    }),
    db.query.news_posts.findMany({
      where: (p, { eq }) => eq(p.status, 'corrected'),
      orderBy: [desc(news_posts.updated_at)],
      limit: 50,
    }),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-zinc-100 mb-3">Corrections Log</h1>
        <p className="text-zinc-400 leading-relaxed">
          ToyIntel is committed to accuracy. When we publish incorrect information, we issue a correction
          transparently. This page documents all corrections in full.
        </p>
      </div>

      {corrections.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-xl mb-2">No corrections issued</p>
          <p className="text-sm">All published articles are current and accurate.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {corrections.map((correction) => (
            <div key={correction.id} className="bg-zinc-900 border border-yellow-800 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-900/30 border-b border-yellow-800">
                <span className="text-yellow-400">⚠️</span>
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Correction</span>
                {correction.published_at && (
                  <span className="text-xs text-zinc-500 ml-auto">
                    {formatDate(correction.published_at)}
                  </span>
                )}
              </div>
              <div className="p-4">
                <Link
                  href={`/news/${correction.slug}`}
                  className="font-bold text-zinc-100 hover:text-orange-400 transition-colors text-sm"
                >
                  {correction.headline}
                </Link>
                {correction.summary && (
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{correction.summary}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

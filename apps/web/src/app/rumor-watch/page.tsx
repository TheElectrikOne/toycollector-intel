import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { news_posts } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { PostCard } from '@/components/ui/PostCard'

export const metadata: Metadata = {
  title: 'Rumor Watch',
  description: 'Unverified toy rumors and speculation — clearly labeled and tracked for collectors.',
}

export const revalidate = 600

export default async function RumorWatchPage() {
  const rumors = await db.query.news_posts.findMany({
    where: (p, { and, eq, or }) =>
      and(
        eq(p.status, 'published'),
        or(eq(p.post_type, 'rumor'), eq(p.confidence_label, 'unverified'))
      ),
    with: { primary_source: true },
    orderBy: [desc(news_posts.published_at)],
    limit: 50,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">⚠️</span>
          <h1 className="text-3xl font-black text-zinc-100">Rumor Watch</h1>
        </div>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-300 font-medium mb-1">Important Disclosure</p>
          <p className="text-sm text-zinc-400">
            All posts on this page are <strong className="text-red-400">unverified</strong> and have not been confirmed
            by official brand sources. Content is clearly labeled and sourced. Do not make purchasing decisions
            based on rumors. ToyIntel tracks rumors to keep collectors informed, not to speculate.
          </p>
        </div>
        <p className="text-zinc-400">
          {rumors.length} active rumor{rumors.length !== 1 ? 's' : ''} being tracked.
        </p>
      </div>

      {rumors.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-xl mb-2">No active rumors</p>
          <p className="text-sm">All currently tracked information has been verified.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rumors.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}

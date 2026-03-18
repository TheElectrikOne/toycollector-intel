import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { news_posts } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { PostCard } from '@/components/ui/PostCard'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Toy News',
  description: 'Latest toy news, reveals, preorder alerts, and release date updates for collectors.',
}

export const dynamic = 'force-dynamic'

const POST_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'reveal', label: 'Reveals' },
  { value: 'preorder_alert', label: 'Preorders' },
  { value: 'release_date', label: 'Release Dates' },
  { value: 'rumor', label: 'Rumors' },
  { value: 'correction', label: 'Corrections' },
]

interface PageProps {
  searchParams: { type?: string; page?: string }
}

export default async function NewsPage({ searchParams }: PageProps) {
  const postType = searchParams.type
  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const limit = 24
  const offset = (page - 1) * limit

  const posts = await db.query.news_posts.findMany({
    where: (p, { eq, and }) => {
      const conditions = [eq(p.status, 'published')]
      if (postType && postType !== 'all') conditions.push(eq(p.post_type, postType))
      return and(...conditions)
    },
    with: { primary_source: true },
    orderBy: [desc(news_posts.published_at)],
    limit,
    offset,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-zinc-100 mb-2">Toy News</h1>
        <p className="text-zinc-400">Reveals, preorder alerts, release dates, and more — tracked from 25+ sources.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8">
        {POST_TYPES.map((type) => (
          <Link
            key={type.value}
            href={type.value === 'all' ? '/news' : `/news?type=${type.value}`}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              (postType || 'all') === type.value
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {type.label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-xl mb-2">No posts yet</p>
          <p className="text-sm">Published posts will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {posts.length === limit && (
        <div className="flex justify-center mt-8">
          <Link
            href={`/news${postType ? `?type=${postType}&` : '?'}page=${page + 1}`}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
          >
            Load More
          </Link>
        </div>
      )}
    </div>
  )
}

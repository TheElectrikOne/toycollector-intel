import { db } from '@/lib/db'
import { news_posts, preorder_alerts, products, release_dates } from '@/lib/db/schema'
import { eq, desc, and, gte, lte } from 'drizzle-orm'
import { PostCard } from '@/components/ui/PostCard'
import { PreorderCard } from '@/components/ui/PreorderCard'
import { AlertBanner } from '@/components/ui/AlertBanner'
import { ReleaseRow } from '@/components/ui/ReleaseRow'
import Link from 'next/link'
import { startOfMonth, endOfMonth } from 'date-fns'

const CATEGORY_FILTERS = [
  { label: 'Marvel', franchise: 'Marvel' },
  { label: 'Star Wars', franchise: 'Star Wars' },
  { label: 'Transformers', franchise: 'Transformers' },
  { label: 'Anime', franchise: null, brand: 'Good Smile Company' },
  { label: 'Wrestling', franchise: 'WWE' },
  { label: 'Pokémon', franchise: 'Pokémon' },
]

export const revalidate = 300 // 5 minutes

export default async function HomePage() {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // Fetch all data in parallel
  const [latestPosts, preorderAlertsData, monthReleases] = await Promise.all([
    db.query.news_posts.findMany({
      where: eq(news_posts.status, 'published'),
      with: { primary_source: true },
      orderBy: [desc(news_posts.published_at)],
      limit: 10,
    }),
    db.query.preorder_alerts.findMany({
      where: eq(preorder_alerts.is_active, true),
      with: { product: true },
      orderBy: [desc(preorder_alerts.detected_at)],
      limit: 6,
    }),
    db.query.products.findMany({
      where: (p, { inArray }) =>
        inArray(p.status, ['shipping', 'preorder_open']),
      with: {
        release_dates: {
          where: eq(release_dates.is_current, true),
          limit: 1,
        },
      },
      orderBy: [desc(products.updated_at)],
      limit: 8,
    }),
  ])

  const heroPost = latestPosts[0]
  const breakingPosts = latestPosts.slice(1, 4)
  const recentPosts = latestPosts.slice(4)

  return (
    <>
      {/* Preorder alert banner */}
      <AlertBanner alerts={preorderAlertsData} />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-16">

        {/* Hero section */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {heroPost && (
              <div className="md:col-span-2">
                <PostCard post={heroPost} variant="hero" />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Latest News</h2>
                <Link href="/news" className="text-xs text-orange-400 hover:text-orange-300">
                  All News →
                </Link>
              </div>
              {breakingPosts.map((post) => (
                <PostCard key={post.id} post={post} variant="compact" />
              ))}
            </div>
          </div>
        </section>

        {/* Preorder Alerts */}
        {preorderAlertsData.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-zinc-100">Live Preorder Alerts</h2>
                <p className="text-sm text-zinc-500 mt-1">Currently active preorders detected from retailers</p>
              </div>
              <Link href="/preorders" className="text-sm text-orange-400 hover:text-orange-300">
                View All Preorders →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {preorderAlertsData.map((alert) => (
                <PreorderCard key={alert.id} alert={alert} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Releases */}
        {monthReleases.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-zinc-100">Upcoming Releases</h2>
                <p className="text-sm text-zinc-500 mt-1">Products currently shipping or in preorder</p>
              </div>
              <Link href="/releases" className="text-sm text-orange-400 hover:text-orange-300">
                Full Calendar →
              </Link>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Product</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Brand</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Scale</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Release</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider hidden lg:table-cell">MSRP</th>
                  </tr>
                </thead>
                <tbody>
                  {monthReleases.map((product) => (
                    <ReleaseRow
                      key={product.id}
                      product={product}
                      releaseDate={product.release_dates[0]}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Category sections */}
        <section>
          <h2 className="text-xl font-black text-zinc-100 mb-6">By Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORY_FILTERS.map((cat) => (
              <Link
                key={cat.label}
                href={cat.franchise
                  ? `/franchises/${cat.franchise.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
                  : `/brands/${(cat.brand || '').toLowerCase().replace(/\s+/g, '-')}`
                }
                className="bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-lg p-4 text-center transition-colors group"
              >
                <p className="font-bold text-sm text-zinc-100 group-hover:text-orange-400 transition-colors">
                  {cat.label}
                </p>
                <p className="text-xs text-zinc-500 mt-1">View all →</p>
              </Link>
            ))}
          </div>
        </section>

        {/* More news */}
        {recentPosts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-zinc-100">More News</h2>
              <Link href="/news" className="text-sm text-orange-400 hover:text-orange-300">
                All News →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {latestPosts.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-black text-zinc-100 mb-2">ToyIntel is warming up</h2>
            <p className="text-zinc-400 mb-6">
              No published content yet. Set up your database and configure sources to start monitoring.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors"
            >
              Go to Admin →
            </Link>
          </div>
        )}

      </div>
    </>
  )
}

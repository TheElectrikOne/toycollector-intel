import { db } from '@/lib/db'
import { raw_detections, news_posts, preorder_alerts, page_monitors } from '@/lib/db/schema'
import { eq, and, gte, desc } from 'drizzle-orm'
import { StatsPanel } from '@/components/admin/StatsPanel'
import Link from 'next/link'
import { timeAgo, formatDateTime } from '@/lib/utils'
import { startOfDay } from 'date-fns'

export const revalidate = 60

export default async function AdminDashboard() {
  const today = startOfDay(new Date())

  const [
    pendingDetections,
    extractedDetections,
    publishedToday,
    activePreorders,
    activeMonitors,
    recentDetections,
    recentPosts,
  ] = await Promise.all([
    db.query.raw_detections.findMany({
      where: eq(raw_detections.processing_status, 'pending'),
    }).then((r) => r.length),
    db.query.raw_detections.findMany({
      where: eq(raw_detections.processing_status, 'extracted'),
    }).then((r) => r.length),
    db.query.news_posts.findMany({
      where: and(
        eq(news_posts.status, 'published'),
        gte(news_posts.published_at, today)
      ),
    }).then((r) => r.length),
    db.query.preorder_alerts.findMany({
      where: eq(preorder_alerts.is_active, true),
    }).then((r) => r.length),
    db.query.page_monitors.findMany({
      where: eq(page_monitors.is_active, true),
    }).then((r) => r.length),
    db.query.raw_detections.findMany({
      with: { source: true },
      orderBy: [desc(raw_detections.detected_at)],
      limit: 10,
    }),
    db.query.news_posts.findMany({
      with: { primary_source: true },
      orderBy: [desc(news_posts.updated_at)],
      limit: 10,
    }),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-zinc-100">Dashboard</h1>
        <div className="flex items-center gap-3">
          <form action="/api/scraper/trigger" method="POST">
            <button
              type="submit"
              className="text-sm px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors"
            >
              Run Scraper
            </button>
          </form>
        </div>
      </div>

      <StatsPanel
        stats={{
          pendingDetections,
          publishedToday,
          activePreorders,
          activeMonitors,
          extractedDetections,
          totalProducts: 0,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent detections */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-zinc-100">Recent Detections</h2>
            <Link href="/admin/queue" className="text-xs text-orange-400 hover:text-orange-300">
              Review Queue →
            </Link>
          </div>
          <div className="space-y-3">
            {recentDetections.length === 0 ? (
              <p className="text-sm text-zinc-500">No detections yet.</p>
            ) : (
              recentDetections.map((d) => {
                const extractedData = d.extracted_json as {
                  product?: { product_name?: string; brand?: string }
                } | null
                const productName = extractedData?.product?.product_name || 'Unknown'
                return (
                  <div key={d.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-100 truncate">{productName}</p>
                      <p className="text-xs text-zinc-500">
                        {d.source?.name || 'Unknown source'} · {d.detected_at ? timeAgo(d.detected_at) : '—'}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${
                        d.processing_status === 'pending'
                          ? 'bg-yellow-900/50 text-yellow-400'
                          : d.processing_status === 'extracted'
                          ? 'bg-blue-900/50 text-blue-400'
                          : d.processing_status === 'published'
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {d.processing_status}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Recent posts */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-zinc-100">Recent Posts</h2>
            <Link href="/admin/posts" className="text-xs text-orange-400 hover:text-orange-300">
              All Posts →
            </Link>
          </div>
          <div className="space-y-3">
            {recentPosts.length === 0 ? (
              <p className="text-sm text-zinc-500">No posts yet.</p>
            ) : (
              recentPosts.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/posts/${p.id}`}
                      className="text-sm text-zinc-100 hover:text-orange-400 truncate block transition-colors"
                    >
                      {p.headline}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {p.updated_at ? timeAgo(p.updated_at) : '—'}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${
                      p.status === 'published'
                        ? 'bg-green-900/50 text-green-400'
                        : p.status === 'draft'
                        ? 'bg-yellow-900/50 text-yellow-400'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { products, release_dates } from '@/lib/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { ReleaseRow } from '@/components/ui/ReleaseRow'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Release Calendar',
  description: 'Upcoming toy release dates, shipping schedules, and preorder windows for collectors.',
}

export const dynamic = 'force-dynamic'

const STATUS_GROUPS = [
  { key: 'preorder_open', label: 'Preorder Open', statuses: ['preorder_open'] },
  { key: 'shipping', label: 'Shipping Now', statuses: ['shipping'] },
  { key: 'announced', label: 'Announced', statuses: ['announced'] },
  { key: 'preorder_closed', label: 'Preorder Closed', statuses: ['preorder_closed'] },
]

export default async function ReleasesPage() {
  const allProducts = await db.query.products.findMany({
    where: (p, { not, eq }) => not(eq(p.status, 'released')),
    with: {
      release_dates: {
        where: eq(release_dates.is_current, true),
        with: { source: true },
        limit: 1,
      },
    },
    orderBy: [desc(products.updated_at)],
    limit: 200,
  })

  const grouped = STATUS_GROUPS.map((group) => ({
    ...group,
    products: allProducts.filter((p) => group.statuses.includes(p.status || 'announced')),
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-zinc-100 mb-2">Release Calendar</h1>
        <p className="text-zinc-400">
          Upcoming toy releases, shipping schedules, and preorder windows.
          Confidence labels indicate the reliability of date information.
        </p>
      </div>

      {/* Confidence legend */}
      <div className="flex flex-wrap gap-3 mb-8 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <span className="text-xs text-zinc-500 self-center">Confidence:</span>
        {['confirmed', 'estimated', 'retailer_placeholder', 'unverified'].map((c) => (
          <ConfidenceBadge key={c} confidence={c} size="sm" />
        ))}
      </div>

      {grouped.map((group) => (
        group.products.length === 0 ? null : (
          <section key={group.key} className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-black text-zinc-100">{group.label}</h2>
              <span className="text-sm text-zinc-500">({group.products.length} items)</span>
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
                  {group.products.map((product) => (
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
        )
      ))}

      {allProducts.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-xl mb-2">No upcoming releases tracked yet</p>
          <p className="text-sm">
            Products will appear here once the scraper detects them from sources.
          </p>
        </div>
      )}
    </div>
  )
}

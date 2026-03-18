import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { desc, sql } from 'drizzle-orm'
import Link from 'next/link'
import { slugify } from '@/lib/content/slugify'

export const metadata: Metadata = {
  title: 'Toy Brands',
  description: 'Browse toy news and release dates by brand — Hasbro, NECA, Good Smile, Bandai, Hot Toys, and more.',
}

export const dynamic = 'force-dynamic'

export default async function BrandsPage() {
  const brandCounts = await db
    .select({
      brand: products.brand,
      count: sql<number>`count(*)::int`,
    })
    .from(products)
    .groupBy(products.brand)
    .orderBy(desc(sql`count(*)`))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-zinc-100 mb-2">Toy Brands</h1>
        <p className="text-zinc-400">Browse products and news by manufacturer.</p>
      </div>

      {brandCounts.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-lg">No brands tracked yet.</p>
          <p className="text-sm mt-2">Products will appear here once the scraper runs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {brandCounts.map(({ brand, count }) => {
            const brandSlug = slugify(brand)
            return (
              <Link
                key={brand}
                href={`/brands/${brandSlug}`}
                className="bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-lg p-4 transition-colors group"
              >
                <p className="font-bold text-sm text-zinc-100 group-hover:text-orange-400 transition-colors mb-1">
                  {brand}
                </p>
                <p className="text-xs text-zinc-500">{count} product{count !== 1 ? 's' : ''}</p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

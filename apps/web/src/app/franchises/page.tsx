import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { desc, sql, isNotNull } from 'drizzle-orm'
import Link from 'next/link'
import { slugify } from '@/lib/content/slugify'

export const metadata: Metadata = {
  title: 'Franchises',
  description: 'Browse toy releases by franchise — Marvel, Star Wars, Transformers, Pokémon, and more.',
}

export const revalidate = 3600

export default async function FranchisesPage() {
  const franchiseCounts = await db
    .select({
      franchise: products.franchise,
      count: sql<number>`count(*)::int`,
    })
    .from(products)
    .where(isNotNull(products.franchise))
    .groupBy(products.franchise)
    .orderBy(desc(sql`count(*)`))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-zinc-100 mb-2">Franchises</h1>
        <p className="text-zinc-400">Browse toy releases by franchise.</p>
      </div>

      {franchiseCounts.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-lg">No franchises tracked yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {franchiseCounts
            .filter((f) => f.franchise)
            .map(({ franchise, count }) => {
              const slug = slugify(franchise!)
              return (
                <Link
                  key={franchise}
                  href={`/franchises/${slug}`}
                  className="bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-lg p-5 transition-colors group"
                >
                  <p className="font-bold text-zinc-100 group-hover:text-orange-400 transition-colors mb-1">
                    {franchise}
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

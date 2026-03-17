import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { ilike, desc } from 'drizzle-orm'
import { ProductCard } from '@/components/ui/ProductCard'

interface PageProps {
  params: { slug: string }
}

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const brandName = slugToName(params.slug)
  return {
    title: `${brandName} Toys & Collectibles`,
    description: `Latest ${brandName} toy releases, preorders, and news for collectors.`,
  }
}

export const revalidate = 3600

export default async function BrandPage({ params }: PageProps) {
  const brandSearch = params.slug.replace(/-/g, '%')

  const brandProducts = await db.query.products.findMany({
    where: (p, { ilike }) => ilike(p.brand, `%${brandSearch}%`),
    orderBy: [desc(products.updated_at)],
    limit: 100,
  })

  if (brandProducts.length === 0) {
    // Try a different approach — look for exact slugified match
    const brandName = slugToName(params.slug)
    const altProducts = await db.query.products.findMany({
      where: (p, { ilike }) => ilike(p.brand, `%${brandName}%`),
      orderBy: [desc(products.updated_at)],
      limit: 100,
    })

    if (altProducts.length === 0) notFound()

    return renderBrandPage(params.slug, altProducts)
  }

  return renderBrandPage(params.slug, brandProducts)
}

function renderBrandPage(
  slug: string,
  brandProducts: Awaited<ReturnType<typeof db.query.products.findMany>>
) {
  const brandName = brandProducts[0]?.brand || slugToName(slug)

  const grouped = brandProducts.reduce<Record<string, typeof brandProducts>>((acc, p) => {
    const key = p.franchise || p.line || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <nav className="text-sm text-zinc-500 mb-3">
          <a href="/brands" className="hover:text-zinc-300">Brands</a>
          <span className="mx-2">/</span>
          <span className="text-zinc-300">{brandName}</span>
        </nav>
        <h1 className="text-3xl font-black text-zinc-100 mb-2">{brandName}</h1>
        <p className="text-zinc-400">{brandProducts.length} product{brandProducts.length !== 1 ? 's' : ''} tracked</p>
      </div>

      {Object.entries(grouped).map(([groupName, groupProducts]) => (
        <section key={groupName} className="mb-10">
          <h2 className="text-lg font-bold text-zinc-300 mb-4 border-b border-zinc-800 pb-2">
            {groupName}
            <span className="text-sm text-zinc-600 font-normal ml-2">({groupProducts.length})</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {groupProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

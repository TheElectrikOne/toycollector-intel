import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { products, news_posts } from '@/lib/db/schema'
import { ilike, eq, desc } from 'drizzle-orm'
import { ProductCard } from '@/components/ui/ProductCard'
import { PostCard } from '@/components/ui/PostCard'

interface PageProps {
  params: { slug: string }
}

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/Pokemon/, 'Pokémon')
    .replace(/Tfw/, 'TFW')
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const name = slugToName(params.slug)
  return {
    title: `${name} Toys & Collectibles`,
    description: `Latest ${name} toy releases, preorders, and collector news.`,
  }
}

export const dynamic = 'force-dynamic'

export default async function FranchisePage({ params }: PageProps) {
  const franchiseName = slugToName(params.slug)
  const franchiseSearch = `%${franchiseName}%`

  const [franchiseProducts, relatedPosts] = await Promise.all([
    db.query.products.findMany({
      where: (p, { ilike }) => ilike(p.franchise, franchiseSearch),
      orderBy: [desc(products.updated_at)],
      limit: 60,
    }),
    db.query.news_posts.findMany({
      where: (p, { and, eq }) => and(eq(p.status, 'published')),
      with: { primary_source: true },
      orderBy: [desc(news_posts.published_at)],
      limit: 6,
    }),
  ])

  if (franchiseProducts.length === 0) notFound()

  const grouped = franchiseProducts.reduce<Record<string, typeof franchiseProducts>>((acc, p) => {
    const key = p.brand
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <nav className="text-sm text-zinc-500 mb-3">
          <a href="/franchises" className="hover:text-zinc-300">Franchises</a>
          <span className="mx-2">/</span>
          <span className="text-zinc-300">{franchiseName}</span>
        </nav>
        <h1 className="text-3xl font-black text-zinc-100 mb-2">{franchiseName}</h1>
        <p className="text-zinc-400">{franchiseProducts.length} products tracked across {Object.keys(grouped).length} brand{Object.keys(grouped).length !== 1 ? 's' : ''}</p>
      </div>

      {relatedPosts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-bold text-zinc-300 mb-4">Latest News</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedPosts.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {Object.entries(grouped).map(([brand, brandProducts]) => (
        <section key={brand} className="mb-10">
          <h2 className="text-lg font-bold text-zinc-300 mb-4 border-b border-zinc-800 pb-2">
            <span className="text-orange-400">{brand}</span>
            <span className="text-sm text-zinc-600 font-normal ml-2">({brandProducts.length})</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {brandProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

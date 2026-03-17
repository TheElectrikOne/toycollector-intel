import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/lib/db/schema'

interface ProductCardProps {
  product: Product
}

const statusColors: Record<string, string> = {
  announced: 'bg-zinc-800 text-zinc-300',
  preorder_open: 'bg-green-900 text-green-300',
  preorder_closed: 'bg-yellow-900 text-yellow-300',
  shipping: 'bg-blue-900 text-blue-300',
  released: 'bg-teal-900 text-teal-300',
  cancelled: 'bg-red-900 text-red-300',
}

const statusLabels: Record<string, string> = {
  announced: 'Announced',
  preorder_open: 'Preorder Open',
  preorder_closed: 'Preorder Closed',
  shipping: 'Shipping',
  released: 'Released',
  cancelled: 'Cancelled',
}

export function ProductCard({ product }: ProductCardProps) {
  const statusColor = statusColors[product.status || 'announced'] || statusColors.announced
  const statusLabel = statusLabels[product.status || 'announced'] || product.status

  return (
    <Link
      href={`/brands/${product.brand.toLowerCase().replace(/\s+/g, '-')}#${product.slug}`}
      className="group block bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-orange-500 transition-colors"
    >
      {product.image_url ? (
        <div className="aspect-square bg-zinc-800 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.product_name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-square bg-zinc-800 flex items-center justify-center">
          <span className="text-4xl">🤖</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-xs text-orange-400 font-medium truncate">{product.brand}</span>
          <span className={`text-xs rounded px-1.5 py-0.5 font-medium whitespace-nowrap ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <h3 className="font-semibold text-zinc-100 text-sm leading-snug mb-1 group-hover:text-orange-400 transition-colors">
          {product.product_name}
        </h3>
        {product.character && (
          <p className="text-xs text-zinc-500 mb-2">{product.character}</p>
        )}
        <div className="flex items-center justify-between text-xs text-zinc-400">
          {product.scale && <span>{product.scale}</span>}
          {product.msrp_usd && (
            <span className="font-medium text-zinc-300">{formatPrice(product.msrp_usd)}</span>
          )}
        </div>
        {product.exclusivity && (
          <p className="text-xs text-purple-400 mt-1">{product.exclusivity}</p>
        )}
      </div>
    </Link>
  )
}

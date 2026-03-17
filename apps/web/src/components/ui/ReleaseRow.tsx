import { ConfidenceBadge } from './ConfidenceBadge'
import { formatDate, formatPrice } from '@/lib/utils'
import type { Product, ReleaseDate, Source } from '@/lib/db/schema'

interface ReleaseRowProps {
  product: Product
  releaseDate?: (ReleaseDate & { source?: Source | null }) | null
}

const statusColors: Record<string, string> = {
  announced: 'text-zinc-400',
  preorder_open: 'text-green-400',
  preorder_closed: 'text-yellow-400',
  shipping: 'text-blue-400',
  released: 'text-teal-400',
  cancelled: 'text-red-400',
}

export function ReleaseRow({ product, releaseDate }: ReleaseRowProps) {
  const statusColor = statusColors[product.status || 'announced'] || 'text-zinc-400'

  const displayDate = releaseDate?.date_exact
    ? formatDate(releaseDate.date_exact)
    : releaseDate?.date_label
    || (releaseDate?.date_window_start && releaseDate?.date_window_end
      ? `${releaseDate.date_window_start} – ${releaseDate.date_window_end}`
      : '—')

  return (
    <tr className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
      <td className="py-3 px-4">
        <div>
          <p className="text-sm font-medium text-zinc-100">{product.product_name}</p>
          {product.character && (
            <p className="text-xs text-zinc-500">{product.character}</p>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-orange-400">{product.brand}</span>
        {product.line && (
          <p className="text-xs text-zinc-500">{product.line}</p>
        )}
      </td>
      <td className="py-3 px-4">
        {product.scale && (
          <span className="text-sm text-zinc-300">{product.scale}</span>
        )}
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-zinc-300">{displayDate}</span>
        {releaseDate && (
          <div className="mt-1">
            <ConfidenceBadge confidence={releaseDate.confidence} size="sm" />
          </div>
        )}
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs font-medium ${statusColor}`}>
          {product.status?.replace(/_/g, ' ')}
        </span>
      </td>
      <td className="py-3 px-4">
        {product.msrp_usd && (
          <span className="text-sm text-zinc-300">{formatPrice(product.msrp_usd)}</span>
        )}
      </td>
    </tr>
  )
}

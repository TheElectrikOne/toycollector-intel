'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatPrice, timeAgo } from '@/lib/utils'
import type { Product } from '@/lib/db/schema'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || ''

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = search ? `?q=${encodeURIComponent(search)}&limit=100` : '?limit=100'
      const res = await fetch(`/api/products${params}`, {
        headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
      })
      const data = await res.json()
      setItems(data.products || [])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
    })
    setItems((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-zinc-100">Products</h1>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">No products found</div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Product</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Brand</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider hidden lg:table-cell">MSRP</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider hidden lg:table-cell">Updated</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-zinc-100">{p.product_name}</p>
                    {p.character && <p className="text-xs text-zinc-500">{p.character}</p>}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="text-sm text-orange-400">{p.brand}</span>
                    {p.line && <p className="text-xs text-zinc-500">{p.line}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-zinc-400 capitalize">
                      {p.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell text-sm text-zinc-300">
                    {p.msrp_usd ? formatPrice(p.msrp_usd) : '—'}
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell text-xs text-zinc-500">
                    {p.updated_at ? timeAgo(p.updated_at) : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

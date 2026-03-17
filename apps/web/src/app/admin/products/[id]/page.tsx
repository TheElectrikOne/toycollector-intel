'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/db/schema'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || ''

const PRODUCT_TYPES = ['action_figure', 'statue', 'die_cast', 'plush', 'vehicle', 'playset']
const STATUSES = ['announced', 'preorder_open', 'preorder_closed', 'shipping', 'released', 'cancelled']

export default function AdminProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState<Partial<Product>>({})

  useEffect(() => {
    fetch(`/api/products/${params.id}`, {
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setProduct(d.product)
        setForm(d.product)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${ADMIN_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setProduct(data.product)
        setMessage({ type: 'success', text: 'Product saved' })
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const updateField = (key: keyof Product, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading...</div>
  if (!product) return <div className="text-center py-12 text-zinc-500">Product not found</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back
        </button>
        <h1 className="text-2xl font-black text-zinc-100 truncate">{product.product_name}</h1>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          message.type === 'success'
            ? 'bg-green-900/50 text-green-300 border border-green-700'
            : 'bg-red-900/50 text-red-300 border border-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'product_name', label: 'Product Name', required: true },
            { key: 'brand', label: 'Brand', required: true },
            { key: 'franchise', label: 'Franchise' },
            { key: 'line', label: 'Line' },
            { key: 'character', label: 'Character' },
            { key: 'scale', label: 'Scale' },
            { key: 'sku', label: 'SKU' },
            { key: 'upc', label: 'UPC' },
            { key: 'msrp_usd', label: 'MSRP (USD)' },
            { key: 'region', label: 'Region' },
            { key: 'exclusivity', label: 'Exclusivity' },
            { key: 'image_url', label: 'Image URL' },
            { key: 'official_page_url', label: 'Official Page URL' },
          ].map(({ key, label, required }) => (
            <div key={key}>
              <label className="block text-xs text-zinc-500 mb-1">
                {label}{required && ' *'}
              </label>
              <input
                type="text"
                value={(form[key as keyof Product] as string) || ''}
                onChange={(e) => updateField(key as keyof Product, e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Product Type</label>
            <select
              value={form.product_type || ''}
              onChange={(e) => updateField('product_type', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
            >
              <option value="">— Select —</option>
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Status</label>
            <select
              value={form.status || 'announced'}
              onChange={(e) => updateField('status', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-zinc-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

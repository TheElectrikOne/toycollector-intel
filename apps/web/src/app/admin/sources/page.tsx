'use client'

import { useState, useEffect, useCallback } from 'react'
import { SourceBadge } from '@/components/ui/SourceBadge'
import type { Source } from '@/lib/db/schema'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || ''

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)

  const fetchSources = useCallback(async () => {
    setLoading(true)
    try {
      const url = showInactive ? '/api/sources?active=false' : '/api/sources'
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
      })
      const data = await res.json()
      setSources(data.sources || [])
    } finally {
      setLoading(false)
    }
  }, [showInactive])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  const toggleActive = async (id: string, currentActive: boolean) => {
    await fetch(`/api/sources/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ active: !currentActive }),
    })
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !currentActive } : s))
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-zinc-100">Sources</h1>
        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading...</div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Source</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Type / Trust</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider hidden lg:table-cell">URL</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Active</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-zinc-100">{source.name}</p>
                    {source.brand_affiliation && (
                      <p className="text-xs text-zinc-500">{source.brand_affiliation}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <SourceBadge
                      sourceName=""
                      sourceType={source.source_type}
                      trustLevel={source.trust_level}
                    />
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-500 hover:text-orange-400 truncate max-w-xs block transition-colors"
                    >
                      {source.url}
                    </a>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleActive(source.id, source.active || false)}
                      className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                        source.active
                          ? 'bg-green-900/50 text-green-400 hover:bg-red-900/50 hover:text-red-400'
                          : 'bg-zinc-800 text-zinc-500 hover:bg-green-900/50 hover:text-green-400'
                      }`}
                    >
                      {source.active ? 'Active' : 'Inactive'}
                    </button>
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

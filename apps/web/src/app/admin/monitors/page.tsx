'use client'

import { useState, useEffect, useCallback } from 'react'
import { timeAgo, formatDateTime } from '@/lib/utils'
import type { PageMonitor, Source } from '@/lib/db/schema'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || ''

type MonitorWithStatus = PageMonitor & {
  source?: Source | null
  is_due?: boolean
  next_check_at?: string
  minutes_until_next?: number
}

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'P1 Urgent (15min)', color: 'text-red-400' },
  2: { label: 'P2 High (1hr)', color: 'text-orange-400' },
  3: { label: 'P3 Standard (4hr)', color: 'text-yellow-400' },
  4: { label: 'P4 Low (daily)', color: 'text-zinc-400' },
}

export default function AdminMonitorsPage() {
  const [monitors, setMonitors] = useState<MonitorWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState<string | null>(null)

  const fetchMonitors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/scraper/monitor', {
        headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
      })
      const data = await res.json()
      setMonitors(data.monitors || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMonitors()
  }, [fetchMonitors])

  const triggerMonitor = async (monitorId: string) => {
    setTriggering(monitorId)
    try {
      const res = await fetch('/api/scraper/trigger', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ADMIN_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ monitorId }),
      })
      const data = await res.json()
      if (res.ok) {
        alert(`Done! Changed: ${data.result?.changed}, Products: ${data.result?.productsExtracted}`)
      } else {
        alert(`Error: ${data.error}`)
      }
    } finally {
      setTriggering(null)
      fetchMonitors()
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/monitors/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_active: !current }),
    })
    setMonitors((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_active: !current } : m))
    )
  }

  const grouped = monitors.reduce<Record<number, MonitorWithStatus[]>>((acc, m) => {
    const p = m.priority || 3
    if (!acc[p]) acc[p] = []
    acc[p].push(m)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-zinc-100">Monitors</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchMonitors}
            disabled={loading}
            className="text-sm px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              if (confirm('Run the full pipeline for all due monitors?')) {
                fetch('/api/scraper/trigger', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
                }).then((r) => r.json()).then((d) => {
                  alert(`Pipeline complete. Checked: ${d.monitorsChecked}, Changed: ${d.changed}`)
                  fetchMonitors()
                })
              }
            }}
            className="text-sm px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold transition-colors"
          >
            Run Full Pipeline
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading...</div>
      ) : (
        <div className="space-y-8">
          {[1, 2, 3, 4].map((priority) => {
            const group = grouped[priority] || []
            if (group.length === 0) return null
            const pInfo = PRIORITY_LABELS[priority]
            return (
              <section key={priority}>
                <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${pInfo.color}`}>
                  {pInfo.label}
                  <span className="text-zinc-600 font-normal ml-2">({group.length} monitors)</span>
                </h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left py-3 px-4 text-xs text-zinc-500">Monitor</th>
                        <th className="text-left py-3 px-4 text-xs text-zinc-500 hidden md:table-cell">Type</th>
                        <th className="text-left py-3 px-4 text-xs text-zinc-500 hidden lg:table-cell">Last Checked</th>
                        <th className="text-left py-3 px-4 text-xs text-zinc-500 hidden lg:table-cell">Last Changed</th>
                        <th className="text-left py-3 px-4 text-xs text-zinc-500">Next Check</th>
                        <th className="py-3 px-4 text-xs text-zinc-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((m) => (
                        <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                          <td className="py-3 px-4">
                            <p className="text-sm font-medium text-zinc-100">{m.label || m.url.slice(0, 40)}</p>
                            {m.source && <p className="text-xs text-zinc-500">{m.source.name}</p>}
                            <a href={m.url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-zinc-600 hover:text-zinc-400 truncate block max-w-xs">
                              {m.url}
                            </a>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <span className="text-xs text-zinc-400">{m.monitor_type}</span>
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell text-xs text-zinc-500">
                            {m.last_checked_at ? timeAgo(m.last_checked_at) : 'Never'}
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell text-xs text-zinc-500">
                            {m.last_changed_at ? timeAgo(m.last_changed_at) : '—'}
                          </td>
                          <td className="py-3 px-4">
                            {m.is_due ? (
                              <span className="text-xs text-red-400 font-bold">DUE NOW</span>
                            ) : (
                              <span className="text-xs text-zinc-500">
                                {m.minutes_until_next !== undefined ? `${m.minutes_until_next}m` : '—'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => triggerMonitor(m.id)}
                                disabled={triggering === m.id}
                                className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors disabled:opacity-50"
                              >
                                {triggering === m.id ? '...' : 'Run'}
                              </button>
                              <button
                                onClick={() => toggleActive(m.id, m.is_active || false)}
                                className={`text-xs px-2 py-1 rounded transition-colors ${
                                  m.is_active
                                    ? 'bg-green-900/50 text-green-400'
                                    : 'bg-zinc-800 text-zinc-500'
                                }`}
                              >
                                {m.is_active ? 'On' : 'Off'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

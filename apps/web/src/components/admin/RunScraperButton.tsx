'use client'

import { useState } from 'react'
import { triggerScraper } from '@/app/admin/actions'

export function RunScraperButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setResult(null)
    try {
      const data = await triggerScraper()
      if (data.error) {
        setResult(`Error: ${data.error}`)
      } else {
        setResult(`Done — ${data.monitorsChecked ?? 0} monitors checked, ${data.detectionsCreated ?? 0} detections`)
      }
    } catch {
      setResult('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-sm px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg font-bold transition-colors"
      >
        {loading ? 'Running…' : 'Run Scraper'}
      </button>
      {result && <span className="text-xs text-zinc-400">{result}</span>}
    </div>
  )
}

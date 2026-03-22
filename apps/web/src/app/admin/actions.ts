'use server'

import { runPipeline } from '@/lib/scraper/pipeline'

export async function triggerScraper() {
  // This runs server-side only — ADMIN_SECRET is never sent to the browser.
  // Add a simple password check here if you want to protect this further
  // (e.g. via a login cookie). For now the /admin route itself should be
  // protected by middleware or a login page.
  try {
    const results = await runPipeline()
    return {
      monitorsChecked: results.length,
      detectionsCreated: results.reduce((sum, r) => sum + r.detectionsCreated, 0),
      changed: results.filter((r) => r.changed).length,
      errors: results.flatMap((r) => r.errors).filter(Boolean),
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

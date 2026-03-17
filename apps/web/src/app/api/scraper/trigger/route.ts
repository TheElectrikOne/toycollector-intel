import { NextRequest, NextResponse } from 'next/server'
import { runPipeline, runPipelineForMonitor } from '@/lib/scraper/pipeline'
import { db } from '@/lib/db'
import { page_monitors, sources } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { monitorId } = body as { monitorId?: string }

    if (monitorId) {
      // Run pipeline for a specific monitor
      const monitor = await db.query.page_monitors.findFirst({
        where: eq(page_monitors.id, monitorId),
      })

      if (!monitor) {
        return NextResponse.json({ error: 'Monitor not found' }, { status: 404 })
      }

      const source = monitor.source_id
        ? await db.query.sources.findFirst({ where: eq(sources.id, monitor.source_id) })
        : undefined

      const result = await runPipelineForMonitor({ ...monitor, source: source ?? undefined })
      return NextResponse.json({ success: true, result })
    }

    // Run full pipeline
    const results = await runPipeline()

    return NextResponse.json({
      success: true,
      monitorsChecked: results.length,
      changed: results.filter((r) => r.changed).length,
      detectionsCreated: results.reduce((sum, r) => sum + r.detectionsCreated, 0),
      errors: results.flatMap((r) => r.errors).filter(Boolean),
      results,
    })
  } catch (err) {
    console.error('Pipeline trigger error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

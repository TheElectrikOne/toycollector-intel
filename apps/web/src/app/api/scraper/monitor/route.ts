import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { page_monitors } from '@/lib/db/schema'
import { isAdminAuthenticated } from '@/lib/utils'

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const monitors = await db.query.page_monitors.findMany({
      with: { source: true },
      orderBy: (m, { asc }) => [asc(m.priority), asc(m.label)],
    })

    const now = new Date()

    const withStatus = monitors.map((m) => {
      const nextCheck = m.last_checked_at
        ? new Date(m.last_checked_at.getTime() + (m.check_interval || 3600) * 1000)
        : now
      const isDue = nextCheck <= now
      const minutesUntilNext = Math.max(0, Math.round((nextCheck.getTime() - now.getTime()) / 60000))

      return {
        ...m,
        is_due: isDue,
        next_check_at: nextCheck.toISOString(),
        minutes_until_next: minutesUntilNext,
      }
    })

    return NextResponse.json({
      monitors: withStatus,
      total: monitors.length,
      due: withStatus.filter((m) => m.is_due).length,
    })
  } catch (err) {
    console.error('Monitor list error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

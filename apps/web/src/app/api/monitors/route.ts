import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { page_monitors } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const priority = searchParams.get('priority')

  try {
    const monitors = await db.query.page_monitors.findMany({
      where: (m, { eq, and }) => {
        const conditions = []
        if (priority) conditions.push(eq(m.priority, parseInt(priority)))
        return conditions.length === 0 ? undefined : and(...conditions)
      },
      with: { source: true },
      orderBy: (m, { asc }) => [asc(m.priority), asc(m.label)],
    })

    return NextResponse.json({ monitors, count: monitors.length })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { source_id, url, label, monitor_type, check_interval, priority } = body

    if (!url || !monitor_type) {
      return NextResponse.json({ error: 'url and monitor_type are required' }, { status: 400 })
    }

    const [monitor] = await db
      .insert(page_monitors)
      .values({
        source_id,
        url,
        label,
        monitor_type,
        check_interval: check_interval || 3600,
        priority: priority || 3,
        is_active: true,
      })
      .returning()

    return NextResponse.json({ monitor }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

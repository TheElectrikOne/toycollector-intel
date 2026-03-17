import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { preorder_alerts, products } from '@/lib/db/schema'
import { eq, and, desc, gte } from 'drizzle-orm'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const region = searchParams.get('region') || 'US'
  const alertType = searchParams.get('alert_type')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const alerts = await db.query.preorder_alerts.findMany({
      where: (a, { eq, and }) => {
        const conditions = [eq(a.is_active, true)]
        if (region !== 'all') conditions.push(eq(a.region, region))
        if (alertType) conditions.push(eq(a.alert_type, alertType))
        return and(...conditions)
      },
      with: {
        product: {
          with: {
            release_dates: {
              where: (d, { eq }) => eq(d.is_current, true),
              limit: 1,
            },
          },
        },
      },
      orderBy: [desc(preorder_alerts.detected_at)],
      limit,
      offset,
    })

    // Filter out expired alerts
    const now = new Date()
    const activeAlerts = alerts.filter(
      (a) => !a.expires_at || a.expires_at > now
    )

    return NextResponse.json({
      alerts: activeAlerts,
      count: activeAlerts.length,
      region,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

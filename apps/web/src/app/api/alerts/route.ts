import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { preorder_alerts } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') !== 'false'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const alerts = await db.query.preorder_alerts.findMany({
      where: activeOnly ? eq(preorder_alerts.is_active, true) : undefined,
      with: { product: true },
      orderBy: [desc(preorder_alerts.detected_at)],
      limit,
      offset,
    })

    return NextResponse.json({ alerts, count: alerts.length })
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
    const {
      product_id,
      retailer,
      retailer_url,
      alert_type,
      price,
      region,
      expires_at,
      confidence,
    } = body

    if (!retailer || !alert_type) {
      return NextResponse.json({ error: 'retailer and alert_type are required' }, { status: 400 })
    }

    const [alert] = await db
      .insert(preorder_alerts)
      .values({
        product_id,
        retailer,
        retailer_url,
        alert_type,
        price,
        region: region || 'US',
        expires_at: expires_at ? new Date(expires_at) : undefined,
        confidence: confidence || 'unverified',
        is_active: true,
        detected_at: new Date(),
      })
      .returning()

    return NextResponse.json({ alert }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { raw_detections } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'pending'
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const detections = await db.query.raw_detections.findMany({
      where: status === 'all' ? undefined : eq(raw_detections.processing_status, status),
      with: { source: true },
      orderBy: [desc(raw_detections.detected_at)],
      limit,
      offset,
    })

    return NextResponse.json({ detections, count: detections.length })
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
    const { source_id, source_url, raw_html, extracted_json } = body

    if (!source_url) {
      return NextResponse.json({ error: 'source_url is required' }, { status: 400 })
    }

    const [detection] = await db
      .insert(raw_detections)
      .values({
        source_id,
        source_url,
        raw_html,
        extracted_json,
        processing_status: 'pending',
        detected_at: new Date(),
      })
      .returning()

    return NextResponse.json({ detection }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

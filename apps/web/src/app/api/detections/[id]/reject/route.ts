import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { raw_detections } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { reason } = body as { reason?: string }

    const [updated] = await db
      .update(raw_detections)
      .set({
        processing_status: 'rejected',
        notes: reason ? `Rejected: ${reason}` : 'Rejected by admin',
      })
      .where(eq(raw_detections.id, params.id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Detection not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, detection: updated })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

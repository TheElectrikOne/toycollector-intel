import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { raw_detections } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const detection = await db.query.raw_detections.findFirst({
      where: eq(raw_detections.id, params.id),
      with: { source: true },
    })

    if (!detection) {
      return NextResponse.json({ error: 'Detection not found' }, { status: 404 })
    }

    return NextResponse.json({ detection })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { processing_status, notes, assigned_to, extracted_json } = body

    const [updated] = await db
      .update(raw_detections)
      .set({
        ...(processing_status ? { processing_status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(assigned_to !== undefined ? { assigned_to } : {}),
        ...(extracted_json !== undefined ? { extracted_json } : {}),
      })
      .where(eq(raw_detections.id, params.id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Detection not found' }, { status: 404 })
    }

    return NextResponse.json({ detection: updated })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [deleted] = await db
      .delete(raw_detections)
      .where(eq(raw_detections.id, params.id))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: 'Detection not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

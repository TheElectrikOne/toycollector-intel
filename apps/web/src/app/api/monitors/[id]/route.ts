import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { page_monitors } from '@/lib/db/schema'
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
    const monitor = await db.query.page_monitors.findFirst({
      where: eq(page_monitors.id, params.id),
      with: { source: true },
    })

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 })
    }

    return NextResponse.json({ monitor })
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

    const [updated] = await db
      .update(page_monitors)
      .set(body)
      .where(eq(page_monitors.id, params.id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 })
    }

    return NextResponse.json({ monitor: updated })
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
      .delete(page_monitors)
      .where(eq(page_monitors.id, params.id))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

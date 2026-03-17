import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sources } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const source = await db.query.sources.findFirst({
      where: eq(sources.id, params.id),
      with: { page_monitors: true },
    })

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    return NextResponse.json({ source })
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
      .update(sources)
      .set(body)
      .where(eq(sources.id, params.id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    return NextResponse.json({ source: updated })
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
    const [deleted] = await db.delete(sources).where(eq(sources.id, params.id)).returning()

    if (!deleted) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

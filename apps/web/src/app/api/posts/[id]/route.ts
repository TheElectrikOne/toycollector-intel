import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { news_posts } from '@/lib/db/schema'
import { eq, or } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const isAdmin = isAdminAuthenticated(request)

    const post = await db.query.news_posts.findFirst({
      where: (p, { eq, or, and }) => {
        const idMatch = or(eq(p.id, params.id), eq(p.slug, params.id))
        if (!isAdmin) {
          return and(idMatch, eq(p.status, 'published'))
        }
        return idMatch
      },
      with: { primary_source: true, detection: true },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ post })
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
      .update(news_posts)
      .set({
        ...body,
        updated_at: new Date(),
      })
      .where(eq(news_posts.id, params.id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ post: updated })
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
      .delete(news_posts)
      .where(eq(news_posts.id, params.id))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

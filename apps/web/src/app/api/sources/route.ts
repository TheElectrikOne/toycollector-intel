import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sources } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const sourceType = searchParams.get('source_type')
  const activeOnly = searchParams.get('active') !== 'false'

  try {
    const items = await db.query.sources.findMany({
      where: (s, { eq, and }) => {
        const conditions = []
        if (activeOnly) conditions.push(eq(s.active, true))
        if (sourceType) conditions.push(eq(s.source_type, sourceType))
        return conditions.length === 0 ? undefined : and(...conditions)
      },
      orderBy: (s, { desc, asc }) => [desc(s.trust_level), asc(s.name)],
    })

    return NextResponse.json({ sources: items, count: items.length })
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
    const { name, url, source_type, trust_level, brand_affiliation, language, notes } = body

    if (!name || !url || !source_type || trust_level === undefined) {
      return NextResponse.json(
        { error: 'name, url, source_type, and trust_level are required' },
        { status: 400 }
      )
    }

    if (trust_level < 1 || trust_level > 5) {
      return NextResponse.json({ error: 'trust_level must be between 1 and 5' }, { status: 400 })
    }

    const [source] = await db
      .insert(sources)
      .values({ name, url, source_type, trust_level, brand_affiliation, language, notes })
      .returning()

    return NextResponse.json({ source }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

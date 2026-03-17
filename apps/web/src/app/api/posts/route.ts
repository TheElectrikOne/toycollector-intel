import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { news_posts } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'
import { generatePostSlug } from '@/lib/content/slugify'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const postType = searchParams.get('post_type')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')
  const adminMode = isAdminAuthenticated(request)

  try {
    const posts = await db.query.news_posts.findMany({
      where: (p, { eq, and }) => {
        const conditions = []
        if (!adminMode) {
          conditions.push(eq(p.status, 'published'))
        } else if (status) {
          conditions.push(eq(p.status, status))
        }
        if (postType) conditions.push(eq(p.post_type, postType))
        return conditions.length === 0 ? undefined : and(...conditions)
      },
      with: { primary_source: true },
      orderBy: [desc(news_posts.published_at), desc(news_posts.updated_at)],
      limit,
      offset,
    })

    return NextResponse.json({ posts, count: posts.length })
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
      headline,
      summary,
      body_markdown,
      body_html,
      post_type,
      confidence_label,
      product_ids,
      source_ids,
      primary_source_id,
      detection_id,
      author,
      status,
      seo_title,
      seo_description,
      og_image_url,
    } = body

    if (!headline || !post_type || !confidence_label) {
      return NextResponse.json(
        { error: 'headline, post_type, and confidence_label are required' },
        { status: 400 }
      )
    }

    const slug = generatePostSlug(headline)

    const [post] = await db
      .insert(news_posts)
      .values({
        slug,
        headline,
        summary,
        body_markdown,
        body_html,
        post_type,
        confidence_label,
        product_ids,
        source_ids,
        primary_source_id,
        detection_id,
        author: author || 'editorial',
        status: status || 'draft',
        seo_title,
        seo_description,
        og_image_url,
        detected_at: new Date(),
      })
      .returning()

    return NextResponse.json({ post }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

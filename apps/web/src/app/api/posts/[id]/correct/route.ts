import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { news_posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'
import { generatePostSlug } from '@/lib/content/slugify'
import { generateCorrectionTemplate } from '@/lib/content/templates'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      correction_note,
      what_was_reported,
      what_is_accurate,
      changed_fields,
      corrected_by,
      source_of_correction,
    } = body

    if (!correction_note || !what_was_reported || !what_is_accurate) {
      return NextResponse.json(
        { error: 'correction_note, what_was_reported, and what_is_accurate are required' },
        { status: 400 }
      )
    }

    const post = await db.query.news_posts.findFirst({
      where: eq(news_posts.id, params.id),
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const correctedAt = new Date()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toyintel.com'
    const postUrl = `${siteUrl}/news/${post.slug}`

    const correctionMarkdown = generateCorrectionTemplate({
      originalPostSlug: post.slug,
      originalPostHeadline: post.headline,
      originalPostUrl: postUrl,
      publishedAt: post.published_at || post.updated_at || new Date(),
      correctedAt,
      correctedBy: corrected_by || 'editorial',
      whatWasReported: what_was_reported,
      whatIsAccurate: what_is_accurate,
      changedFields: changed_fields || [],
      correctionNote: correction_note,
      sourceOfCorrection: source_of_correction,
    })

    // Create a new correction post
    const correctionSlug = generatePostSlug(`correction-${post.headline}`)

    const [correctionPost] = await db
      .insert(news_posts)
      .values({
        slug: correctionSlug,
        headline: `Correction: ${post.headline}`,
        summary: correction_note,
        body_markdown: correctionMarkdown,
        post_type: 'correction',
        confidence_label: 'confirmed',
        primary_source_id: post.primary_source_id ?? undefined,
        detection_id: post.detection_id ?? undefined,
        author: corrected_by || 'editorial',
        status: 'published',
        published_at: correctedAt,
        detected_at: correctedAt,
        correction_note,
      })
      .returning()

    // Mark original post as corrected
    await db
      .update(news_posts)
      .set({
        status: 'corrected',
        correction_note,
        updated_at: correctedAt,
      })
      .where(eq(news_posts.id, params.id))

    return NextResponse.json({
      success: true,
      original_post_id: params.id,
      correction_post: correctionPost,
    })
  } catch (err) {
    console.error('Correct post error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

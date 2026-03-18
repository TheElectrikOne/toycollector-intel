import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { raw_detections, news_posts, sources } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'
import { generateArticle } from '@/lib/ai/articleGeneration'
import { generatePostSlug } from '@/lib/content/slugify'

export async function POST(
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

    if (!detection.extracted_json) {
      return NextResponse.json(
        { error: 'Detection has no extracted data. Run extraction first.' },
        { status: 422 }
      )
    }

    const extractedData = detection.extracted_json as {
      product?: Record<string, unknown>
      classification?: {
        post_type?: string
        confidence_label?: string
      }
      source_trust_level?: number
      source_type?: string
    }

    const product = extractedData.product || {}
    const classification = extractedData.classification || {}
    const trustLevel = extractedData.source_trust_level ?? 3
    const sourceName = detection.source?.name || 'Unknown Source'

    // Generate article using Claude
    const article = await generateArticle(
      product as unknown as Parameters<typeof generateArticle>[0],
      {
        post_type: (classification.post_type || 'reveal') as Parameters<typeof generateArticle>[1]['post_type'],
        confidence_label: (classification.confidence_label || 'unverified') as Parameters<typeof generateArticle>[1]['confidence_label'],
        urgency: 'standard',
        audience_segments: [],
        requires_corroboration: trustLevel < 3,
        classification_reasoning: '',
      },
      sourceName,
      trustLevel
    )

    const slug = generatePostSlug(article.headline)

    // Create draft post
    const [post] = await db
      .insert(news_posts)
      .values({
        slug,
        headline: article.headline,
        summary: article.summary,
        body_markdown: article.body_markdown,
        post_type: (classification.post_type || 'reveal') as string,
        confidence_label: (classification.confidence_label || 'unverified') as string,
        primary_source_id: detection.source_id ?? undefined,
        detection_id: detection.id,
        status: 'draft',
        detected_at: detection.detected_at,
        seo_title: article.seo_title,
        seo_description: article.seo_description,
      })
      .returning()

    // Update detection status
    await db
      .update(raw_detections)
      .set({ processing_status: 'reviewed' })
      .where(eq(raw_detections.id, params.id))

    return NextResponse.json({
      success: true,
      post,
      article,
    })
  } catch (err) {
    console.error('Approve detection error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

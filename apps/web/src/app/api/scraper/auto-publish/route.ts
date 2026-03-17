/**
 * POST /api/scraper/auto-publish
 *
 * Called by the Python scraper for high-trust detections that should
 * bypass the manual review queue and publish immediately.
 *
 * Only trust level >= AUTO_PUBLISH_MIN_TRUST_LEVEL (default 5) triggers this.
 * Authenticated by ADMIN_SECRET (same secret the scraper uses).
 *
 * Flow: extracted detection → generate article → create post → publish → Discord
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { raw_detections, news_posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'
import { generateArticle } from '@/lib/ai/articleGeneration'
import { generatePostSlug } from '@/lib/content/slugify'
import { sendDiscordEmbed } from '@/lib/social/discord'

const AUTO_PUBLISH_MIN_TRUST = parseInt(
  process.env.AUTO_PUBLISH_MIN_TRUST_LEVEL ?? '5',
  10
)

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { detection_id: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { detection_id } = body
  if (!detection_id) {
    return NextResponse.json({ error: 'detection_id required' }, { status: 400 })
  }

  const detection = await db.query.raw_detections.findFirst({
    where: eq(raw_detections.id, detection_id),
    with: { source: true },
  })

  if (!detection) {
    return NextResponse.json({ error: 'Detection not found' }, { status: 404 })
  }

  if (!detection.extracted_json) {
    return NextResponse.json(
      { error: 'Detection has no extracted data' },
      { status: 422 }
    )
  }

  const extractedData = detection.extracted_json as {
    products?: Array<Record<string, unknown>>
    product?: Record<string, unknown>
    classification?: { post_type?: string; confidence_label?: string }
    source_trust_level?: number
    source_type?: string
  }

  const trustLevel = extractedData.source_trust_level ?? detection.source?.trust_level ?? 3

  // Safety check — only auto-publish if trust meets threshold
  if (trustLevel < AUTO_PUBLISH_MIN_TRUST) {
    return NextResponse.json(
      {
        error: `Trust level ${trustLevel} is below auto-publish threshold ${AUTO_PUBLISH_MIN_TRUST}`,
        queued: true,
      },
      { status: 403 }
    )
  }

  // Use first product if products array, or top-level product
  const products = extractedData.products || (extractedData.product ? [extractedData.product] : [])
  if (products.length === 0) {
    return NextResponse.json({ error: 'No products in detection' }, { status: 422 })
  }

  const product = products[0]
  const classification = extractedData.classification || {}
  const sourceName = detection.source?.name || 'Official Source'

  // Generate article with Claude
  const article = await generateArticle(
    product as Parameters<typeof generateArticle>[0],
    {
      post_type: (classification.post_type || 'reveal') as Parameters<typeof generateArticle>[1]['post_type'],
      confidence_label: (classification.confidence_label || 'confirmed') as Parameters<typeof generateArticle>[1]['confidence_label'],
      urgency: 'high',
      audience_segments: [],
      requires_corroboration: false,
      classification_reasoning: '',
    },
    sourceName,
    trustLevel
  )

  const slug = generatePostSlug(article.headline)
  const publishedAt = new Date()

  // Create post and publish immediately (status: published, not draft)
  const [post] = await db
    .insert(news_posts)
    .values({
      slug,
      headline: article.headline,
      summary: article.summary,
      body_markdown: article.body_markdown,
      post_type: (classification.post_type || 'reveal') as string,
      confidence_label: (classification.confidence_label || 'confirmed') as string,
      primary_source_id: detection.source_id ?? undefined,
      detection_id: detection.id,
      status: 'published',
      published_at: publishedAt,
      detected_at: detection.detected_at,
      seo_title: article.seo_title,
      seo_description: article.seo_description,
      author: 'auto',
    })
    .returning()

  // Mark detection as published
  await db
    .update(raw_detections)
    .set({ processing_status: 'published' })
    .where(eq(raw_detections.id, detection_id))

  // Discord notification
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toyintel.com'
  const postUrl = `${siteUrl}/news/${post.slug}`

  if (process.env.DISCORD_WEBHOOK_URL) {
    try {
      const colorMap: Record<string, number> = {
        confirmed: 0x22c55e,
        estimated: 0xeab308,
        retailer_placeholder: 0x3b82f6,
        unverified: 0xef4444,
      }
      await sendDiscordEmbed(process.env.DISCORD_WEBHOOK_URL, {
        title: `[AUTO] ${post.headline}`,
        description: post.summary || undefined,
        url: postUrl,
        color: colorMap[post.confidence_label] || 0xf97316,
        fields: [
          { name: 'Type', value: post.post_type, inline: true },
          { name: 'Confidence', value: post.confidence_label, inline: true },
          { name: 'Source', value: sourceName, inline: true },
        ],
        footer: { text: 'ToyIntel · Auto-published' },
        timestamp: publishedAt.toISOString(),
      })
    } catch (err) {
      console.error('Discord notification failed (non-fatal):', err)
    }
  }

  return NextResponse.json({
    success: true,
    auto_published: true,
    post,
    post_url: postUrl,
  })
}

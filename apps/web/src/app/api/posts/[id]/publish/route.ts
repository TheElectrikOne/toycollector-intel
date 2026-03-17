import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { news_posts, sources } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'
import { sendDiscordEmbed } from '@/lib/social/discord'
import { generateAlerts } from '@/lib/ai/alertGeneration'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await db.query.news_posts.findFirst({
      where: eq(news_posts.id, params.id),
      with: { primary_source: true },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.status === 'published') {
      return NextResponse.json({ error: 'Post is already published' }, { status: 409 })
    }

    const publishedAt = new Date()

    const [published] = await db
      .update(news_posts)
      .set({
        status: 'published',
        published_at: publishedAt,
        updated_at: publishedAt,
      })
      .where(eq(news_posts.id, params.id))
      .returning()

    // Send Discord notification
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
          title: post.headline,
          description: post.summary || undefined,
          url: postUrl,
          color: colorMap[post.confidence_label] || 0xf97316,
          fields: [
            { name: 'Type', value: post.post_type, inline: true },
            { name: 'Confidence', value: post.confidence_label, inline: true },
            ...(post.primary_source?.name
              ? [{ name: 'Source', value: post.primary_source.name, inline: true }]
              : []),
          ],
          footer: { text: 'ToyIntel' },
          timestamp: publishedAt.toISOString(),
        })
      } catch (discordErr) {
        console.error('Discord notification failed:', discordErr)
        // Non-fatal
      }
    }

    return NextResponse.json({ success: true, post: published, post_url: postUrl })
  } catch (err) {
    console.error('Publish post error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

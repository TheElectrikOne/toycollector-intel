import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@toyintel.com'
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'ToyIntel'

export interface NewsletterPost {
  headline: string
  summary: string
  slug: string
  postType: string
  confidenceLabel: string
  brandName?: string
}

export async function sendBreakingNewsEmail(params: {
  to: string | string[]
  subject: string
  headline: string
  summary: string
  bodyHtml: string
  postUrl: string
  imageUrl?: string
}): Promise<{ id?: string; error?: string }> {
  const resend = getResend()

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${params.subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #09090b; color: #f4f4f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .header { border-bottom: 2px solid #f97316; padding-bottom: 16px; margin-bottom: 24px; }
    .site-name { color: #f97316; font-size: 20px; font-weight: 700; text-decoration: none; }
    .tagline { color: #71717a; font-size: 12px; margin-top: 4px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge-breaking { background: #7c1d1d; color: #fca5a5; border: 1px solid #991b1b; }
    h1 { font-size: 24px; font-weight: 700; color: #fafafa; line-height: 1.3; margin: 12px 0; }
    .summary { color: #a1a1aa; font-size: 15px; line-height: 1.6; margin-bottom: 20px; }
    .body { color: #d4d4d8; font-size: 14px; line-height: 1.7; }
    .cta { display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 20px; }
    .footer { border-top: 1px solid #27272a; margin-top: 40px; padding-top: 16px; color: #52525b; font-size: 12px; }
    ${params.imageUrl ? '.hero-img { width: 100%; border-radius: 8px; margin-bottom: 16px; }' : ''}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://toyintel.com'}" class="site-name">${SITE_NAME}</a>
      <div class="tagline">Toy Collector Intelligence</div>
    </div>
    ${params.imageUrl ? `<img src="${params.imageUrl}" alt="${params.headline}" class="hero-img">` : ''}
    <span class="badge badge-breaking">Breaking</span>
    <h1>${params.headline}</h1>
    <div class="summary">${params.summary}</div>
    <div class="body">${params.bodyHtml}</div>
    <a href="${params.postUrl}" class="cta">Read Full Story →</a>
    <div class="footer">
      <p>You're receiving this because you subscribed to ${SITE_NAME} breaking news alerts.</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://toyintel.com'}/unsubscribe" style="color: #71717a;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`

  try {
    const result = await resend.emails.send({
      from: `${SITE_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html,
    })

    return { id: result.data?.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

export async function sendWeeklyDigest(params: {
  to: string | string[]
  weekOf: string
  posts: NewsletterPost[]
  preorderAlerts: Array<{
    productName: string
    retailer: string
    price?: string
    url?: string
  }>
}): Promise<{ id?: string; error?: string }> {
  const resend = getResend()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toyintel.com'

  const postsHtml = params.posts
    .map(
      (p) => `<div style="border-left: 3px solid #f97316; padding-left: 12px; margin-bottom: 16px;">
        <div style="font-size: 11px; color: #71717a; text-transform: uppercase;">${p.postType}</div>
        <a href="${siteUrl}/news/${p.slug}" style="color: #fafafa; text-decoration: none; font-size: 16px; font-weight: 600;">${p.headline}</a>
        <p style="color: #a1a1aa; font-size: 13px; margin: 4px 0 0;">${p.summary}</p>
      </div>`
    )
    .join('')

  const preordersHtml = params.preorderAlerts
    .map(
      (a) => `<tr>
        <td style="padding: 8px; color: #fafafa; border-bottom: 1px solid #27272a;">${a.productName}</td>
        <td style="padding: 8px; color: #a1a1aa; border-bottom: 1px solid #27272a;">${a.retailer}</td>
        <td style="padding: 8px; color: #a1a1aa; border-bottom: 1px solid #27272a;">${a.price ? `$${a.price}` : '—'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #27272a;">${a.url ? `<a href="${a.url}" style="color: #f97316;">Order</a>` : '—'}</td>
      </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${SITE_NAME} Weekly Digest — ${params.weekOf}</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #09090b; color: #f4f4f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    h2 { color: #f97316; font-size: 18px; font-weight: 700; margin-top: 32px; margin-bottom: 12px; border-bottom: 1px solid #27272a; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px; color: #71717a; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #27272a; }
  </style>
</head>
<body>
  <div class="container">
    <div style="border-bottom: 2px solid #f97316; padding-bottom: 16px; margin-bottom: 24px;">
      <a href="${siteUrl}" style="color: #f97316; font-size: 20px; font-weight: 700; text-decoration: none;">${SITE_NAME}</a>
      <div style="color: #71717a; font-size: 12px; margin-top: 4px;">Weekly Digest — Week of ${params.weekOf}</div>
    </div>

    <h2>Top Stories This Week</h2>
    ${postsHtml}

    ${params.preorderAlerts.length > 0 ? `
    <h2>Active Preorder Alerts</h2>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Retailer</th>
          <th>Price</th>
          <th>Link</th>
        </tr>
      </thead>
      <tbody>${preordersHtml}</tbody>
    </table>
    ` : ''}

    <div style="border-top: 1px solid #27272a; margin-top: 40px; padding-top: 16px; color: #52525b; font-size: 12px;">
      <p>You're receiving this because you subscribed to the ${SITE_NAME} weekly digest.</p>
      <p><a href="${siteUrl}/unsubscribe" style="color: #71717a;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`

  try {
    const result = await resend.emails.send({
      from: `${SITE_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: `${SITE_NAME} Weekly Digest — ${params.weekOf}`,
      html,
    })

    return { id: result.data?.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

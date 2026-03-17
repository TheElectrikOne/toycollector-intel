export interface DiscordEmbed {
  title?: string
  description?: string
  url?: string
  color?: number
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
  footer?: {
    text: string
    icon_url?: string
  }
  timestamp?: string
  image?: {
    url: string
  }
  thumbnail?: {
    url: string
  }
}

export interface DiscordWebhookPayload {
  content?: string
  username?: string
  avatar_url?: string
  embeds?: DiscordEmbed[]
}

const WEBHOOK_USERNAME = 'ToyIntel'

export async function sendDiscordAlert(webhookUrl: string, message: string): Promise<void> {
  const payload: DiscordWebhookPayload = {
    content: message,
    username: WEBHOOK_USERNAME,
  }

  await postToWebhook(webhookUrl, payload)
}

export async function sendDiscordEmbed(
  webhookUrl: string,
  embed: DiscordEmbed,
  content?: string
): Promise<void> {
  const payload: DiscordWebhookPayload = {
    username: WEBHOOK_USERNAME,
    embeds: [embed],
    ...(content ? { content } : {}),
  }

  await postToWebhook(webhookUrl, payload)
}

export async function sendPreorderAlert(params: {
  productName: string
  brand: string
  retailer: string
  retailerUrl?: string
  price?: string
  confidence: string
  imageUrl?: string
}): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL_PREORDERS
  if (!webhookUrl) return

  const color = params.confidence === 'confirmed' ? 0x22c55e
    : params.confidence === 'estimated' ? 0xeab308
    : params.confidence === 'retailer_placeholder' ? 0x3b82f6
    : 0xef4444

  const embed: DiscordEmbed = {
    title: `🛒 Preorder Alert: ${params.productName}`,
    description: params.confidence === 'retailer_placeholder'
      ? `A retailer listing at **${params.retailer}** suggests this item is available for preorder. Brand has not confirmed.`
      : `**${params.productName}** is now available for preorder at **${params.retailer}**.`,
    color,
    fields: [
      { name: 'Brand', value: params.brand, inline: true },
      { name: 'Retailer', value: params.retailer, inline: true },
      ...(params.price ? [{ name: 'Price', value: `$${params.price}`, inline: true }] : []),
      { name: 'Confidence', value: params.confidence, inline: true },
      ...(params.retailerUrl ? [{ name: 'Link', value: `[Order Here](${params.retailerUrl})`, inline: false }] : []),
    ],
    footer: { text: 'ToyIntel — Toy Collector Intelligence' },
    timestamp: new Date().toISOString(),
    ...(params.imageUrl ? { thumbnail: { url: params.imageUrl } } : {}),
  }

  await sendDiscordEmbed(webhookUrl, embed)
}

export async function sendRumorAlert(params: {
  productName: string
  brand: string
  sourceUrl: string
  sourceName: string
  notes?: string
}): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL_RUMORS
  if (!webhookUrl) return

  const embed: DiscordEmbed = {
    title: `⚠️ Rumor Watch: ${params.productName}`,
    description: `Unverified information circulating about **${params.productName}** from **${params.sourceName}**.`,
    color: 0xef4444,
    fields: [
      { name: 'Brand', value: params.brand, inline: true },
      { name: 'Source', value: `[${params.sourceName}](${params.sourceUrl})`, inline: true },
      ...(params.notes ? [{ name: 'Notes', value: params.notes, inline: false }] : []),
    ],
    footer: { text: 'Unverified — ToyIntel Rumor Watch' },
    timestamp: new Date().toISOString(),
  }

  await sendDiscordEmbed(webhookUrl, embed)
}

async function postToWebhook(webhookUrl: string, payload: DiscordWebhookPayload): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Discord webhook failed: ${response.status} ${body}`)
  }
}

import { callClaude, parseJSONFromClaude, FAST_MODEL } from './client'

export interface AlertContent {
  push_notification: {
    title: string  // max 50 chars
    body: string   // max 100 chars
  }
  discord_alert: string       // max 280 chars, **bold**
  x_post: string              // max 280 chars with hashtags
  instagram_caption: string   // 150-200 chars + hashtags
  newsletter_line: string     // ~80 chars
}

export interface AlertEventData {
  product_name: string
  brand: string
  franchise?: string | null
  line?: string | null
  character?: string | null
  alert_type: string
  retailer?: string | null
  retailer_url?: string | null
  price?: string | null
  release_date?: string | null
  release_window?: string | null
  confidence: string
  source_name: string
  post_url?: string
}

const ALERT_GENERATION_SYSTEM_PROMPT = `You are an alert writer for a toy collector notification system.

Generate:
{
  "push_notification": { "title": string, "body": string },
  "discord_alert": string,
  "x_post": string,
  "instagram_caption": string,
  "newsletter_line": string
}

Rules:
- push_notification title max 50 chars, body max 100 chars
- discord_alert max 280 chars, use **bold**
- x_post max 280 chars with relevant hashtags
- instagram_caption 150-200 chars + hashtags
- newsletter_line ~80 chars
- If confidence is "retailer_placeholder", all alerts must include "(retailer listing, unconfirmed)"
- Always include source reference in discord_alert
- Never use ALL CAPS except for product line names`

export async function generateAlerts(event: AlertEventData): Promise<AlertContent> {
  const prompt = `EVENT DATA:
${JSON.stringify(event, null, 2)}`

  const response = await callClaude(prompt, {
    model: FAST_MODEL,
    maxTokens: 1024,
    systemPrompt: ALERT_GENERATION_SYSTEM_PROMPT,
  })

  return parseJSONFromClaude<AlertContent>(response)
}

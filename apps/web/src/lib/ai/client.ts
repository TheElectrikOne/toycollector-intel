import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return _client
}

export const MODEL = 'claude-opus-4-5'
export const FAST_MODEL = 'claude-haiku-4-5'

export type AnthropicMessage = Anthropic.Messages.Message

export async function callClaude(
  prompt: string,
  options: {
    model?: string
    maxTokens?: number
    temperature?: number
    systemPrompt?: string
  } = {}
): Promise<string> {
  const client = getAnthropicClient()
  const {
    model = MODEL,
    maxTokens = 4096,
    temperature = 0,
    systemPrompt,
  } = options

  const messages: Anthropic.Messages.MessageParam[] = [
    { role: 'user', content: prompt },
  ]

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages,
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  return content.text
}

export function parseJSONFromClaude<T>(text: string): T {
  // Strip markdown code fences if present
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  try {
    return JSON.parse(stripped) as T
  } catch (err) {
    throw new Error(`Failed to parse Claude JSON response: ${err}\n\nRaw text:\n${text}`)
  }
}

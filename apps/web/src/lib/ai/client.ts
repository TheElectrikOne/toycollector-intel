import OpenAI from 'openai'

let _client: OpenAI | null = null

export function getAIClient(): OpenAI {
  if (!_client) {
    if (!process.env.KIMI_API_KEY) {
      throw new Error('KIMI_API_KEY environment variable is not set')
    }
    _client = new OpenAI({
      apiKey: process.env.KIMI_API_KEY,
      baseURL: 'https://api.moonshot.cn/v1',
    })
  }
  return _client
}

// Check your Kimi API dashboard for the exact model ID string.
// Common values: "kimi-k2", "moonshot-v1-128k", "kimi-latest"
export const MODEL = process.env.KIMI_MODEL || 'kimi-k2'
export const FAST_MODEL = process.env.KIMI_FAST_MODEL || 'kimi-k2'

export async function callClaude(
  prompt: string,
  options: {
    model?: string
    maxTokens?: number
    temperature?: number
    systemPrompt?: string
  } = {}
): Promise<string> {
  const client = getAIClient()
  const {
    model = MODEL,
    maxTokens = 4096,
    temperature = 0,
    systemPrompt,
  } = options

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: prompt })

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from Kimi API')
  }

  return content
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
    throw new Error(`Failed to parse AI JSON response: ${err}\n\nRaw text:\n${text}`)
  }
}

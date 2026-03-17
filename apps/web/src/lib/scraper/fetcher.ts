export interface FetchResult {
  url: string
  html: string
  status: number
  contentType: string
  fetchedAt: Date
  error?: string
}

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (compatible; ToyIntelBot/1.0; +https://toyintel.com/bot)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
}

const TIMEOUT_MS = 30000

export async function fetchPage(url: string): Promise<FetchResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
      redirect: 'follow',
    })

    const contentType = response.headers.get('content-type') || ''
    const html = await response.text()

    return {
      url,
      html,
      status: response.status,
      contentType,
      fetchedAt: new Date(),
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        url,
        html: '',
        status: 0,
        contentType: '',
        fetchedAt: new Date(),
        error: `Request timed out after ${TIMEOUT_MS}ms`,
      }
    }
    return {
      url,
      html: '',
      status: 0,
      contentType: '',
      fetchedAt: new Date(),
      error: err instanceof Error ? err.message : String(err),
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchRSS(url: string): Promise<FetchResult> {
  const result = await fetchPage(url)
  return result
}

export function isSuccessfulFetch(result: FetchResult): boolean {
  return result.status >= 200 && result.status < 300 && !result.error && result.html.length > 0
}

export function extractTextContent(html: string): string {
  // Remove script and style tags
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()

  return text
}

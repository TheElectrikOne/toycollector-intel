import { callClaude, parseJSONFromClaude, FAST_MODEL } from './client'

export interface ExtractedProduct {
  brand: string | null
  franchise: string | null
  line: string | null
  product_name: string
  character: string | null
  scale: string | null
  product_type: string | null
  preorder_date: string | null
  release_date: string | null
  release_window: string | null
  retailer: string | null
  exclusivity: string | null
  region: string | null
  msrp: string | null
  source_url: string
  raw_date_strings: string[]
  extraction_notes: string
}

const EXTRACTION_SYSTEM_PROMPT = `You are a toy product data extractor. Given the HTML content of a web page, extract all toy product information you can find and return it as structured JSON. Be conservative — only extract what is explicitly stated on the page. Do not infer dates or prices.

For each product found, return:
{
  "brand": string | null,
  "franchise": string | null,
  "line": string | null,
  "product_name": string,
  "character": string | null,
  "scale": string | null,
  "product_type": string | null,
  "preorder_date": string | null,
  "release_date": string | null,
  "release_window": string | null,
  "retailer": string | null,
  "exclusivity": string | null,
  "region": string | null,
  "msrp": string | null,
  "source_url": string,
  "raw_date_strings": [string],
  "extraction_notes": string
}

If a field is not present on the page, return null. Do not guess. If a date is ambiguous (e.g., "Fall 2025"), capture it in release_window and leave release_date null. Return an array of product objects.`

export async function extractProductsFromHTML(
  url: string,
  html: string
): Promise<ExtractedProduct[]> {
  const truncatedHtml = html.length > 80000 ? html.slice(0, 80000) + '\n...[truncated]' : html

  const prompt = `PAGE URL: ${url}
PAGE HTML: ${truncatedHtml}`

  const response = await callClaude(prompt, {
    model: FAST_MODEL,
    maxTokens: 8192,
    systemPrompt: EXTRACTION_SYSTEM_PROMPT,
  })

  const parsed = parseJSONFromClaude<ExtractedProduct[]>(response)

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed.filter((p) => p && typeof p.product_name === 'string')
}

import { callClaude, parseJSONFromClaude, FAST_MODEL } from './client'
import { format } from 'date-fns'

export interface NormalizedDate {
  raw: string
  date_exact: string | null       // YYYY-MM-DD
  date_window_start: string | null // YYYY-MM-DD
  date_window_end: string | null   // YYYY-MM-DD
  date_label: string | null
  confidence: 'confirmed' | 'estimated' | 'retailer_placeholder' | 'unverified'
  normalization_notes: string
}

const DATE_NORMALIZATION_SYSTEM_PROMPT = `You are a date normalization engine for toy release dates. Given a list of raw date strings extracted from product pages, return normalized date data for each.

For each date string return:
{
  "raw": string,
  "date_exact": "YYYY-MM-DD" | null,
  "date_window_start": "YYYY-MM-DD" | null,
  "date_window_end": "YYYY-MM-DD" | null,
  "date_label": string | null,
  "confidence": "confirmed" | "estimated" | "retailer_placeholder" | "unverified",
  "normalization_notes": string
}

Rules:
- "Q1 2026" → window_start: 2026-01-01, window_end: 2026-03-31, label: "Q1 2026"
- "Spring 2026" → window_start: 2026-03-01, window_end: 2026-05-31, label: "Spring 2026"
- "Holiday 2025" → window_start: 2025-11-01, window_end: 2025-12-31, label: "Holiday 2025"
- If retailer uses a specific date without brand confirmation, mark confidence as "retailer_placeholder"
- Never return a date_exact unless the source explicitly states a specific day

Return a JSON array of normalized date objects.`

export async function normalizeDates(
  dateStrings: string[],
  trustLevel: number
): Promise<NormalizedDate[]> {
  if (!dateStrings || dateStrings.length === 0) {
    return []
  }

  const currentDate = format(new Date(), 'yyyy-MM-dd')

  const prompt = `INPUT DATE STRINGS: ${JSON.stringify(dateStrings)}
CURRENT DATE: ${currentDate}
SOURCE TRUST LEVEL: ${trustLevel}`

  const response = await callClaude(prompt, {
    model: FAST_MODEL,
    maxTokens: 2048,
    systemPrompt: DATE_NORMALIZATION_SYSTEM_PROMPT,
  })

  const parsed = parseJSONFromClaude<NormalizedDate[]>(response)

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
}

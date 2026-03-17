import { callClaude, parseJSONFromClaude, FAST_MODEL } from './client'
import type { ExtractedProduct } from './extraction'

export interface ClassificationResult {
  post_type: 'reveal' | 'preorder_alert' | 'release_date_update' | 'restock' | 'cancellation' | 'rumor' | 'event'
  confidence_label: 'confirmed' | 'estimated' | 'retailer_placeholder' | 'unverified'
  urgency: 'breaking' | 'high' | 'standard' | 'low'
  audience_segments: string[]
  requires_corroboration: boolean
  classification_reasoning: string
}

const CLASSIFICATION_SYSTEM_PROMPT = `You are a toy news classifier. Given a toy product record, classify it along the following dimensions. Return JSON only.

Return:
{
  "post_type": "reveal" | "preorder_alert" | "release_date_update" | "restock" | "cancellation" | "rumor" | "event",
  "confidence_label": "confirmed" | "estimated" | "retailer_placeholder" | "unverified",
  "urgency": "breaking" | "high" | "standard" | "low",
  "audience_segments": [string],
  "requires_corroboration": boolean,
  "classification_reasoning": string
}

Rules:
- If source is trust level 2 or below, confidence_label must be "retailer_placeholder" or "unverified"
- If source is trust level 5 and uses definitive date language, confidence_label is "confirmed"
- If source uses hedging language ("expected", "planned for", "tentative"), confidence_label is "estimated"
- requires_corroboration is true if trust_level < 3`

export async function classifyProduct(
  product: ExtractedProduct,
  trustLevel: number,
  sourceType: string
): Promise<ClassificationResult> {
  const prompt = `INPUT:
${JSON.stringify(product, null, 2)}

Source trust level: ${trustLevel}
Source type: ${sourceType}`

  const response = await callClaude(prompt, {
    model: FAST_MODEL,
    maxTokens: 1024,
    systemPrompt: CLASSIFICATION_SYSTEM_PROMPT,
  })

  return parseJSONFromClaude<ClassificationResult>(response)
}

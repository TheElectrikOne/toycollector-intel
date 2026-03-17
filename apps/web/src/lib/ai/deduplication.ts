import { callClaude, parseJSONFromClaude, FAST_MODEL } from './client'
import type { ExtractedProduct } from './extraction'
import type { Product } from '../db/schema'

export interface DeduplicationResult {
  is_duplicate: boolean
  duplicate_of_id: string | null
  confidence: 'certain' | 'probable' | 'possible' | 'no_match'
  reasoning: string
  recommended_action: 'skip' | 'update_existing' | 'create_new' | 'manual_review'
}

interface CandidateProduct {
  id: string
  brand: string
  franchise: string | null
  line: string | null
  product_name: string
  character: string | null
  scale: string | null
}

const DEDUPLICATION_SYSTEM_PROMPT = `You are a toy product deduplication engine. Given a new product record and a list of candidate existing records, determine if the new record is a duplicate of any existing record.

Return:
{
  "is_duplicate": boolean,
  "duplicate_of_id": string | null,
  "confidence": "certain" | "probable" | "possible" | "no_match",
  "reasoning": string,
  "recommended_action": "skip" | "update_existing" | "create_new" | "manual_review"
}

Rules:
- Same product_name + brand + line at same scale = certain duplicate
- Same character + brand + line but slightly different name phrasing = probable duplicate
- Same franchise + similar name but different product line = possible duplicate
- If the new record has a higher-trust source with a different date than the existing, recommend update_existing and flag the date change`

export async function checkForDuplicate(
  newProduct: ExtractedProduct,
  candidates: CandidateProduct[]
): Promise<DeduplicationResult> {
  if (!candidates || candidates.length === 0) {
    return {
      is_duplicate: false,
      duplicate_of_id: null,
      confidence: 'no_match',
      reasoning: 'No candidate products to compare against',
      recommended_action: 'create_new',
    }
  }

  const prompt = `NEW RECORD:
${JSON.stringify(newProduct, null, 2)}

CANDIDATE EXISTING RECORDS:
${JSON.stringify(candidates, null, 2)}`

  const response = await callClaude(prompt, {
    model: FAST_MODEL,
    maxTokens: 1024,
    systemPrompt: DEDUPLICATION_SYSTEM_PROMPT,
  })

  return parseJSONFromClaude<DeduplicationResult>(response)
}

export function buildCandidateList(
  products: Product[],
  newProduct: ExtractedProduct
): CandidateProduct[] {
  // Filter candidates by brand/franchise similarity before sending to Claude
  const brandLower = (newProduct.brand || '').toLowerCase()
  const franchiseLower = (newProduct.franchise || '').toLowerCase()
  const nameLower = newProduct.product_name.toLowerCase()

  return products
    .filter((p) => {
      const pBrand = p.brand.toLowerCase()
      const pFranchise = (p.franchise || '').toLowerCase()
      const pName = p.product_name.toLowerCase()

      // Rough pre-filter: must share brand or franchise
      const brandMatch = pBrand === brandLower || pBrand.includes(brandLower) || brandLower.includes(pBrand)
      const franchiseMatch = franchiseLower && pFranchise && (
        pFranchise.includes(franchiseLower) || franchiseLower.includes(pFranchise)
      )
      // Also check if names share significant overlap
      const nameWords = nameLower.split(/\s+/).filter((w) => w.length > 3)
      const nameOverlap = nameWords.some((w) => pName.includes(w))

      return brandMatch || franchiseMatch || nameOverlap
    })
    .slice(0, 20) // Limit candidates to avoid overwhelming the prompt
    .map((p) => ({
      id: p.id,
      brand: p.brand,
      franchise: p.franchise,
      line: p.line,
      product_name: p.product_name,
      character: p.character,
      scale: p.scale,
    }))
}

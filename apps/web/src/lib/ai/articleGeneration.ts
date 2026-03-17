import { callClaude, parseJSONFromClaude, MODEL } from './client'
import type { ExtractedProduct } from './extraction'
import type { ClassificationResult } from './classification'

export interface GeneratedArticle {
  headline: string
  summary: string
  body_markdown: string
  seo_title: string
  seo_description: string
}

const ARTICLE_GENERATION_SYSTEM_PROMPT = `You are an editorial writer for a collector-focused toy news site. Write for adult collectors who are knowledgeable about the hobby. Do not write marketing copy — write accurate, useful editorial content.

Write:
1. headline: compelling, accurate, does not overstate confidence. Max 70 characters.
2. summary: 1–2 sentences, factual. Max 160 characters.
3. body: 150–300 words. Lead with the most important fact. Include source attribution inline. Include what is known, what is unknown, and what collectors should watch for. End with a call to action.
4. seo_title: brand + product name + year. Max 60 characters.
5. seo_description: primary keyword + call to action. Max 155 characters.

Return JSON: { headline, summary, body_markdown, seo_title, seo_description }

Confidence label instruction:
- confirmed → write factually
- estimated → include "is expected" or "is scheduled for"
- retailer_placeholder → write "A retailer listing suggests..." and note brand has not confirmed
- unverified → write as Rumor Watch with appropriate hedging

Do not invent quotes. Do not add information not in the product data.`

export async function generateArticle(
  product: ExtractedProduct,
  classification: ClassificationResult,
  sourceName: string,
  trustLevel: number
): Promise<GeneratedArticle> {
  const prompt = `PRODUCT DATA:
${JSON.stringify(product, null, 2)}

POST TYPE: ${classification.post_type}
CONFIDENCE LABEL: ${classification.confidence_label}
PRIMARY SOURCE: ${sourceName} (trust level: ${trustLevel})`

  const response = await callClaude(prompt, {
    model: MODEL,
    maxTokens: 2048,
    systemPrompt: ARTICLE_GENERATION_SYSTEM_PROMPT,
  })

  return parseJSONFromClaude<GeneratedArticle>(response)
}

export async function regenerateArticleSection(
  article: GeneratedArticle,
  section: keyof GeneratedArticle,
  feedback: string
): Promise<string> {
  const prompt = `You are an editorial writer for a collector-focused toy news site.

The following article section needs to be rewritten based on editor feedback.

SECTION: ${section}
CURRENT TEXT: ${article[section]}
EDITOR FEEDBACK: ${feedback}

Return only the rewritten ${section} as a plain string (no JSON wrapper, no markdown fences).`

  const response = await callClaude(prompt, {
    model: MODEL,
    maxTokens: 1024,
  })

  return response.trim()
}

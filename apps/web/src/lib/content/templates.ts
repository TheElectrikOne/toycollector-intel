import { format } from 'date-fns'

// ─── Template 1: Breaking News ─────────────────────────────────────────────────

export interface BreakingNewsData {
  headline: string
  confidence: 'confirmed' | 'estimated' | 'retailer_placeholder' | 'unverified'
  sourceName: string
  sourceUrl: string
  sourceTrustLevel: number
  detectedAt: Date
  publishedAt?: Date
  productName: string
  brand: string
  franchise?: string | null
  line?: string | null
  scale?: string | null
  msrp?: string | null
  releaseDate?: string | null
  releaseWindow?: string | null
  preorderDate?: string | null
  exclusivity?: string | null
  region?: string | null
  whatWeKnow: string[]
  whatWeDoNotKnow: string[]
  summary: string
}

export function generateBreakingNewsTemplate(data: BreakingNewsData): string {
  const confidenceLabels: Record<string, string> = {
    confirmed: 'CONFIRMED',
    estimated: 'ESTIMATED',
    retailer_placeholder: 'RETAILER LISTING (UNCONFIRMED)',
    unverified: 'UNVERIFIED',
  }

  const confidenceBadge = confidenceLabels[data.confidence] || data.confidence.toUpperCase()
  const detectedStr = format(data.detectedAt, 'PPPp')
  const publishedStr = data.publishedAt ? format(data.publishedAt, 'PPPp') : 'Not yet published'

  const knowTable = data.whatWeKnow
    .map((item) => `| ✓ | ${item} |`)
    .join('\n')

  const dontKnowTable = data.whatWeDoNotKnow
    .map((item) => `| ? | ${item} |`)
    .join('\n')

  return `# ${data.headline}

**Status:** ${confidenceBadge}
**Source:** [${data.sourceName}](${data.sourceUrl}) (Trust Level: ${data.sourceTrustLevel}/5)
**Detected:** ${detectedStr}
**Published:** ${publishedStr}

---

${data.summary}

## What We Know

| | Detail |
|---|---|
| Product | ${data.productName} |
| Brand | ${data.brand} |
${data.franchise ? `| Franchise | ${data.franchise} |\n` : ''}${data.line ? `| Line | ${data.line} |\n` : ''}${data.scale ? `| Scale | ${data.scale} |\n` : ''}${data.msrp ? `| MSRP | $${data.msrp} |\n` : ''}${data.releaseDate ? `| Release Date | ${data.releaseDate} |\n` : ''}${data.releaseWindow ? `| Release Window | ${data.releaseWindow} |\n` : ''}${data.preorderDate ? `| Preorder Date | ${data.preorderDate} |\n` : ''}${data.exclusivity ? `| Exclusivity | ${data.exclusivity} |\n` : ''}${data.region ? `| Region | ${data.region} |\n` : ''}
${knowTable}

## What We Don't Know Yet

| | |
|---|---|
${dontKnowTable}

---

**Source:** [${data.sourceName}](${data.sourceUrl})

*This article was auto-generated from source monitoring. Editorial review has been applied.*
`
}

// ─── Template 2: Release Date Entry ──────────────────────────────────────────

export interface ReleaseDateEntryData {
  productName: string
  brand: string
  franchise?: string | null
  line?: string | null
  scale?: string | null
  productType?: string | null
  sku?: string | null
  msrp?: string | null
  status: string
  imageUrl?: string | null
  officialPageUrl?: string | null
  releaseDates: Array<{
    date_type: string
    date_exact?: string | null
    date_window_start?: string | null
    date_window_end?: string | null
    date_label?: string | null
    confidence: string
    source_name?: string
    notes?: string | null
    is_current?: boolean | null
  }>
  notes?: string
}

export function generateReleaseDateEntryTemplate(data: ReleaseDateEntryData): string {
  const dateRows = data.releaseDates
    .map((d) => {
      const dateStr = d.date_exact
        || (d.date_window_start && d.date_window_end
          ? `${d.date_window_start} – ${d.date_window_end}`
          : d.date_label || 'Unknown')
      const currentFlag = d.is_current ? ' *(current)*' : ''
      return `| ${d.date_type} | ${dateStr}${currentFlag} | ${d.confidence} | ${d.source_name || '—'} | ${d.notes || '—'} |`
    })
    .join('\n')

  return `# ${data.productName} — Release Date Tracker

## Product Details

| Field | Value |
|---|---|
| Brand | ${data.brand} |
${data.franchise ? `| Franchise | ${data.franchise} |\n` : ''}${data.line ? `| Line | ${data.line} |\n` : ''}${data.scale ? `| Scale | ${data.scale} |\n` : ''}${data.productType ? `| Type | ${data.productType} |\n` : ''}${data.sku ? `| SKU | ${data.sku} |\n` : ''}${data.msrp ? `| MSRP | $${data.msrp} |\n` : ''}| Status | ${data.status} |
${data.officialPageUrl ? `\n[Official Product Page](${data.officialPageUrl})\n` : ''}

## Date History

| Type | Date | Confidence | Source | Notes |
|---|---|---|---|---|
${dateRows}

${data.notes ? `## Notes\n\n${data.notes}` : ''}
`
}

// ─── Template 3: Preorder Alert ───────────────────────────────────────────────

export interface PreorderAlertData {
  alertType: 'now_live' | 'closing_soon' | 'restocked' | 'cancelled'
  productName: string
  brand: string
  franchise?: string | null
  line?: string | null
  character?: string | null
  scale?: string | null
  retailer: string
  retailerUrl?: string | null
  price?: string | null
  region: string
  confidence: string
  detectedAt: Date
  expiresAt?: Date | null
  releaseWindow?: string | null
  exclusivity?: string | null
  imageUrl?: string | null
  affiliateDisclosure?: boolean
}

export function generatePreorderAlertTemplate(data: PreorderAlertData): string {
  const alertHeaders: Record<string, string> = {
    now_live: '🛒 PREORDER NOW LIVE',
    closing_soon: '⚠️ PREORDER CLOSING SOON',
    restocked: '🔄 PREORDER RESTOCKED',
    cancelled: '❌ PREORDER CANCELLED',
  }

  const header = alertHeaders[data.alertType] || data.alertType.toUpperCase()
  const detectedStr = format(data.detectedAt, 'PPPp')
  const expiresStr = data.expiresAt ? format(data.expiresAt, 'PPPp') : null

  const confidenceNote = data.confidence === 'retailer_placeholder'
    ? '> **Note:** This listing has not been officially confirmed by the brand. Retailer placeholder dates are common and subject to change.'
    : data.confidence === 'confirmed'
    ? '> **Confirmed** by official brand source.'
    : `> Confidence: **${data.confidence}**`

  return `# ${header}: ${data.productName}

${confidenceNote}

## Product Details

| Field | Value |
|---|---|
| Product | ${data.productName} |
| Brand | ${data.brand} |
${data.franchise ? `| Franchise | ${data.franchise} |\n` : ''}${data.line ? `| Line | ${data.line} |\n` : ''}${data.character ? `| Character | ${data.character} |\n` : ''}${data.scale ? `| Scale | ${data.scale} |\n` : ''}${data.exclusivity ? `| Exclusivity | ${data.exclusivity} |\n` : ''}${data.releaseWindow ? `| Est. Release | ${data.releaseWindow} |\n` : ''}| Region | ${data.region} |

## Preorder Information

| Field | Value |
|---|---|
| Retailer | ${data.retailer} |
${data.price ? `| Price | $${data.price} |\n` : ''}${data.retailerUrl ? `| Link | [Order Here](${data.retailerUrl}) |\n` : ''}| Detected | ${detectedStr} |
${expiresStr ? `| Expires | ${expiresStr} |\n` : ''}
${data.retailerUrl ? `\n**[→ Order at ${data.retailer}](${data.retailerUrl})**\n` : ''}

${data.affiliateDisclosure ? '> *Affiliate disclosure: ToyIntel may earn a commission from qualifying purchases.*' : ''}
`
}

// ─── Template 4: Rumor Watch ──────────────────────────────────────────────────

export interface RumorWatchData {
  productName: string
  brand: string
  franchise?: string | null
  sourceName: string
  sourceUrl: string
  sourceTrustLevel: number
  detectedAt: Date
  claims: string[]
  corroborationNeeded: string[]
  assessment: string
  upgradeConditions: string[]
  relatedProducts?: string[]
}

export function generateRumorWatchTemplate(data: RumorWatchData): string {
  const detectedStr = format(data.detectedAt, 'PPPp')

  const claimsList = data.claims
    .map((c) => `- ${c}`)
    .join('\n')

  const corroborationList = data.corroborationNeeded
    .map((c) => `- [ ] ${c}`)
    .join('\n')

  const upgradeList = data.upgradeConditions
    .map((c) => `- ${c}`)
    .join('\n')

  const relatedSection = data.relatedProducts?.length
    ? `\n## Related Products\n\n${data.relatedProducts.map((p) => `- ${p}`).join('\n')}\n`
    : ''

  return `# ⚠️ RUMOR WATCH: ${data.productName}

> **UNVERIFIED** — This information has not been confirmed by the brand or a trusted source. Treat as rumor only.

**Source:** [${data.sourceName}](${data.sourceUrl}) (Trust Level: ${data.sourceTrustLevel}/5)
**Detected:** ${detectedStr}

---

## Claims Circulating

${claimsList}

## What Would Need to Happen to Upgrade This

The following would be required to move this from "Rumor" to "Estimated" or "Confirmed":

${upgradeList}

## Corroboration Checklist

${corroborationList}

## Editorial Assessment

${data.assessment}

${relatedSection}

---

*ToyIntel tracks rumors so collectors can stay informed. We clearly label all unverified information. Please do not make purchasing decisions based on rumor-watch posts.*
`
}

// ─── Template 5: Correction ───────────────────────────────────────────────────

export interface CorrectionData {
  originalPostSlug: string
  originalPostHeadline: string
  originalPostUrl: string
  publishedAt: Date
  correctedAt: Date
  correctedBy: string
  whatWasReported: string
  whatIsAccurate: string
  changedFields: Array<{
    field: string
    oldValue: string
    newValue: string
  }>
  correctionNote: string
  sourceOfCorrection?: string
}

export function generateCorrectionTemplate(data: CorrectionData): string {
  const publishedStr = format(data.publishedAt, 'PPPp')
  const correctedStr = format(data.correctedAt, 'PPPp')

  const changedList = data.changedFields
    .map((f) => `- [x] **${f.field}**: ~~${f.oldValue}~~ → **${f.newValue}**`)
    .join('\n')

  return `# Correction: ${data.originalPostHeadline}

> **Correction issued ${correctedStr}** by ${data.correctedBy}
>
> [View original post](${data.originalPostUrl}) (published ${publishedStr})

---

## What Was Reported

${data.whatWasReported}

## What Is Accurate

${data.whatIsAccurate}

## What Changed

${changedList}

## Correction Note

${data.correctionNote}

${data.sourceOfCorrection ? `**Source of correction:** ${data.sourceOfCorrection}` : ''}

---

*ToyIntel is committed to accuracy. When we get something wrong, we correct it transparently. The original article has been updated with a correction notice.*
`
}

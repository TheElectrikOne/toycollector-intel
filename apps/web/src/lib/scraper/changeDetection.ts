import { createHash } from 'crypto'

export function computePageHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

export interface ChangeDetectionResult {
  hasChanged: boolean
  newHash: string
  previousHash: string | null
}

export function detectChange(
  content: string,
  previousHash: string | null
): ChangeDetectionResult {
  const newHash = computePageHash(content)
  const hasChanged = previousHash === null || newHash !== previousHash

  return {
    hasChanged,
    newHash,
    previousHash,
  }
}

export function normalizeHTMLForHashing(html: string): string {
  return html
    // Remove dynamic content that changes every load (timestamps, nonces, CSRF tokens)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\b(nonce|csrf_token|__cf_chl_tk)=['"]\w+['"]/gi, '')
    .replace(/\d{10,13}/g, '') // Remove Unix timestamps
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function computeNormalizedHash(html: string): string {
  const normalized = normalizeHTMLForHashing(html)
  return computePageHash(normalized)
}

export function detectNormalizedChange(
  html: string,
  previousHash: string | null
): ChangeDetectionResult {
  const newHash = computeNormalizedHash(html)
  const hasChanged = previousHash === null || newHash !== previousHash

  return {
    hasChanged,
    newHash,
    previousHash,
  }
}

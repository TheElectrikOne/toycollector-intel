import { db } from '../db'
import { page_monitors, raw_detections, sources, products } from '../db/schema'
import { eq, and, or, lte, isNull, lt } from 'drizzle-orm'
import { fetchPage, isSuccessfulFetch } from './fetcher'
import { detectNormalizedChange } from './changeDetection'
import { extractProductsFromHTML } from '../ai/extraction'
import { classifyProduct } from '../ai/classification'
import { normalizeDates } from '../ai/dateNormalization'
import { checkForDuplicate, buildCandidateList } from '../ai/deduplication'
import { sendDiscordAlert } from '../social/discord'
import type { PageMonitor, Source } from '../db/schema'

export interface PipelineResult {
  monitorId: string
  url: string
  changed: boolean
  productsExtracted: number
  detectionsCreated: number
  errors: string[]
}

export async function runPipelineForMonitor(
  monitor: PageMonitor & { source?: Source }
): Promise<PipelineResult> {
  const errors: string[] = []
  let productsExtracted = 0
  let detectionsCreated = 0

  // 1. Fetch the page
  const fetchResult = await fetchPage(monitor.url)

  if (!isSuccessfulFetch(fetchResult)) {
    const errMsg = fetchResult.error || `HTTP ${fetchResult.status}`
    errors.push(`Fetch failed: ${errMsg}`)

    // Update last_checked_at even on failure
    await db
      .update(page_monitors)
      .set({ last_checked_at: new Date() })
      .where(eq(page_monitors.id, monitor.id))

    return {
      monitorId: monitor.id,
      url: monitor.url,
      changed: false,
      productsExtracted: 0,
      detectionsCreated: 0,
      errors,
    }
  }

  // 2. Compute SHA256 hash and detect change
  const changeResult = detectNormalizedChange(fetchResult.html, monitor.last_hash)

  // Always update last_checked_at
  const updateData: Partial<typeof page_monitors.$inferInsert> = {
    last_checked_at: new Date(),
  }

  if (changeResult.hasChanged) {
    updateData.last_changed_at = new Date()
    updateData.last_hash = changeResult.newHash
  }

  await db
    .update(page_monitors)
    .set(updateData)
    .where(eq(page_monitors.id, monitor.id))

  if (!changeResult.hasChanged) {
    return {
      monitorId: monitor.id,
      url: monitor.url,
      changed: false,
      productsExtracted: 0,
      detectionsCreated: 0,
      errors,
    }
  }

  // 3. Store raw detection
  const [detection] = await db
    .insert(raw_detections)
    .values({
      source_id: monitor.source_id,
      source_url: monitor.url,
      page_hash: changeResult.newHash,
      raw_html: fetchResult.html.slice(0, 500000), // Cap stored HTML at 500KB
      processing_status: 'pending',
      detected_at: new Date(),
    })
    .returning()

  // 4. Extract products using Claude
  let extractedProducts
  try {
    extractedProducts = await extractProductsFromHTML(monitor.url, fetchResult.html)
    productsExtracted = extractedProducts.length
  } catch (err) {
    errors.push(`Extraction failed: ${err instanceof Error ? err.message : String(err)}`)
    await db
      .update(raw_detections)
      .set({ processing_status: 'rejected', notes: `Extraction error: ${errors[errors.length - 1]}` })
      .where(eq(raw_detections.id, detection.id))
    return {
      monitorId: monitor.id,
      url: monitor.url,
      changed: true,
      productsExtracted: 0,
      detectionsCreated: 0,
      errors,
    }
  }

  if (extractedProducts.length === 0) {
    await db
      .update(raw_detections)
      .set({
        processing_status: 'rejected',
        notes: 'No products extracted from page',
        extracted_json: { products: [] },
      })
      .where(eq(raw_detections.id, detection.id))
    return {
      monitorId: monitor.id,
      url: monitor.url,
      changed: true,
      productsExtracted: 0,
      detectionsCreated: 0,
      errors,
    }
  }

  // Get source info for trust level
  const source = monitor.source_id
    ? await db.query.sources.findFirst({ where: eq(sources.id, monitor.source_id) })
    : null

  const trustLevel = source?.trust_level ?? 3
  const sourceType = source?.source_type ?? 'community'

  // 5. Process each extracted product
  for (const product of extractedProducts) {
    try {
      // Classification
      const classification = await classifyProduct(product, trustLevel, sourceType)

      // Date normalization
      const normalizedDates = product.raw_date_strings?.length
        ? await normalizeDates(product.raw_date_strings, trustLevel)
        : []

      // Deduplication check
      const existingProducts = await db.query.products.findMany({ limit: 200 })
      const candidates = buildCandidateList(existingProducts, product)
      const deduplication = candidates.length > 0
        ? await checkForDuplicate(product, candidates)
        : {
            is_duplicate: false,
            duplicate_of_id: null,
            confidence: 'no_match' as const,
            reasoning: 'No candidates',
            recommended_action: 'create_new' as const,
          }

      const enrichedJson = {
        product,
        classification,
        normalized_dates: normalizedDates,
        deduplication,
        source_trust_level: trustLevel,
        source_type: sourceType,
      }

      // Update detection with extracted data
      await db
        .update(raw_detections)
        .set({
          extracted_json: enrichedJson,
          processing_status: deduplication.recommended_action === 'skip' ? 'duplicate' : 'extracted',
          ...(deduplication.is_duplicate ? { duplicate_of: deduplication.duplicate_of_id ?? undefined } : {}),
        })
        .where(eq(raw_detections.id, detection.id))

      detectionsCreated++

      // Send Discord alert for high-urgency preorder alerts
      if (
        classification.urgency === 'breaking' || classification.urgency === 'high'
      ) {
        if (classification.post_type === 'preorder_alert' && process.env.DISCORD_WEBHOOK_URL_PREORDERS) {
          try {
            await sendDiscordAlert(
              process.env.DISCORD_WEBHOOK_URL_PREORDERS,
              `**New Preorder Alert**: ${product.product_name} (${product.brand || 'Unknown Brand'})\nSource: ${monitor.url}\nConfidence: ${classification.confidence_label}`
            )
          } catch {
            // Non-fatal
          }
        }
      }
    } catch (err) {
      errors.push(`Product processing error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return {
    monitorId: monitor.id,
    url: monitor.url,
    changed: true,
    productsExtracted,
    detectionsCreated,
    errors,
  }
}

export async function getMonitorsDueForCheck(): Promise<PageMonitor[]> {
  const now = new Date()

  // Get monitors where last_checked_at + check_interval <= now, or never checked
  const monitors = await db.query.page_monitors.findMany({
    where: eq(page_monitors.is_active, true),
  })

  return monitors.filter((m) => {
    if (!m.last_checked_at) return true
    const nextCheck = new Date(m.last_checked_at.getTime() + (m.check_interval || 3600) * 1000)
    return nextCheck <= now
  })
}

export async function runPipeline(): Promise<PipelineResult[]> {
  const dueMonitors = await getMonitorsDueForCheck()
  const results: PipelineResult[] = []

  // Process monitors sequentially to avoid overwhelming external sites
  for (const monitor of dueMonitors) {
    const source = monitor.source_id
      ? await db.query.sources.findFirst({ where: eq(sources.id, monitor.source_id) })
      : undefined

    const result = await runPipelineForMonitor({
      ...monitor,
      source: source ?? undefined,
    })
    results.push(result)

    // Polite delay between requests
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  return results
}

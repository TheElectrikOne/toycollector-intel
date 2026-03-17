import { generateAlerts, type AlertEventData, type AlertContent } from '../ai/alertGeneration'

export interface SocialPostResult {
  success: boolean
  content?: AlertContent
  error?: string
}

export async function generateSocialPosts(event: AlertEventData): Promise<SocialPostResult> {
  try {
    const content = await generateAlerts(event)
    return { success: true, content }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export function formatXPost(text: string, hashtags: string[]): string {
  const tagString = hashtags.map((t) => `#${t.replace(/^#/, '')}`).join(' ')
  const combined = `${text}\n\n${tagString}`
  if (combined.length <= 280) return combined
  // Truncate text to fit with hashtags
  const overflow = combined.length - 280
  return `${text.slice(0, text.length - overflow - 3)}...\n\n${tagString}`
}

export function generateDefaultHashtags(params: {
  brand?: string | null
  franchise?: string | null
  alertType?: string
}): string[] {
  const tags: string[] = ['ToyCollector', 'ActionFigures']

  if (params.brand) {
    const cleanBrand = params.brand.replace(/\s+/g, '')
    tags.push(cleanBrand)
  }

  if (params.franchise) {
    const cleanFranchise = params.franchise.replace(/\s+/g, '')
    tags.push(cleanFranchise)
  }

  const alertTypeMap: Record<string, string> = {
    now_live: 'PreorderAlert',
    closing_soon: 'LastChance',
    restocked: 'RestockAlert',
    reveal: 'ToyReveal',
    preorder_alert: 'PreorderAlert',
    rumor: 'RumorWatch',
  }

  if (params.alertType && alertTypeMap[params.alertType]) {
    tags.push(alertTypeMap[params.alertType])
  }

  return [...new Set(tags)] // deduplicate
}

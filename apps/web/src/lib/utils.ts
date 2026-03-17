import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Unknown'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'Unknown'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy h:mm a')
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return 'Unknown'
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatPrice(price: string | number | null | undefined, currency = 'USD'): string {
  if (!price) return '—'
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num)
}

export function confidenceLabel(confidence: string): string {
  const labels: Record<string, string> = {
    confirmed: 'Confirmed',
    estimated: 'Estimated',
    retailer_placeholder: 'Retailer Listing',
    unverified: 'Unverified',
  }
  return labels[confidence] || confidence
}

export function postTypeLabel(postType: string): string {
  const labels: Record<string, string> = {
    reveal: 'Reveal',
    preorder_alert: 'Preorder Alert',
    release_date_update: 'Release Date',
    release_date: 'Release Date',
    restock: 'Restock',
    cancellation: 'Cancelled',
    rumor: 'Rumor Watch',
    event: 'Event',
    correction: 'Correction',
  }
  return labels[postType] || postType
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getConfidenceColor(confidence: string): string {
  switch (confidence) {
    case 'confirmed':
      return 'bg-green-900 text-green-300 border border-green-700'
    case 'estimated':
      return 'bg-yellow-900 text-yellow-300 border border-yellow-700'
    case 'retailer_placeholder':
      return 'bg-blue-900 text-blue-300 border border-blue-700'
    case 'unverified':
      return 'bg-red-900 text-red-300 border border-red-700'
    default:
      return 'bg-zinc-800 text-zinc-300 border border-zinc-700'
  }
}

export function getTrustLevelColor(level: number): string {
  if (level >= 5) return 'bg-green-900 text-green-300 border border-green-700'
  if (level >= 4) return 'bg-blue-900 text-blue-300 border border-blue-700'
  if (level >= 3) return 'bg-yellow-900 text-yellow-300 border border-yellow-700'
  if (level >= 2) return 'bg-orange-900 text-orange-300 border border-orange-700'
  return 'bg-red-900 text-red-300 border border-red-700'
}

export function getSourceTypeColor(sourceType: string): string {
  switch (sourceType) {
    case 'official_brand':
      return 'bg-purple-900 text-purple-300 border border-purple-700'
    case 'official_retailer':
      return 'bg-indigo-900 text-indigo-300 border border-indigo-700'
    case 'press':
      return 'bg-teal-900 text-teal-300 border border-teal-700'
    case 'community':
      return 'bg-cyan-900 text-cyan-300 border border-cyan-700'
    case 'rumor':
      return 'bg-red-900 text-red-300 border border-red-700'
    default:
      return 'bg-zinc-800 text-zinc-300 border border-zinc-700'
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isAdminAuthenticated(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  const token = authHeader.replace('Bearer ', '')
  return token === process.env.ADMIN_SECRET
}

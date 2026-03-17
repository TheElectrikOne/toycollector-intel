import SlugifyLib from 'slugify'

export function slugify(text: string): string {
  return SlugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
    replacement: '-',
  })
}

export function generatePostSlug(headline: string, date?: Date): string {
  const datePart = (date || new Date()).toISOString().slice(0, 10).replace(/-/g, '')
  const base = slugify(headline).slice(0, 60)
  return `${datePart}-${base}`
}

export function generateProductSlug(brand: string, productName: string): string {
  const combined = `${brand} ${productName}`
  return slugify(combined).slice(0, 100)
}

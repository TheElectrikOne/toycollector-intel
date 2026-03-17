import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { eq, ilike, desc } from 'drizzle-orm'
import { isAdminAuthenticated } from '@/lib/utils'
import { generateProductSlug } from '@/lib/content/slugify'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const brand = searchParams.get('brand')
  const franchise = searchParams.get('franchise')
  const status = searchParams.get('status')
  const search = searchParams.get('q')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const items = await db.query.products.findMany({
      where: (p, { eq, ilike, and }) => {
        const conditions = []
        if (brand) conditions.push(eq(p.brand, brand))
        if (franchise) conditions.push(eq(p.franchise, franchise))
        if (status) conditions.push(eq(p.status, status))
        if (search) conditions.push(ilike(p.product_name, `%${search}%`))
        return conditions.length === 0 ? undefined : and(...conditions)
      },
      with: { release_dates: true },
      orderBy: [desc(products.updated_at)],
      limit,
      offset,
    })

    return NextResponse.json({ products: items, count: items.length })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      brand,
      franchise,
      line,
      product_name,
      character,
      scale,
      product_type,
      sku,
      upc,
      msrp_usd,
      currency,
      region,
      exclusivity,
      image_url,
      thumbnail_url,
      official_page_url,
      status,
    } = body

    if (!brand || !product_name) {
      return NextResponse.json({ error: 'brand and product_name are required' }, { status: 400 })
    }

    const slug = generateProductSlug(brand, product_name)

    const [product] = await db
      .insert(products)
      .values({
        slug,
        brand,
        franchise,
        line,
        product_name,
        character,
        scale,
        product_type,
        sku,
        upc,
        msrp_usd,
        currency,
        region,
        exclusivity,
        image_url,
        thumbnail_url,
        official_page_url,
        status: status || 'announced',
      })
      .returning()

    return NextResponse.json({ product }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

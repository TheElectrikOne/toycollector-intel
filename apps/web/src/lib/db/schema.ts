import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  integer,
  jsonb,
  timestamp,
  date,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ─── Sources ─────────────────────────────────────────────────────────────────

export const sources = pgTable('sources', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  url: text('url').notNull(),
  source_type: text('source_type').notNull(), // official_brand | official_retailer | press | community | rumor
  trust_level: integer('trust_level').notNull(), // 1-5
  brand_affiliation: text('brand_affiliation'),
  language: text('language').default('en'),
  notes: text('notes'),
  active: boolean('active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = pgTable('products', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').unique().notNull(),
  brand: text('brand').notNull(),
  franchise: text('franchise'),
  line: text('line'),
  product_name: text('product_name').notNull(),
  character: text('character'),
  scale: text('scale'),
  product_type: text('product_type'), // action_figure | statue | die_cast | plush | vehicle | playset
  sku: text('sku'),
  upc: text('upc'),
  msrp_usd: numeric('msrp_usd', { precision: 8, scale: 2 }),
  currency: text('currency').default('USD'),
  region: text('region').default('US'),
  exclusivity: text('exclusivity'),
  image_url: text('image_url'),
  thumbnail_url: text('thumbnail_url'),
  official_page_url: text('official_page_url'),
  status: text('status').default('announced'), // announced | preorder_open | preorder_closed | shipping | released | cancelled
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

// ─── Release Dates ────────────────────────────────────────────────────────────

export const release_dates = pgTable('release_dates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  product_id: uuid('product_id').references(() => products.id),
  date_type: text('date_type').notNull(), // release | preorder_open | preorder_close | ship
  date_exact: date('date_exact'),
  date_window_start: date('date_window_start'),
  date_window_end: date('date_window_end'),
  date_label: text('date_label'),
  confidence: text('confidence').notNull(), // confirmed | estimated | retailer_placeholder | unverified
  source_id: uuid('source_id').references(() => sources.id),
  notes: text('notes'),
  is_current: boolean('is_current').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

// ─── Raw Detections ──────────────────────────────────────────────────────────

export const raw_detections = pgTable('raw_detections', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  source_id: uuid('source_id').references(() => sources.id),
  source_url: text('source_url').notNull(),
  page_hash: text('page_hash'),
  raw_html: text('raw_html'),
  extracted_json: jsonb('extracted_json'),
  detected_at: timestamp('detected_at', { withTimezone: true }).default(sql`now()`),
  processing_status: text('processing_status').default('pending'), // pending | extracted | reviewed | published | rejected | duplicate
  duplicate_of: uuid('duplicate_of'), // self-ref, handled manually
  assigned_to: text('assigned_to'),
  notes: text('notes'),
})

// ─── News Posts ──────────────────────────────────────────────────────────────

export const news_posts = pgTable('news_posts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').unique().notNull(),
  headline: text('headline').notNull(),
  summary: text('summary'),
  body_html: text('body_html'),
  body_markdown: text('body_markdown'),
  post_type: text('post_type').notNull(), // reveal | preorder_alert | release_date | event | rumor | correction
  confidence_label: text('confidence_label').notNull(), // confirmed | estimated | retailer_placeholder | unverified
  product_ids: uuid('product_ids').array(),
  source_ids: uuid('source_ids').array(),
  primary_source_id: uuid('primary_source_id').references(() => sources.id),
  detection_id: uuid('detection_id').references(() => raw_detections.id),
  author: text('author').default('editorial'),
  status: text('status').default('draft'), // draft | review | published | corrected | archived
  published_at: timestamp('published_at', { withTimezone: true }),
  detected_at: timestamp('detected_at', { withTimezone: true }),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
  correction_note: text('correction_note'),
  seo_title: text('seo_title'),
  seo_description: text('seo_description'),
  og_image_url: text('og_image_url'),
})

// ─── Preorder Alerts ─────────────────────────────────────────────────────────

export const preorder_alerts = pgTable('preorder_alerts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  product_id: uuid('product_id').references(() => products.id),
  retailer: text('retailer').notNull(),
  retailer_url: text('retailer_url'),
  alert_type: text('alert_type').notNull(), // now_live | closing_soon | restocked | cancelled
  price: numeric('price', { precision: 8, scale: 2 }),
  region: text('region').default('US'),
  detected_at: timestamp('detected_at', { withTimezone: true }).default(sql`now()`),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  is_active: boolean('is_active').default(true),
  confidence: text('confidence').default('unverified'),
})

// ─── Page Monitors ────────────────────────────────────────────────────────────

export const page_monitors = pgTable('page_monitors', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  source_id: uuid('source_id').references(() => sources.id),
  url: text('url').notNull(),
  label: text('label'),
  monitor_type: text('monitor_type').notNull(), // full_page | rss | sitemap | api | youtube_channel
  check_interval: integer('check_interval').default(3600),
  last_checked_at: timestamp('last_checked_at', { withTimezone: true }),
  last_changed_at: timestamp('last_changed_at', { withTimezone: true }),
  last_hash: text('last_hash'),
  is_active: boolean('is_active').default(true),
  priority: integer('priority').default(3), // 1=urgent(15min) 2=high(1hr) 3=standard(4hr) 4=low(daily)
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const productsRelations = relations(products, ({ many }) => ({
  release_dates: many(release_dates),
  preorder_alerts: many(preorder_alerts),
}))

export const sourcesRelations = relations(sources, ({ many }) => ({
  release_dates: many(release_dates),
  raw_detections: many(raw_detections),
  news_posts: many(news_posts),
  page_monitors: many(page_monitors),
}))

export const releaseDatesRelations = relations(release_dates, ({ one }) => ({
  product: one(products, { fields: [release_dates.product_id], references: [products.id] }),
  source: one(sources, { fields: [release_dates.source_id], references: [sources.id] }),
}))

export const rawDetectionsRelations = relations(raw_detections, ({ one }) => ({
  source: one(sources, { fields: [raw_detections.source_id], references: [sources.id] }),
}))

export const newsPostsRelations = relations(news_posts, ({ one }) => ({
  primary_source: one(sources, { fields: [news_posts.primary_source_id], references: [sources.id] }),
  detection: one(raw_detections, { fields: [news_posts.detection_id], references: [raw_detections.id] }),
}))

export const preorderAlertsRelations = relations(preorder_alerts, ({ one }) => ({
  product: one(products, { fields: [preorder_alerts.product_id], references: [products.id] }),
}))

export const pageMonitorsRelations = relations(page_monitors, ({ one }) => ({
  source: one(sources, { fields: [page_monitors.source_id], references: [sources.id] }),
}))

// ─── Types ────────────────────────────────────────────────────────────────────

export type Source = typeof sources.$inferSelect
export type NewSource = typeof sources.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type ReleaseDate = typeof release_dates.$inferSelect
export type NewReleaseDate = typeof release_dates.$inferInsert
export type RawDetection = typeof raw_detections.$inferSelect
export type NewRawDetection = typeof raw_detections.$inferInsert
export type NewsPost = typeof news_posts.$inferSelect
export type NewNewsPost = typeof news_posts.$inferInsert
export type PreorderAlert = typeof preorder_alerts.$inferSelect
export type NewPreorderAlert = typeof preorder_alerts.$inferInsert
export type PageMonitor = typeof page_monitors.$inferSelect
export type NewPageMonitor = typeof page_monitors.$inferInsert

-- ToyCollector Intelligence Platform — Initial Schema Migration
-- Run with: drizzle-kit migrate

-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sources table
CREATE TABLE IF NOT EXISTS "sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "url" text NOT NULL,
  "source_type" text NOT NULL,
  "trust_level" integer NOT NULL,
  "brand_affiliation" text,
  "language" text DEFAULT 'en',
  "notes" text,
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text UNIQUE NOT NULL,
  "brand" text NOT NULL,
  "franchise" text,
  "line" text,
  "product_name" text NOT NULL,
  "character" text,
  "scale" text,
  "product_type" text,
  "sku" text,
  "upc" text,
  "msrp_usd" numeric(8,2),
  "currency" text DEFAULT 'USD',
  "region" text DEFAULT 'US',
  "exclusivity" text,
  "image_url" text,
  "thumbnail_url" text,
  "official_page_url" text,
  "status" text DEFAULT 'announced',
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- Release dates table
CREATE TABLE IF NOT EXISTS "release_dates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid REFERENCES "products"("id"),
  "date_type" text NOT NULL,
  "date_exact" date,
  "date_window_start" date,
  "date_window_end" date,
  "date_label" text,
  "confidence" text NOT NULL,
  "source_id" uuid REFERENCES "sources"("id"),
  "notes" text,
  "is_current" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- Raw detections table
CREATE TABLE IF NOT EXISTS "raw_detections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "source_id" uuid REFERENCES "sources"("id"),
  "source_url" text NOT NULL,
  "page_hash" text,
  "raw_html" text,
  "extracted_json" jsonb,
  "detected_at" timestamptz DEFAULT now(),
  "processing_status" text DEFAULT 'pending',
  "duplicate_of" uuid REFERENCES "raw_detections"("id"),
  "assigned_to" text,
  "notes" text
);

-- News posts table
CREATE TABLE IF NOT EXISTS "news_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text UNIQUE NOT NULL,
  "headline" text NOT NULL,
  "summary" text,
  "body_html" text,
  "body_markdown" text,
  "post_type" text NOT NULL,
  "confidence_label" text NOT NULL,
  "product_ids" uuid[],
  "source_ids" uuid[],
  "primary_source_id" uuid REFERENCES "sources"("id"),
  "detection_id" uuid REFERENCES "raw_detections"("id"),
  "author" text DEFAULT 'editorial',
  "status" text DEFAULT 'draft',
  "published_at" timestamptz,
  "detected_at" timestamptz,
  "updated_at" timestamptz DEFAULT now(),
  "correction_note" text,
  "seo_title" text,
  "seo_description" text,
  "og_image_url" text
);

-- Preorder alerts table
CREATE TABLE IF NOT EXISTS "preorder_alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid REFERENCES "products"("id"),
  "retailer" text NOT NULL,
  "retailer_url" text,
  "alert_type" text NOT NULL,
  "price" numeric(8,2),
  "region" text DEFAULT 'US',
  "detected_at" timestamptz DEFAULT now(),
  "expires_at" timestamptz,
  "is_active" boolean DEFAULT true,
  "confidence" text DEFAULT 'unverified'
);

-- Page monitors table
CREATE TABLE IF NOT EXISTS "page_monitors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "source_id" uuid REFERENCES "sources"("id"),
  "url" text NOT NULL,
  "label" text,
  "monitor_type" text NOT NULL,
  "check_interval" integer DEFAULT 3600,
  "last_checked_at" timestamptz,
  "last_changed_at" timestamptz,
  "last_hash" text,
  "is_active" boolean DEFAULT true,
  "priority" integer DEFAULT 3
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_franchise ON products(franchise);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_news_posts_status ON news_posts(status);
CREATE INDEX IF NOT EXISTS idx_news_posts_slug ON news_posts(slug);
CREATE INDEX IF NOT EXISTS idx_news_posts_post_type ON news_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_news_posts_published_at ON news_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_detections_status ON raw_detections(processing_status);
CREATE INDEX IF NOT EXISTS idx_raw_detections_detected_at ON raw_detections(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_monitors_priority ON page_monitors(priority);
CREATE INDEX IF NOT EXISTS idx_page_monitors_active ON page_monitors(is_active);
CREATE INDEX IF NOT EXISTS idx_preorder_alerts_active ON preorder_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_release_dates_product ON release_dates(product_id);
CREATE INDEX IF NOT EXISTS idx_release_dates_current ON release_dates(is_current);

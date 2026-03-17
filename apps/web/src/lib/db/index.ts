import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Prevent multiple instances in development (Next.js hot reload)
declare global {
  // eslint-disable-next-line no-var
  var __postgres: ReturnType<typeof postgres> | undefined
}

let client: ReturnType<typeof postgres>

if (process.env.NODE_ENV === 'production') {
  client = postgres(connectionString, { max: 10 })
} else {
  if (!global.__postgres) {
    global.__postgres = postgres(connectionString, { max: 1 })
  }
  client = global.__postgres
}

export const db = drizzle(client, { schema })

export type DB = typeof db

import { createClient, type Client } from '@libsql/client'

let client: Client | null = null
let schemaReady: Promise<void> | null = null

export function isDbConfigured() {
  return Boolean(process.env.TURSO_DATABASE_URL)
}

export async function getDb() {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL as string,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }
  if (!schemaReady) {
    schemaReady = client
      .batch(
        [
          `CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            days INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )`,
          `CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            packed INTEGER NOT NULL DEFAULT 0
          )`,
          `CREATE INDEX IF NOT EXISTS items_trip_id_idx ON items(trip_id)`,
        ],
        'write',
      )
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null
        throw error
      })
  }
  await schemaReady
  return client
}

export type Trip = {
  id: number
  name: string
  days: number
  createdAt: string
  itemCount: number
  packedCount: number
}

export type Item = {
  id: number
  name: string
  category: string
  quantity: number
  packed: boolean
}

export async function listTrips(): Promise<Trip[]> {
  const db = await getDb()
  const result = await db.execute(`
    SELECT t.id, t.name, t.days, t.created_at,
      COUNT(i.id) AS item_count,
      COALESCE(SUM(i.packed), 0) AS packed_count
    FROM trips t
    LEFT JOIN items i ON i.trip_id = t.id
    GROUP BY t.id
    ORDER BY t.created_at DESC, t.id DESC
  `)
  return result.rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    days: Number(row.days),
    createdAt: String(row.created_at),
    itemCount: Number(row.item_count),
    packedCount: Number(row.packed_count),
  }))
}

export async function getTripWithItems(id: number) {
  const db = await getDb()
  const [tripResult, itemsResult] = await db.batch(
    [
      { sql: 'SELECT id, name, days, created_at FROM trips WHERE id = ?', args: [id] },
      {
        sql: 'SELECT id, name, category, quantity, packed FROM items WHERE trip_id = ? ORDER BY id',
        args: [id],
      },
    ],
    'read',
  )
  const row = tripResult.rows[0]
  if (!row) return null
  const items: Item[] = itemsResult.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    category: String(r.category),
    quantity: Number(r.quantity),
    packed: Number(r.packed) === 1,
  }))
  return {
    trip: { id: Number(row.id), name: String(row.name), days: Number(row.days) },
    items,
  }
}

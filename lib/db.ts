import { createClient } from "@libsql/client";
import type { Client } from "@libsql/client";

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

const toText = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  return "";
};

const ensureTripsUserIdColumn = async (db: Client): Promise<void> => {
  const columns = await db.execute("PRAGMA table_info(trips)");
  const hasUserId = columns.rows.some((row) => toText(row.name) === "user_id");
  if (!hasUserId) {
    await db.execute("ALTER TABLE trips ADD COLUMN user_id TEXT");
  }
};

const initSchema = async (db: Client): Promise<void> => {
  try {
    await db.batch(
      [
        `CREATE TABLE IF NOT EXISTS trips (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
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
      "write"
    );
    await ensureTripsUserIdColumn(db);
    await db.execute(
      "CREATE INDEX IF NOT EXISTS trips_user_id_idx ON trips(user_id)"
    );
  } catch (error: unknown) {
    schemaReady = null;
    throw error;
  }
};

export const isDbConfigured = () => Boolean(process.env.TURSO_DATABASE_URL);

export const getDb = async () => {
  const url = process.env.TURSO_DATABASE_URL;
  if (url === undefined || url === "") {
    throw new Error("TURSO_DATABASE_URL is not configured");
  }
  client ??= createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  schemaReady ??= initSchema(client);
  await schemaReady;
  return client;
};

export interface Trip {
  id: number;
  name: string;
  days: number;
  createdAt: string;
  itemCount: number;
  packedCount: number;
}

export interface Item {
  id: number;
  name: string;
  category: string;
  quantity: number;
  packed: boolean;
}

export const listTrips = async (userId: string): Promise<Trip[]> => {
  const db = await getDb();
  const result = await db.execute({
    sql: `
      SELECT t.id, t.name, t.days, t.created_at,
        COUNT(i.id) AS item_count,
        COALESCE(SUM(i.packed), 0) AS packed_count
      FROM trips t
      LEFT JOIN items i ON i.trip_id = t.id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY t.created_at DESC, t.id DESC
    `,
    args: [userId],
  });
  return result.rows.map((row) => ({
    id: Number(row.id),
    name: toText(row.name),
    days: Number(row.days),
    createdAt: toText(row.created_at),
    itemCount: Number(row.item_count),
    packedCount: Number(row.packed_count),
  }));
};

export const getTripWithItems = async (id: number, userId: string) => {
  const db = await getDb();
  const [tripResult, itemsResult] = await db.batch(
    [
      {
        sql: "SELECT id, name, days, created_at FROM trips WHERE id = ? AND user_id = ?",
        args: [id, userId],
      },
      {
        sql: `SELECT id, name, category, quantity, packed
          FROM items
          WHERE trip_id = ?
            AND EXISTS (SELECT 1 FROM trips WHERE id = ? AND user_id = ?)
          ORDER BY id`,
        args: [id, id, userId],
      },
    ],
    "read"
  );
  if (tripResult.rows.length === 0) {
    return null;
  }
  const [row] = tripResult.rows;
  const items: Item[] = itemsResult.rows.map((r) => ({
    id: Number(r.id),
    name: toText(r.name),
    category: toText(r.category),
    quantity: Number(r.quantity),
    packed: Number(r.packed) === 1,
  }));
  return {
    trip: {
      id: Number(row.id),
      name: toText(row.name),
      days: Number(row.days),
    },
    items,
  };
};

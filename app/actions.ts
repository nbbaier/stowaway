'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { buildDefaultList, CATEGORIES, MAX_DAYS, type Category } from '@/lib/defaults'

function toId(value: unknown) {
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid id')
  return id
}

function cleanName(value: unknown) {
  const name = String(value ?? '').trim()
  if (!name || name.length > 80) return null
  return name
}

export type CreateTripState = { error?: string }

export async function createTrip(_prev: CreateTripState, formData: FormData): Promise<CreateTripState> {
  const name = cleanName(formData.get('name'))
  const days = Number(formData.get('days'))
  if (!name) return { error: 'Give your trip a name (up to 80 characters).' }
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
    return { error: `Days must be a whole number between 1 and ${MAX_DAYS}.` }
  }

  const db = await getDb()
  const tx = await db.transaction('write')
  let tripId: number
  try {
    const result = await tx.execute({
      sql: 'INSERT INTO trips (name, days) VALUES (?, ?)',
      args: [name, days],
    })
    tripId = Number(result.lastInsertRowid)
    for (const item of buildDefaultList(days)) {
      await tx.execute({
        sql: 'INSERT INTO items (trip_id, name, category, quantity) VALUES (?, ?, ?, ?)',
        args: [tripId, item.name, item.category, item.quantity],
      })
    }
    await tx.commit()
  } catch (error) {
    await tx.rollback()
    throw error
  } finally {
    tx.close()
  }

  revalidatePath('/')
  redirect(`/trips/${tripId}`)
}

export async function setItemPacked(tripId: number, itemId: number, packed: boolean) {
  const db = await getDb()
  await db.execute({
    sql: 'UPDATE items SET packed = ? WHERE id = ? AND trip_id = ?',
    args: [packed ? 1 : 0, toId(itemId), toId(tripId)],
  })
  revalidatePath(`/trips/${tripId}`)
}

export async function setItemQuantity(tripId: number, itemId: number, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error('Invalid quantity')
  const db = await getDb()
  await db.execute({
    sql: 'UPDATE items SET quantity = ? WHERE id = ? AND trip_id = ?',
    args: [quantity, toId(itemId), toId(tripId)],
  })
  revalidatePath(`/trips/${tripId}`)
}

export async function addItem(tripId: number, rawName: string, rawCategory: string) {
  const name = cleanName(rawName)
  if (!name) throw new Error('Invalid name')
  const category: Category = (CATEGORIES as readonly string[]).includes(rawCategory)
    ? (rawCategory as Category)
    : 'Extras'
  const db = await getDb()
  await db.execute({
    sql: 'INSERT INTO items (trip_id, name, category, quantity) SELECT id, ?, ?, 1 FROM trips WHERE id = ?',
    args: [name, category, toId(tripId)],
  })
  revalidatePath(`/trips/${tripId}`)
}

export async function deleteItem(tripId: number, itemId: number) {
  const db = await getDb()
  await db.execute({
    sql: 'DELETE FROM items WHERE id = ? AND trip_id = ?',
    args: [toId(itemId), toId(tripId)],
  })
  revalidatePath(`/trips/${tripId}`)
}

export async function deleteTrip(tripId: number) {
  const id = toId(tripId)
  const db = await getDb()
  await db.batch(
    [
      { sql: 'DELETE FROM items WHERE trip_id = ?', args: [id] },
      { sql: 'DELETE FROM trips WHERE id = ?', args: [id] },
    ],
    'write',
  )
  revalidatePath('/')
  redirect('/')
}

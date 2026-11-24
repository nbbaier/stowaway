"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { buildDefaultList, CATEGORIES, MAX_DAYS } from "@/lib/defaults";
import type { Category } from "@/lib/defaults";

const toId = (value: unknown) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid id");
  }
  return id;
};

const cleanName = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }
  const name = value.trim();
  if (!name || name.length > 80) {
    return null;
  }
  return name;
};

export interface CreateTripState {
  error?: string;
}

export const createTrip = async (
  _prev: CreateTripState,
  formData: FormData
): Promise<CreateTripState> => {
  const name = cleanName(formData.get("name"));
  const days = Number(formData.get("days"));
  if (name === null) {
    return { error: "Give your trip a name (up to 80 characters)." };
  }
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
    return { error: `Days must be a whole number between 1 and ${MAX_DAYS}.` };
  }

  const db = await getDb();
  const tx = await db.transaction("write");
  let tripId: number;
  try {
    const result = await tx.execute({
      sql: "INSERT INTO trips (name, days) VALUES (?, ?)",
      args: [name, days],
    });
    tripId = Number(result.lastInsertRowid);
    await tx.batch(
      buildDefaultList(days).map((item) => ({
        sql: "INSERT INTO items (trip_id, name, category, quantity) VALUES (?, ?, ?, ?)",
        args: [tripId, item.name, item.category, item.quantity],
      }))
    );
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }

  revalidatePath("/");
  return redirect(`/trips/${tripId}`);
};

export const setItemPacked = async (
  tripId: number,
  itemId: number,
  packed: boolean
) => {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE items SET packed = ? WHERE id = ? AND trip_id = ?",
    args: [packed ? 1 : 0, toId(itemId), toId(tripId)],
  });
  revalidatePath(`/trips/${tripId}`);
};

export const setItemQuantity = async (
  tripId: number,
  itemId: number,
  quantity: number
) => {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error("Invalid quantity");
  }
  const db = await getDb();
  await db.execute({
    sql: "UPDATE items SET quantity = ? WHERE id = ? AND trip_id = ?",
    args: [quantity, toId(itemId), toId(tripId)],
  });
  revalidatePath(`/trips/${tripId}`);
};

export const addItem = async (
  tripId: number,
  rawName: string,
  rawCategory: string
) => {
  const name = cleanName(rawName);
  if (name === null) {
    throw new Error("Invalid name");
  }
  const category: Category =
    CATEGORIES.find((c) => c === rawCategory) ?? "Extras";
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO items (trip_id, name, category, quantity) SELECT id, ?, ?, 1 FROM trips WHERE id = ?",
    args: [name, category, toId(tripId)],
  });
  revalidatePath(`/trips/${tripId}`);
};

export const deleteItem = async (tripId: number, itemId: number) => {
  const db = await getDb();
  await db.execute({
    sql: "DELETE FROM items WHERE id = ? AND trip_id = ?",
    args: [toId(itemId), toId(tripId)],
  });
  revalidatePath(`/trips/${tripId}`);
};

export const deleteTrip = async (tripId: number) => {
  const id = toId(tripId);
  const db = await getDb();
  await db.batch(
    [
      { sql: "DELETE FROM items WHERE trip_id = ?", args: [id] },
      { sql: "DELETE FROM trips WHERE id = ?", args: [id] },
    ],
    "write"
  );
  revalidatePath("/");
  redirect("/");
};

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { buildDefaultList, CATEGORIES, MAX_DAYS } from "@/lib/defaults";
import type { Category } from "@/lib/defaults";
import {
  clearPassphraseSession,
  createPassphraseSession,
} from "@/lib/passphrase-auth";
import { requireSession } from "@/lib/session";

export const signInWithPassphrase = async (
  formData: FormData
): Promise<void> => {
  const passphrase = formData.get("passphrase");
  if (
    typeof passphrase !== "string" ||
    !(await createPassphraseSession(passphrase))
  ) {
    redirect("/sign-in?error=invalid");
  }
  redirect("/");
};

export const signOut = async (): Promise<void> => {
  await clearPassphraseSession();
  redirect("/sign-in");
};

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
  const session = await requireSession();
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
      sql: "INSERT INTO trips (user_id, name, days) VALUES (?, ?, ?)",
      args: [session.user.id, name, days],
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
  const session = await requireSession();
  const validTripId = toId(tripId);
  const db = await getDb();
  await db.execute({
    sql: `UPDATE items
      SET packed = ?
      WHERE id = ?
        AND trip_id = ?
        AND EXISTS (SELECT 1 FROM trips WHERE id = ? AND user_id = ?)`,
    args: [
      packed ? 1 : 0,
      toId(itemId),
      validTripId,
      validTripId,
      session.user.id,
    ],
  });
  revalidatePath(`/trips/${validTripId}`);
};

export const setItemQuantity = async (
  tripId: number,
  itemId: number,
  quantity: number
) => {
  const session = await requireSession();
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error("Invalid quantity");
  }
  const validTripId = toId(tripId);
  const db = await getDb();
  await db.execute({
    sql: `UPDATE items
      SET quantity = ?
      WHERE id = ?
        AND trip_id = ?
        AND EXISTS (SELECT 1 FROM trips WHERE id = ? AND user_id = ?)`,
    args: [quantity, toId(itemId), validTripId, validTripId, session.user.id],
  });
  revalidatePath(`/trips/${validTripId}`);
};

export const addItem = async (
  tripId: number,
  rawName: string,
  rawCategory: string
) => {
  const session = await requireSession();
  const name = cleanName(rawName);
  if (name === null) {
    throw new Error("Invalid name");
  }
  const category: Category =
    CATEGORIES.find((c) => c === rawCategory) ?? "Extras";
  const validTripId = toId(tripId);
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO items (trip_id, name, category, quantity) SELECT id, ?, ?, 1 FROM trips WHERE id = ? AND user_id = ?",
    args: [name, category, validTripId, session.user.id],
  });
  revalidatePath(`/trips/${validTripId}`);
};

export const deleteItem = async (tripId: number, itemId: number) => {
  const session = await requireSession();
  const validTripId = toId(tripId);
  const db = await getDb();
  await db.execute({
    sql: `DELETE FROM items
      WHERE id = ?
        AND trip_id = ?
        AND EXISTS (SELECT 1 FROM trips WHERE id = ? AND user_id = ?)`,
    args: [toId(itemId), validTripId, validTripId, session.user.id],
  });
  revalidatePath(`/trips/${validTripId}`);
};

export const deleteTrip = async (tripId: number) => {
  const session = await requireSession();
  const id = toId(tripId);
  const db = await getDb();
  await db.batch(
    [
      {
        sql: `DELETE FROM items
          WHERE trip_id = ?
            AND EXISTS (SELECT 1 FROM trips WHERE id = ? AND user_id = ?)`,
        args: [id, id, session.user.id],
      },
      {
        sql: "DELETE FROM trips WHERE id = ? AND user_id = ?",
        args: [id, session.user.id],
      },
    ],
    "write"
  );
  revalidatePath("/");
  redirect("/");
};

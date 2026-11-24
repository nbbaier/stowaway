"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";

import {
  addItem,
  deleteItem,
  setItemPacked,
  setItemQuantity,
} from "@/app/actions";
import { LuggageTag } from "@/components/luggage-tag";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Item } from "@/lib/db";
import { CATEGORIES } from "@/lib/defaults";
import { cn } from "@/lib/utils";

type Action =
  | { type: "packed"; id: number; packed: boolean }
  | { type: "quantity"; id: number; quantity: number }
  | { type: "delete"; id: number }
  | { type: "add"; item: Item };

const reducer = (items: Item[], action: Action): Item[] => {
  switch (action.type) {
    case "packed": {
      return items.map((i) =>
        i.id === action.id ? { ...i, packed: action.packed } : i
      );
    }
    case "quantity": {
      return items.map((i) =>
        i.id === action.id ? { ...i, quantity: action.quantity } : i
      );
    }
    case "delete": {
      return items.filter((i) => i.id !== action.id);
    }
    case "add": {
      return [...items, action.item];
    }
    default: {
      return items;
    }
  }
};

interface PackingListProps {
  trip: { id: number; name: string; days: number };
  items: Item[];
}

export const PackingList = ({ trip, items }: PackingListProps) => {
  const [optimisticItems, apply] = useOptimistic(items, reducer);
  const [, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>("Extras");

  const run = (action: Action, server: () => Promise<void>) => {
    startTransition(async () => {
      apply(action);
      await server();
    });
  };

  const packedCount = optimisticItems.filter((i) => i.packed).length;
  const groups = [
    ...CATEGORIES,
    ...new Set(optimisticItems.map((i) => i.category)),
  ]
    .filter((c, idx, arr) => arr.indexOf(c) === idx)
    .map((category) => ({
      category,
      items: optimisticItems.filter((i) => i.category === category),
    }))
    .filter((g) => g.items.length > 0);

  const handleAdd = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      return;
    }
    setNewName("");
    run(
      {
        type: "add",
        item: {
          id: -Date.now(),
          name,
          category: newCategory,
          quantity: 1,
          packed: false,
        },
      },
      async () => {
        await addItem(trip.id, name, newCategory);
      }
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <LuggageTag
        name={trip.name}
        days={trip.days}
        packed={packedCount}
        total={optimisticItems.length}
        size="lg"
      />

      <form
        onSubmit={handleAdd}
        className="bg-card flex flex-col gap-2 rounded-xl border p-4 md:flex-row md:items-end"
      >
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="new-item">Add something else</Label>
          <Input
            id="new-item"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
            }}
            placeholder="Hiking boots"
            maxLength={80}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-category">Category</Label>
          <select
            id="new-category"
            value={newCategory}
            onChange={(e) => {
              setNewCategory(e.target.value);
            }}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={!newName.trim()}>
          <Plus />
          Add
        </Button>
      </form>

      <div className="grid gap-6 md:grid-cols-2">
        {groups.map((group) => {
          const done = group.items.filter((i) => i.packed).length;
          return (
            <section
              key={group.category}
              aria-labelledby={`cat-${group.category}`}
              className="flex flex-col gap-2"
            >
              <div className="flex items-baseline justify-between border-b pb-2">
                <h2
                  id={`cat-${group.category}`}
                  className="font-heading text-lg font-bold"
                >
                  {group.category}
                </h2>
                <span className="text-muted-foreground text-sm tabular-nums">{`${done}/${group.items.length}`}</span>
              </div>
              <ul className="flex flex-col">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="group hover:bg-muted flex items-center gap-3 rounded-md px-1 py-2"
                  >
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={item.packed}
                      disabled={item.id < 0}
                      onCheckedChange={(checked) => {
                        run(
                          { type: "packed", id: item.id, packed: checked },
                          async () => {
                            await setItemPacked(trip.id, item.id, checked);
                          }
                        );
                      }}
                    />
                    <label
                      htmlFor={`item-${item.id}`}
                      className={cn(
                        "flex-1 cursor-pointer text-sm leading-relaxed",
                        item.packed && "text-muted-foreground line-through"
                      )}
                    >
                      {item.name}
                    </label>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Decrease ${item.name}`}
                        disabled={item.quantity <= 1 || item.id < 0}
                        onClick={() => {
                          run(
                            {
                              type: "quantity",
                              id: item.id,
                              quantity: item.quantity - 1,
                            },
                            async () => {
                              await setItemQuantity(
                                trip.id,
                                item.id,
                                item.quantity - 1
                              );
                            }
                          );
                        }}
                      >
                        <Minus />
                      </Button>
                      <span className="font-heading w-6 text-center text-sm font-bold tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Increase ${item.name}`}
                        disabled={item.quantity >= 99 || item.id < 0}
                        onClick={() => {
                          run(
                            {
                              type: "quantity",
                              id: item.id,
                              quantity: item.quantity + 1,
                            },
                            async () => {
                              await setItemQuantity(
                                trip.id,
                                item.id,
                                item.quantity + 1
                              );
                            }
                          );
                        }}
                      >
                        <Plus />
                      </Button>
                      <Button
                        variant="ghost-destructive"
                        size="icon-xs"
                        aria-label={`Remove ${item.name}`}
                        disabled={item.id < 0}
                        onClick={() => {
                          run({ type: "delete", id: item.id }, async () => {
                            await deleteItem(trip.id, item.id);
                          });
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export const CATEGORIES = [
  "Clothing",
  "Toiletries",
  "Electronics",
  "Documents",
  "Extras",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const MAX_DAYS = 60;

interface DefaultItem {
  name: string;
  category: Category;
  perDay?: number;
  max?: number;
  minDays?: number;
}

const DEFAULT_ITEMS: DefaultItem[] = [
  { name: "Underwear", category: "Clothing", perDay: 1, max: 10 },
  { name: "Socks", category: "Clothing", perDay: 1, max: 10 },
  { name: "T-shirts", category: "Clothing", perDay: 1, max: 7 },
  { name: "Pants or shorts", category: "Clothing", perDay: 1 / 3, max: 4 },
  { name: "Sleepwear", category: "Clothing", perDay: 1 / 4, max: 3 },
  { name: "Sweater or jacket", category: "Clothing" },
  { name: "Comfortable shoes", category: "Clothing" },
  { name: "Laundry bag", category: "Clothing", minDays: 4 },
  { name: "Toothbrush", category: "Toiletries" },
  { name: "Toothpaste", category: "Toiletries" },
  { name: "Deodorant", category: "Toiletries" },
  { name: "Shampoo", category: "Toiletries" },
  { name: "Medications", category: "Toiletries" },
  { name: "Sunscreen", category: "Toiletries", minDays: 2 },
  { name: "Phone charger", category: "Electronics" },
  { name: "Headphones", category: "Electronics" },
  { name: "Power bank", category: "Electronics", minDays: 2 },
  { name: "Travel adapter", category: "Electronics", minDays: 3 },
  { name: "ID or passport", category: "Documents" },
  { name: "Wallet and cards", category: "Documents" },
  { name: "Tickets and reservations", category: "Documents" },
  { name: "Travel insurance", category: "Documents", minDays: 5 },
  { name: "Water bottle", category: "Extras" },
  { name: "Snacks", category: "Extras" },
  { name: "Book or e-reader", category: "Extras", minDays: 3 },
];

export const buildDefaultList = (days: number) =>
  DEFAULT_ITEMS.filter((item) => days >= (item.minDays ?? 1)).map((item) => {
    const quantity =
      item.perDay === undefined
        ? 1
        : Math.min(
            Math.max(Math.ceil(days * item.perDay), 1),
            item.max ?? Infinity
          );
    return { name: item.name, category: item.category, quantity };
  });

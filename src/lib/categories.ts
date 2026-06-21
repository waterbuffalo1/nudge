export type Category = {
  slug: string;
  name: string;
  emoji: string;
};

export const categories: Category[] = [
  { slug: "eat", name: "eat", emoji: "🍽️" },
  { slug: "better-sleep", name: "better sleep", emoji: "😴" },
  { slug: "exercise", name: "exercise", emoji: "💪🏻" },
  { slug: "relationships", name: "relationships", emoji: "🤝🏻" },
  { slug: "cats", name: "cats", emoji: "🐱" },
  { slug: "future-category-1", name: "future category...", emoji: "🌮" },
  { slug: "future-category-2", name: "future category...", emoji: "🛸" },
  { slug: "future-category-3", name: "future category...", emoji: "🎸" },
  { slug: "future-category-4", name: "future category...", emoji: "🦩" },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

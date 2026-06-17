import Link from "next/link";
import type { Category } from "@/lib/categories";

type CategoryCardProps = {
  category: Category;
};

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/${category.slug}`}
      className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[2.75rem] border-2 border-border bg-elevated p-3 text-center active:scale-[0.98] transition-transform"
    >
      <span className="text-3xl leading-none" aria-hidden>
        {category.emoji}
      </span>
      <span className="font-category text-2xl font-medium leading-tight text-foreground">
        {category.name}
      </span>
    </Link>
  );
}

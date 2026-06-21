import Link from "next/link";
import { CategoryStars } from "@/components/CategoryStars";
import type { Category } from "@/lib/categories";
import type { CategoryProgress } from "@/lib/category-progress";

type CategoryCardProps = {
  category: Category;
  progress?: CategoryProgress;
};

export function CategoryCard({ category, progress }: CategoryCardProps) {
  return (
    <Link
      href={`/${category.slug}`}
      className="relative flex aspect-square flex-col items-center justify-center gap-2 rounded-[2.75rem] border-2 border-border bg-elevated p-3 text-center active:scale-[0.98] transition-transform"
    >
      <CategoryStars progress={progress} />
      <span className="text-3xl leading-none" aria-hidden>
        {category.emoji}
      </span>
      <span className="font-category text-2xl font-medium leading-tight text-foreground">
        {category.name}
      </span>
    </Link>
  );
}

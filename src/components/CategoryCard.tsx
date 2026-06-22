import Link from "next/link";
import { CategoryStars } from "@/components/CategoryStars";
import type { Category } from "@/lib/categories";
import type { CategoryProgress } from "@/lib/category-progress";
import type { MealCardStatus } from "@/lib/eat-meal";

type CategoryCardProps = {
  category: Category;
  progress?: CategoryProgress;
  eatStatus?: MealCardStatus;
};

export function CategoryCard({ category, progress, eatStatus }: CategoryCardProps) {
  return (
    <Link
      href={`/${category.slug}`}
      className="relative flex aspect-square flex-col rounded-[2.75rem] border-2 border-border bg-elevated p-3 text-center active:scale-[0.98] transition-transform"
    >
      <CategoryStars progress={progress} />
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <span className="text-3xl leading-none" aria-hidden>
          {category.emoji}
        </span>
        <span className="font-category text-2xl font-medium leading-tight text-foreground">
          {category.name}
        </span>
      </div>
      {eatStatus ? (
        <div className="w-full shrink-0 px-0.5 pb-2 text-left">
          <p className="line-clamp-3 font-category text-sm font-medium leading-snug text-muted">
            <span className="eat-phase-emoji-color-inline" aria-hidden>
              {eatStatus.icon}
            </span>{" "}
            {eatStatus.label}
          </p>
        </div>
      ) : null}
    </Link>
  );
}

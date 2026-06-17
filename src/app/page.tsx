import { CategoryCard } from "@/components/CategoryCard";
import { categories } from "@/lib/categories";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-foreground">
        nudge...
      </h1>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((category) => (
          <CategoryCard key={category.slug} category={category} />
        ))}
      </div>
      <div className="scroll-pad-bottom-spacer" aria-hidden />
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryActivities } from "@/components/CategoryActivities";
import { EatScreen } from "@/components/EatScreen";
import { getActivitiesForCategory } from "@/lib/activities";
import { getCategoryBySlug } from "@/lib/categories";

const EAT_CATEGORY_SLUG = "eat";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const isEat = slug === EAT_CATEGORY_SLUG;
  const activities = getActivitiesForCategory(slug);

  return (
    <main
      className={`mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-8 ${
        isEat ? "" : "category-page-main"
      }`}
    >
      {!isEat ? (
        <>
          <Link
            href="/"
            className="mb-8 text-sm font-medium text-muted active:text-foreground"
          >
            ← back
          </Link>
          <h1 className="mb-8 text-xl font-semibold text-foreground">
            {category.emoji} {category.name}
          </h1>
          <CategoryActivities
            categorySlug={slug}
            builtInActivities={activities}
          />
          <div className="scroll-pad-bottom-spacer" aria-hidden />
        </>
      ) : (
        <EatScreen />
      )}
    </main>
  );
}

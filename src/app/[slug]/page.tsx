import { notFound } from "next/navigation";
import { CategoryActivities } from "@/components/CategoryActivities";
import { CategoryPageBack } from "@/components/CategoryPageBack";
import { EatScreen } from "@/components/EatScreen";
import { getActivitiesForCategory } from "@/lib/activities";
import { EAT_CATEGORY_SLUG, getCategoryBySlug } from "@/lib/categories";

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
          <CategoryPageBack />
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

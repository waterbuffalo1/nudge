export type Activity = {
  slug: string;
  name: string;
  emoji?: string;
  doneTitle?: string;
  doneMessage?: string;
};

export const activitiesByCategory: Record<string, Activity[]> = {
  "better-sleep": [
    {
      slug: "morning-sun",
      name: "morning sun",
      emoji: "☀️",
      doneMessage: "vitamin d!",
    },
  ],
  exercise: [
    { slug: "plank", name: "plank", emoji: "🧘🏻", doneMessage: "strong as a tree trunk 🌳" },
    { slug: "side-plank", name: "side plank", emoji: "🤸🏻", doneMessage: "your waist is snatched" },
    { slug: "jog-5-min-1", name: "jog 5 min.", emoji: "🏃🏻‍♀️", doneMessage: "stress be gone" },
    { slug: "jog-5-min-2", name: "jog 5 min.", emoji: "🏃🏼‍♀️", doneMessage: "feeling so active" },
    { slug: "jog-5-min-3", name: "jog 5 min.", emoji: "🏃🏽‍♀️", doneMessage: "tiger energy 🐯" },
    { slug: "jog-5-min-4", name: "jog 5 min.", emoji: "🏃🏾‍♀️", doneMessage: "you will sleep so well tonight" },
  ],
};

export function getActivitiesForCategory(categorySlug: string): Activity[] {
  return activitiesByCategory[categorySlug] ?? [];
}

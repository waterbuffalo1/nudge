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
    {
      slug: "daytime-exercise",
      name: "daytime exercise",
      emoji: "🌤️",
      doneMessage: "movement banked",
    },
    {
      slug: "darkness-break",
      name: "darkness break",
      emoji: "🦉",
      doneMessage: "starts the melatonin",
    },
    {
      slug: "tidy-reset",
      name: "tidy reset",
      emoji: "🧹",
      doneMessage: "calm room, calm mind",
    },
  ],
  exercise: [
    { slug: "plank", name: "plank", emoji: "🧘🏻", doneMessage: "strong as a tree trunk 🌳" },
    { slug: "side-plank", name: "side plank", emoji: "🤸🏻", doneMessage: "your waist is snatched" },
    { slug: "jog-5-min-1", name: "jog 5 min.", emoji: "🏃🏻‍♀️", doneMessage: "stress be gone" },
    { slug: "ab-wheel", name: "ab wheel", emoji: "🔥", doneMessage: "feel the burn!" },
    { slug: "donkey-kicks", name: "donkey kicks", emoji: "🦵", doneMessage: "stronger butt 🍑" },
    { slug: "jog-5-min-2", name: "jog 5 min.", emoji: "🏃🏼‍♀️", doneMessage: "feeling so active" },
    { slug: "step-ups", name: "step-ups", emoji: "🪜", doneMessage: "stronger butt 🍑" },
    { slug: "jog-5-min-3", name: "jog 5 min.", emoji: "🏃🏽‍♀️", doneMessage: "tiger energy 🐯" },
    { slug: "jog-5-min-4", name: "jog 5 min.", emoji: "🏃🏾‍♀️", doneMessage: "you will sleep so well tonight" },
  ],
};

export function getActivitiesForCategory(categorySlug: string): Activity[] {
  return activitiesByCategory[categorySlug] ?? [];
}

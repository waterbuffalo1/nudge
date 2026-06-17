export const DAYTIME_EXERCISE_SLUG = "daytime-exercise";
export const DAYTIME_EXERCISE_CATEGORY = "better-sleep";
export const EXERCISE_CATEGORY = "exercise";
export const JOG_ACTIVITY_SLUG_PREFIX = "jog-5-min-";
export const JOGS_REQUIRED_FOR_DAYTIME_EXERCISE = 2;

export function isJogActivitySlug(slug: string): boolean {
  return slug.startsWith(JOG_ACTIVITY_SLUG_PREFIX);
}

export function countCompletedJogs(completedSlugs: Iterable<string>): number {
  let count = 0;
  for (const slug of completedSlugs) {
    if (isJogActivitySlug(slug)) count++;
  }
  return count;
}

export function isDaytimeExerciseDone({
  betterSleepCompleted,
  exerciseCompleted,
}: {
  betterSleepCompleted: Iterable<string>;
  exerciseCompleted: Iterable<string>;
}): boolean {
  const betterSleep =
    betterSleepCompleted instanceof Set
      ? betterSleepCompleted
      : new Set(betterSleepCompleted);
  const exercise =
    exerciseCompleted instanceof Set
      ? exerciseCompleted
      : new Set(exerciseCompleted);

  if (
    betterSleep.has(DAYTIME_EXERCISE_SLUG) ||
    exercise.has(DAYTIME_EXERCISE_SLUG)
  ) {
    return true;
  }

  return countCompletedJogs(exercise) >= JOGS_REQUIRED_FOR_DAYTIME_EXERCISE;
}

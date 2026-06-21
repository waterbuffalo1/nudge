import { describe, expect, it } from "vitest";
import { isActivityCompleted } from "./activity-completion";
import { computeCategoryProgress } from "./category-progress";
import {
  DAYTIME_EXERCISE_CATEGORY,
  DAYTIME_EXERCISE_SLUG,
  EXERCISE_CATEGORY,
} from "./daytime-exercise";

describe("isActivityCompleted", () => {
  it("marks daytime exercise done when two jogs are complete in exercise", () => {
    const completedByCategory = new Map<string, Set<string>>([
      [EXERCISE_CATEGORY, new Set(["jog-5-min-1", "jog-5-min-2"])],
      [DAYTIME_EXERCISE_CATEGORY, new Set()],
    ]);

    expect(
      isActivityCompleted(
        DAYTIME_EXERCISE_SLUG,
        DAYTIME_EXERCISE_CATEGORY,
        completedByCategory,
      ),
    ).toBe(true);
  });
});

describe("computeCategoryProgress", () => {
  it("counts built-in activities and completions", () => {
    const completedByCategory = new Map<string, Set<string>>([
      ["better-sleep", new Set(["morning-sun"])],
    ]);

    expect(
      computeCategoryProgress(
        "better-sleep",
        [
          { slug: "morning-sun", name: "morning sun" },
          { slug: "tidy-reset", name: "tidy reset" },
        ],
        [],
        completedByCategory,
      ),
    ).toEqual({ total: 2, completed: 1 });
  });
});

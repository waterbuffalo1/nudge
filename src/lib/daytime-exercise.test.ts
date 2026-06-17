import { describe, expect, it } from "vitest";
import {
  DAYTIME_EXERCISE_SLUG,
  isDaytimeExerciseDone,
} from "./daytime-exercise";

describe("isDaytimeExerciseDone", () => {
  it("is not done with zero or one jog complete", () => {
    expect(
      isDaytimeExerciseDone({
        betterSleepCompleted: [],
        exerciseCompleted: [],
      }),
    ).toBe(false);
    expect(
      isDaytimeExerciseDone({
        betterSleepCompleted: [],
        exerciseCompleted: ["jog-5-min-1"],
      }),
    ).toBe(false);
  });

  it("is done when two or more exercise jogs are complete", () => {
    expect(
      isDaytimeExerciseDone({
        betterSleepCompleted: [],
        exerciseCompleted: ["jog-5-min-1", "jog-5-min-2"],
      }),
    ).toBe(true);
  });

  it("is done when marked complete in better sleep", () => {
    expect(
      isDaytimeExerciseDone({
        betterSleepCompleted: [DAYTIME_EXERCISE_SLUG],
        exerciseCompleted: [],
      }),
    ).toBe(true);
  });

  it("ignores unrelated exercise completions", () => {
    expect(
      isDaytimeExerciseDone({
        betterSleepCompleted: [],
        exerciseCompleted: ["plank", "side-plank", "ab-wheel"],
      }),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  DEFAULT_DONE_MESSAGE,
  DEFAULT_DONE_TITLE,
  getDoneCopy,
} from "./done-copy";

describe("getDoneCopy", () => {
  it("returns defaults when activity has no custom copy", () => {
    expect(
      getDoneCopy({ slug: "plank", name: "plank", emoji: "🧘🏻" }),
    ).toEqual({
      title: DEFAULT_DONE_TITLE,
      message: DEFAULT_DONE_MESSAGE,
    });
  });

  it("returns per-activity copy when provided", () => {
    expect(
      getDoneCopy({
        slug: "plank",
        name: "plank",
        emoji: "🧘🏻",
        doneTitle: "core secured 💪",
        doneMessage: "your back thanks you.",
      }),
    ).toEqual({
      title: "core secured 💪",
      message: "your back thanks you.",
    });
  });
});

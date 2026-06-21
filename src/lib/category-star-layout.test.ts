import { describe, expect, it } from "vitest";
import { getSpiralStarLayout, getVisibleStarLayout } from "./category-star-layout";

const layoutOptions = {
  width: 160,
  height: 160,
  starSize: 24,
  gap: 4,
  inset: 12,
};

describe("getSpiralStarLayout", () => {
  it("places the first stars along the top edge left to right", () => {
    const slots = getSpiralStarLayout(layoutOptions);

    expect(slots[0]).toEqual({ x: 12, y: 12 });
    expect(slots[1].y).toBe(12);
    expect(slots[1].x).toBeGreaterThan(slots[0].x);
  });

  it("omits the last star on each edge", () => {
    const slots = getSpiralStarLayout(layoutOptions);
    const step = layoutOptions.starSize + layoutOptions.gap;
    const right = layoutOptions.width - layoutOptions.inset - layoutOptions.starSize;
    const bottom = right;
    const topEdge = slots.filter((slot) => slot.y === 12 && slot.x <= right - step);

    expect(topEdge.at(-1)).toEqual({ x: right - step, y: 12 });

    const rightEdge = slots.filter((slot) => slot.x === right && slot.y < bottom);
    expect(rightEdge[0]).toEqual({ x: right, y: 12 });
    expect(rightEdge.at(-1)).toEqual({ x: right, y: bottom - step });

    const bottomEdge = slots.filter((slot) => slot.y === bottom && slot.x <= right - step);
    expect(bottomEdge[0]?.x).toBe(right - step);
  });

  it("continues down the right edge after the top edge", () => {
    const slots = getSpiralStarLayout(layoutOptions);
    const topRow = slots.filter((slot) => slot.y === 12);
    const step = layoutOptions.starSize + layoutOptions.gap;
    const right = layoutOptions.width - layoutOptions.inset - layoutOptions.starSize;
    const firstRightEdge = slots[topRow.length];

    expect(firstRightEdge).toEqual({ x: right, y: 12 + step });
  });

  it("spirals inward on later layers", () => {
    const slots = getSpiralStarLayout(layoutOptions);
    const step = layoutOptions.starSize + layoutOptions.gap;
    const innerTop = layoutOptions.inset + step;
    const innerTopRow = slots.filter((slot) => slot.y === innerTop);

    expect(innerTopRow.length).toBeGreaterThan(0);
    expect(innerTopRow[0].x).toBeGreaterThanOrEqual(layoutOptions.inset);
  });
});

describe("getVisibleStarLayout", () => {
  it("caps stars when there are more tasks than available slots", () => {
    const slots = getSpiralStarLayout(layoutOptions);
    const result = getVisibleStarLayout(slots.length + 5, layoutOptions);

    expect(result.points).toHaveLength(slots.length);
    expect(result.hiddenCount).toBe(5);
  });
});

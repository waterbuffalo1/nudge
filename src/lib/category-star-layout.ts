export type StarPoint = {
  x: number;
  y: number;
};

export type SpiralStarLayoutOptions = {
  width: number;
  height: number;
  starSize: number;
  gap: number;
  inset: number;
};

function pushUnique(slots: StarPoint[], point: StarPoint) {
  if (!slots.some((slot) => slot.x === point.x && slot.y === point.y)) {
    slots.push(point);
  }
}

function pushHorizontalEdge(
  slots: StarPoint[],
  y: number,
  startX: number,
  endX: number,
  step: number,
) {
  const limit = endX - step;

  if (step > 0) {
    for (let x = startX; x <= limit; x += step) {
      pushUnique(slots, { x, y });
    }
    return;
  }

  for (let x = startX; x >= limit; x += step) {
    pushUnique(slots, { x, y });
  }
}

function pushVerticalEdge(
  slots: StarPoint[],
  x: number,
  startY: number,
  endY: number,
  step: number,
) {
  const limit = endY - step;

  if (step > 0) {
    for (let y = startY; y <= limit; y += step) {
      pushUnique(slots, { x, y });
    }
    return;
  }

  for (let y = startY; y >= limit; y += step) {
    pushUnique(slots, { x, y });
  }
}

export function getSpiralStarLayout({
  width,
  height,
  starSize,
  gap,
  inset,
}: SpiralStarLayoutOptions): StarPoint[] {
  if (width <= 0 || height <= 0) {
    return [];
  }

  const slots: StarPoint[] = [];
  const step = starSize + gap;
  let layer = 0;

  while (true) {
    const left = inset + layer * step;
    const top = inset + layer * step;
    const right = width - inset - starSize - layer * step;
    const bottom = height - inset - starSize - layer * step;

    if (left >= right || top >= bottom) {
      break;
    }

    pushHorizontalEdge(slots, top, left, right, step);

    if (bottom > top) {
      pushVerticalEdge(slots, right, top, bottom, step);
      pushHorizontalEdge(slots, bottom, right, left, -step);
    }

    if (right > left && bottom > top) {
      pushVerticalEdge(slots, left, bottom, top + step, -step);
    }

    layer += 1;
  }

  return slots;
}

export function getVisibleStarLayout(
  total: number,
  options: SpiralStarLayoutOptions,
): { points: StarPoint[]; hiddenCount: number } {
  const slots = getSpiralStarLayout(options);
  const visibleCount = Math.min(total, slots.length);

  return {
    points: slots.slice(0, visibleCount),
    hiddenCount: Math.max(0, total - slots.length),
  };
}

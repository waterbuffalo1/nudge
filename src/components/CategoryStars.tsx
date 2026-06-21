"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getVisibleStarLayout } from "@/lib/category-star-layout";
import type { CategoryProgress } from "@/lib/category-progress";

const STAR_SIZE = 24;
const STAR_GAP = 4;
const STAR_INSET = 12;

type CategoryStarsProps = {
  progress?: CategoryProgress;
};

export function CategoryStars({ progress }: CategoryStarsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!progress || progress.total === 0) {
      return;
    }

    const measure = () => {
      const card = containerRef.current?.parentElement;
      if (!card) return;

      const { width, height } = card.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setSize({ width, height });
      }
    };

    measure();

    const card = containerRef.current?.parentElement;
    if (!card) return;

    const observer = new ResizeObserver(measure);
    observer.observe(card);

    return () => observer.disconnect();
  }, [progress]);

  const layout = useMemo(() => {
    if (!progress || progress.total === 0 || size.width === 0 || size.height === 0) {
      return null;
    }

    return getVisibleStarLayout(progress.total, {
      width: size.width,
      height: size.height,
      starSize: STAR_SIZE,
      gap: STAR_GAP,
      inset: STAR_INSET,
    });
  }, [progress, size.height, size.width]);

  if (!progress || progress.total === 0) {
    return null;
  }

  const label =
    layout && layout.hiddenCount > 0
      ? `${progress.completed} of ${progress.total} activities completed; ${layout.hiddenCount} not shown`
      : `${progress.completed} of ${progress.total} activities completed`;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-10"
      aria-label={label}
    >
      {layout?.points.map((point, index) => (
        <span
          key={index}
          className={`absolute text-2xl leading-none ${
            index < progress.completed ? "text-amber-500" : "text-border"
          }`}
          style={{ left: point.x, top: point.y, width: STAR_SIZE, height: STAR_SIZE }}
          aria-hidden
        >
          {index < progress.completed ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

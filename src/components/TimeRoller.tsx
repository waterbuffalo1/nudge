"use client";

import { useEffect, useRef, useState } from "react";

const ITEM_HEIGHT = 40;
const VISIBLE_ROWS = 5;
const PADDING_ROWS = Math.floor(VISIBLE_ROWS / 2);

const rollerItemBaseClassName =
  "font-category text-xl font-medium transition-colors duration-150";

function getRollerItemColorClass(distance: number): string {
  if (distance === 0) {
    return "text-foreground";
  }

  if (distance === 1) {
    return "text-muted/75";
  }

  return "text-done-soft";
}

type TimeRollerProps = {
  hour12: number;
  minute: number;
  meridiem: "am" | "pm";
  onHourChange: (hour12: number) => void;
  onMinuteChange: (minute: number) => void;
  onMeridiemChange: (meridiem: "am" | "pm") => void;
};

type RollerColumnProps<T extends string | number> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format: (value: T) => string;
};

function RollerColumn<T extends string | number>({
  options,
  value,
  onChange,
  format,
}: RollerColumnProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollEndTimerRef = useRef<number | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const [centerIndex, setCenterIndex] = useState(() => {
    const index = options.indexOf(value);
    return index >= 0 ? index : 0;
  });

  function getCenterIndex(container: HTMLDivElement): number {
    const index = Math.round(container.scrollTop / ITEM_HEIGHT);
    return Math.max(0, Math.min(options.length - 1, index));
  }

  function updateCenterIndex() {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    setCenterIndex(getCenterIndex(container));
  }

  useEffect(() => {
    const index = options.indexOf(value);
    const container = scrollRef.current;
    if (!container || index < 0) {
      return;
    }

    setCenterIndex(index);
    isProgrammaticScrollRef.current = true;
    container.scrollTop = index * ITEM_HEIGHT;

    const frameId = requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });

    return () => cancelAnimationFrame(frameId);
  }, [options, value]);

  function snapToNearest() {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const clamped = getCenterIndex(container);
    const nextValue = options[clamped]!;

    isProgrammaticScrollRef.current = true;
    container.scrollTop = clamped * ITEM_HEIGHT;
    setCenterIndex(clamped);
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });

    if (nextValue !== value) {
      onChange(nextValue);
    }
  }

  function handleScroll() {
    if (!isProgrammaticScrollRef.current) {
      updateCenterIndex();
    }

    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
    }

    scrollEndTimerRef.current = window.setTimeout(snapToNearest, 80);
  }

  useEffect(() => {
    return () => {
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative h-[200px] flex-1 overflow-hidden"
      style={{ height: ITEM_HEIGHT * VISIBLE_ROWS }}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overscroll-y-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {Array.from({ length: PADDING_ROWS }, (_, index) => (
          <div key={`pad-top-${index}`} style={{ height: ITEM_HEIGHT }} aria-hidden />
        ))}
        {options.map((option, index) => (
          <div
            key={String(option)}
            className={`flex items-center justify-center ${rollerItemBaseClassName} ${getRollerItemColorClass(
              Math.abs(index - centerIndex),
            )}`}
            style={{
              height: ITEM_HEIGHT,
              scrollSnapAlign: "center",
            }}
          >
            {format(option)}
          </div>
        ))}
        {Array.from({ length: PADDING_ROWS }, (_, index) => (
          <div key={`pad-bottom-${index}`} style={{ height: ITEM_HEIGHT }} aria-hidden />
        ))}
      </div>
    </div>
  );
}

export function TimeRoller({
  hour12,
  minute,
  meridiem,
  onHourChange,
  onMinuteChange,
  onMeridiemChange,
}: TimeRollerProps) {
  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
  const minutes = [0, 15, 30, 45] as const;
  const meridiems = ["am", "pm"] as const;

  return (
    <div className="relative mx-auto w-full max-w-xs">
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 border-y border-border"
        style={{ height: ITEM_HEIGHT }}
        aria-hidden
      />
      <div className="flex items-stretch gap-1">
        <RollerColumn
          options={hours}
          value={hour12 as (typeof hours)[number]}
          onChange={onHourChange}
          format={(value) => String(value)}
        />
        <RollerColumn
          options={minutes}
          value={minute as (typeof minutes)[number]}
          onChange={onMinuteChange}
          format={(value) => String(value).padStart(2, "0")}
        />
        <RollerColumn
          options={meridiems}
          value={meridiem}
          onChange={onMeridiemChange}
          format={(value) => value}
        />
      </div>
    </div>
  );
}

type DayRollerProps = {
  dayOffset: 0 | 1 | 2;
  onDayOffsetChange: (dayOffset: 0 | 1 | 2) => void;
};

const DAY_OFFSETS = [2, 1, 0] as const;
const DAY_LABELS: Record<(typeof DAY_OFFSETS)[number], string> = {
  0: "today",
  1: "yesterday",
  2: "day before yesterday",
};

export function DayRoller({ dayOffset, onDayOffsetChange }: DayRollerProps) {
  return (
    <div className="relative mx-auto w-full max-w-xs">
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 border-y border-border"
        style={{ height: ITEM_HEIGHT }}
        aria-hidden
      />
      <RollerColumn
        options={DAY_OFFSETS}
        value={dayOffset}
        onChange={onDayOffsetChange}
        format={(value) => DAY_LABELS[value]}
      />
    </div>
  );
}

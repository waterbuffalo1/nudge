"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DoneOverlay } from "@/components/DoneOverlay";
import type { Activity } from "@/lib/activities";
import { getDoneCopy } from "@/lib/done-copy";

type ActivityCardProps = {
  activity: Activity;
  isDone?: boolean;
  onComplete: () => void;
  onUndo: () => void;
};

type OverlayPhase = "assembling" | "visible" | "disintegrating";

const DISPLAY_MS = 2000;
const LONG_PRESS_MS = 750;

export function ActivityCard({
  activity,
  isDone = false,
  onComplete,
  onUndo,
}: ActivityCardProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<OverlayPhase>("assembling");
  const [overlaySeed, setOverlaySeed] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);
  const pendingCompleteRef = useRef(false);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = null;
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }, []);

  const dismissOverlay = useCallback(() => {
    if (overlayPhase === "disintegrating") return;
    clearDismissTimer();
    setOverlayPhase("disintegrating");
  }, [overlayPhase, clearDismissTimer]);

  const handleAssembleComplete = useCallback(() => {
    setOverlayPhase("visible");
  }, []);

  const handleExitComplete = useCallback(() => {
    if (pendingCompleteRef.current) {
      pendingCompleteRef.current = false;
      onComplete();
    }
    setShowOverlay(false);
    setIsAnimating(false);
  }, [onComplete]);

  useEffect(() => {
    if (!showOverlay || overlayPhase !== "visible") return;

    dismissTimerRef.current = setTimeout(dismissOverlay, DISPLAY_MS);

    return clearDismissTimer;
  }, [showOverlay, overlayPhase, dismissOverlay, clearDismissTimer]);

  const handlePointerDown = () => {
    if (!isDone || isAnimating) return;

    didLongPressRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      onUndo();
    }, LONG_PRESS_MS);
  };

  const handlePointerEnd = () => {
    clearLongPressTimer();
  };

  const doneCopy = getDoneCopy(activity);

  const handleTap = () => {
    if (isDone || isAnimating || didLongPressRef.current) {
      didLongPressRef.current = false;
      return;
    }

    pendingCompleteRef.current = !isDone;
    setIsAnimating(true);
    setOverlaySeed(Date.now());
    setOverlayPhase("assembling");
    setShowOverlay(true);
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleTap}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onContextMenu={(event) => {
          if (isDone) event.preventDefault();
        }}
        className="flex w-full touch-manipulation items-center justify-start gap-3 rounded-[2.75rem] border-2 border-border bg-elevated px-6 py-5 text-left active:scale-[0.98] transition-transform select-none"
      >
        {activity.emoji ? (
          <span className="text-3xl leading-none" aria-hidden>
            {activity.emoji}
          </span>
        ) : (
          <span className="w-8 shrink-0" aria-hidden />
        )}
        <span
          className={`min-w-0 flex-1 font-category text-2xl font-medium leading-tight ${
            isDone
              ? "text-done line-through decoration-done decoration-2"
              : "text-foreground"
          }`}
        >
          {activity.name}
        </span>
        <span
          className={`ml-2 shrink-0 text-right font-category text-xs leading-snug ${
            isDone ? "" : "invisible"
          }`}
          aria-hidden={!isDone}
        >
          <span className="block font-medium text-foreground">{doneCopy.title}</span>
          <span className="block whitespace-nowrap text-muted">{doneCopy.message}</span>
        </span>
      </button>
      {showOverlay && (
        <DoneOverlay
          phase={overlayPhase}
          seed={overlaySeed}
          title={doneCopy.title}
          message={doneCopy.message}
          onDismiss={dismissOverlay}
          onAssembleComplete={handleAssembleComplete}
          onExitComplete={handleExitComplete}
        />
      )}
    </div>
  );
}

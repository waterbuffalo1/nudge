"use client";

import { useEffect, useMemo, useRef } from "react";

const CELL_SIZE = 2;
const ANIMATION_MS = 275;
const CELL_DURATION_MS = 110;
const MAX_DELAY_MS = 165;
const TEXT_STEPS = 8;

export const DONE_PIXEL_IN_MS = ANIMATION_MS;
export const DONE_PIXEL_OUT_MS = ANIMATION_MS;

function easeIn(t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * clamped;
}

function toEasedElapsed(elapsed: number) {
  return easeIn(elapsed / ANIMATION_MS) * ANIMATION_MS;
}

type DoneOverlayProps = {
  phase: "assembling" | "visible" | "disintegrating";
  title: string;
  message: string;
  onDismiss: () => void;
  onAssembleComplete: () => void;
  onExitComplete: () => void;
  seed: number;
};

type PixelCell = {
  col: number;
  row: number;
  inDelay: number;
  outDelay: number;
};

function createCells(seed: number, cols: number, rows: number): PixelCell[] {
  let random = seed % 2147483647 || 1;

  const next = () => {
    random = (random * 16807) % 2147483647;
    return random / 2147483647;
  };

  return Array.from({ length: cols * rows }, (_, index) => ({
    col: index % cols,
    row: Math.floor(index / cols),
    inDelay: Math.floor(next() * MAX_DELAY_MS),
    outDelay: Math.floor(next() * MAX_DELAY_MS),
  }));
}

function blockyOpacity(value: number) {
  return Math.max(0, Math.min(1, Math.round(value * 4) / 4));
}

function steppedProgress(elapsed: number) {
  const eased = easeIn(elapsed / ANIMATION_MS);
  return Math.round(eased * TEXT_STEPS) / TEXT_STEPS;
}

function applyTextProgress(element: HTMLElement, progress: number) {
  const scale = 0.6 + 0.4 * progress;
  const blur = 6 * (1 - progress);
  element.style.opacity = String(progress);
  element.style.transform = `scale(${scale})`;
  element.style.filter = blur > 0 ? `blur(${blur}px)` : "none";
}

function parseRgb(color: string): [number, number, number] {
  const hex = color.replace("#", "").trim();
  if (hex.length === 6) {
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
    ];
  }
  return [228, 224, 217];
}

function getBackgroundColor() {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--background")
      .trim() || "#e4e0d9"
  );
}

export function DoneOverlay({
  phase,
  title,
  message,
  onDismiss,
  onAssembleComplete,
  onExitComplete,
  seed,
}: DoneOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);
  const showGrid = phase === "assembling" || phase === "disintegrating";
  const showSolidBackground =
    phase === "visible" || phase === "disintegrating";

  const { cells } = useMemo(() => {
    const cols = Math.ceil(window.innerWidth / CELL_SIZE);
    const rows = Math.ceil(window.innerHeight / CELL_SIZE);
    return { cells: createCells(seed, cols, rows), cols, rows };
  }, [seed]);

  useEffect(() => {
    completedRef.current = false;
  }, [phase, seed]);

  useEffect(() => {
    if (phase !== "visible" || !contentRef.current) return;
    applyTextProgress(contentRef.current, 1);
  }, [phase]);

  useEffect(() => {
    if (!showGrid || !contentRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const content = contentRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    const blockSize = CELL_SIZE * dpr;

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const [red, green, blue] = parseRgb(getBackgroundColor());
    const imageData = ctx.createImageData(pixelWidth, pixelHeight);
    const pixels = imageData.data;
    const start = performance.now();
    let frameId = 0;

    const finish = () => {
      if (completedRef.current) return;
      completedRef.current = true;

      if (phase === "assembling") {
        applyTextProgress(content, 1);
        onAssembleComplete();
      } else {
        applyTextProgress(content, 0);
        onExitComplete();
      }
    };

    const draw = (now: number) => {
      const elapsed = now - start;
      const easedElapsed = toEasedElapsed(elapsed);
      pixels.fill(0);

      for (const cell of cells) {
        let opacity = 0;

        if (phase === "assembling") {
          const progress = (easedElapsed - cell.inDelay) / CELL_DURATION_MS;
          if (progress <= 0) continue;
          opacity = progress >= 1 ? 1 : blockyOpacity(progress);
        } else if (easedElapsed < cell.outDelay) {
          opacity = 1;
        } else {
          const progress = (easedElapsed - cell.outDelay) / CELL_DURATION_MS;
          if (progress >= 1) continue;
          opacity = blockyOpacity(1 - progress);
        }

        const alpha = Math.round(opacity * 255);
        if (alpha <= 0) continue;

        const x0 = cell.col * blockSize;
        const y0 = cell.row * blockSize;

        for (let py = 0; py < blockSize; py++) {
          const y = y0 + py;
          if (y >= pixelHeight) continue;

          for (let px = 0; px < blockSize; px++) {
            const x = x0 + px;
            if (x >= pixelWidth) continue;

            const index = (y * pixelWidth + x) * 4;
            pixels[index] = red;
            pixels[index + 1] = green;
            pixels[index + 2] = blue;
            pixels[index + 3] = alpha;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      const textProgress =
        phase === "assembling"
          ? steppedProgress(elapsed)
          : 1 - steppedProgress(elapsed);
      applyTextProgress(content, textProgress);

      if (elapsed >= ANIMATION_MS) {
        finish();
        return;
      }

      frameId = requestAnimationFrame(draw);
    };

    applyTextProgress(content, phase === "assembling" ? 0 : 1);
    frameId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(frameId);
  }, [phase, cells, showGrid, onAssembleComplete, onExitComplete]);

  return (
    <button
      type="button"
      onClick={onDismiss}
      className="fixed inset-0 z-50 overflow-hidden"
      aria-live="polite"
    >
      {showSolidBackground && (
        <div className="absolute inset-0 bg-background" aria-hidden />
      )}
      {showGrid && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden
        />
      )}
      <div
        ref={contentRef}
        className="absolute inset-0 flex items-center justify-center px-6"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-category text-3xl font-medium text-foreground">
            {title}
          </span>
          <span className="max-w-[min(100%,20rem)] font-category text-lg font-medium text-balance text-muted">
            {message}
          </span>
        </div>
      </div>
    </button>
  );
}

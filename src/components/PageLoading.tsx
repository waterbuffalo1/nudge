"use client";

import { useEffect, useState } from "react";

export const LOADING_DELAY_MS = 500;

type PageLoadingProps = {
  label?: string;
  className?: string;
};

type DelayedLoadingOverlayProps = PageLoadingProps & {
  isLoading: boolean;
  delayMs?: number;
};

const loadingLabelClassName =
  "text-2xl font-bold tracking-tight text-foreground";

function useDelayedTrue(active: boolean, delayMs: number): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShow(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [active, delayMs]);

  return show;
}

export function LoadingOverlay({
  label = "loading...",
  className = "",
}: PageLoadingProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-5 ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="absolute inset-0 bg-[var(--overlay-fade-half)]"
        aria-hidden
      />
      <p className={`relative ${loadingLabelClassName} text-center`}>{label}</p>
    </div>
  );
}

export function DelayedLoadingOverlay({
  isLoading,
  label = "loading...",
  className = "",
  delayMs = LOADING_DELAY_MS,
}: DelayedLoadingOverlayProps) {
  const showLoading = useDelayedTrue(isLoading, delayMs);

  if (!showLoading) {
    return null;
  }

  return <LoadingOverlay label={label} className={className} />;
}

export function PageLoading(props: PageLoadingProps) {
  return <DelayedLoadingOverlay isLoading {...props} />;
}

export function SectionLoading(
  props: PageLoadingProps & { isLoading?: boolean },
) {
  return (
    <DelayedLoadingOverlay
      isLoading={props.isLoading ?? true}
      label={props.label}
      className={props.className}
    />
  );
}

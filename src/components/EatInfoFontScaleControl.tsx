const fontScaleButtonClassName =
  "flex items-center touch-manipulation text-muted active:text-foreground disabled:opacity-35 disabled:active:text-muted";

function MinusIcon() {
  return (
    <svg
      className="size-3.5 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M4 8h8" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      className="size-3.5 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M8 4v8M4 8h8" strokeLinecap="round" />
    </svg>
  );
}

type EatInfoFontScaleControlProps = {
  rowClassName: string;
  iconSlotClassName: string;
  labelClassName: string;
  buttonClassName: string;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
};

export function EatInfoFontScaleControl({
  rowClassName,
  iconSlotClassName,
  labelClassName,
  buttonClassName,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
}: EatInfoFontScaleControlProps) {
  return (
    <div className={rowClassName}>
      <button
        type="button"
        className={`${fontScaleButtonClassName} ${buttonClassName}`}
        aria-label="Decrease text size"
        disabled={!canDecrease}
        onClick={onDecrease}
      >
        <span className={iconSlotClassName}>
          <MinusIcon />
        </span>
      </button>
      <span className={`${labelClassName} -ml-px`}>font size</span>
      <button
        type="button"
        className={`${fontScaleButtonClassName} ${buttonClassName}`}
        aria-label="Increase text size"
        disabled={!canIncrease}
        onClick={onIncrease}
      >
        <span className={iconSlotClassName}>
          <PlusIcon />
        </span>
      </button>
    </div>
  );
}

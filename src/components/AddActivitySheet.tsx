"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ACTIVITY_NAME_MAX,
  DONE_MESSAGE_MAX,
  EMOJI_MAX,
  validateCustomActivityInput,
  type CustomActivityInput,
} from "@/lib/custom-activities";
import { DEFAULT_DONE_MESSAGE } from "@/lib/done-copy";

type AddActivitySheetProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CustomActivityInput) => Promise<void>;
};

export function AddActivitySheet({
  open,
  onClose,
  onSubmit,
}: AddActivitySheetProps) {
  const titleId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [doneMessage, setDoneMessage] = useState("");
  const [sendToMakers, setSendToMakers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setName("");
    setEmoji("");
    setDoneMessage("");
    setSendToMakers(false);
    setError(null);
    setSaving(false);

    const frame = requestAnimationFrame(() => {
      nameRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateCustomActivityInput({
      name,
      emoji,
      doneMessage,
    });

    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSubmit({
        name: validation.data.name,
        emoji: validation.data.emoji || undefined,
        doneMessage: validation.data.doneMessage,
        sendToMakers,
      });
      onClose();
    } catch {
      setError("couldn't save — try again");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <button
        type="button"
        aria-label="close"
        className="absolute inset-0 bg-background/60"
        onClick={onClose}
      />
      <form
        role="dialog"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        className="relative z-10 mx-auto w-full max-w-md rounded-t-[2rem] border-2 border-b-0 border-border bg-elevated px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-lg"
      >
        <h2
          id={titleId}
          className="mb-4 font-category text-xl font-medium text-foreground"
        >
          new activity
        </h2>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-muted">activity</span>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={ACTIVITY_NAME_MAX}
            placeholder="e.g. stretch"
            className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 font-category text-lg text-foreground outline-none focus:border-foreground"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-muted">
            emoji <span className="text-done">(optional)</span>
          </span>
          <input
            type="text"
            value={emoji}
            onChange={(event) => setEmoji(event.target.value)}
            maxLength={EMOJI_MAX}
            placeholder="🙂"
            className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-2xl text-foreground outline-none focus:border-foreground"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-muted">
            done text <span className="text-done">(optional)</span>
          </span>
          <input
            type="text"
            value={doneMessage}
            onChange={(event) => setDoneMessage(event.target.value)}
            maxLength={DONE_MESSAGE_MAX}
            placeholder={DEFAULT_DONE_MESSAGE}
            className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 font-category text-lg text-foreground outline-none focus:border-foreground"
          />
        </label>

        <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-border bg-background px-4 py-3">
          <input
            type="checkbox"
            checked={sendToMakers}
            onChange={(event) => setSendToMakers(event.target.checked)}
            className="mt-1 size-4 shrink-0 accent-foreground"
          />
          <span className="font-category text-sm leading-snug text-foreground">
            send to app makers <span aria-hidden>👨‍🍳</span>
            <span className="mt-0.5 block text-xs text-muted">
              bake this into the app going forward
            </span>
          </span>
        </label>

        {error && (
          <p className="mb-3 text-sm text-foreground" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[2rem] border-2 border-border bg-background px-4 py-3 font-category text-lg font-medium text-muted active:scale-[0.98] transition-transform"
          >
            cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-[2rem] border-2 border-border bg-background px-4 py-3 font-category text-lg font-medium text-foreground active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {saving ? "adding…" : "add"}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DelayedLoadingOverlay } from "@/components/PageLoading";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();

    if (!response.ok) {
      setLoading(false);
      setError(data.error ?? "Could not sign in.");
      return;
    }

    const from = searchParams.get("from") || "/";
    router.replace(from.startsWith("/login") ? "/" : from);
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
      <label className="block text-sm font-medium text-muted">
        password
        <input
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
          autoComplete="current-password"
          className="mt-1 w-full rounded-2xl border-2 border-border bg-elevated px-4 py-3 font-category text-lg text-foreground outline-none focus:border-foreground"
        />
      </label>

      {error && (
        <p className="text-sm text-foreground" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !password.trim()}
        className="w-full rounded-[2rem] border-2 border-border bg-elevated px-4 py-3 font-category text-lg font-medium text-foreground active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        continue
      </button>
    </form>
    <DelayedLoadingOverlay isLoading={loading} label="checking…" />
    </>
  );
}

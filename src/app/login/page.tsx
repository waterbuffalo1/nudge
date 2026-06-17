import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        nudge...
      </h1>
      <p className="mt-2 text-sm text-muted">
        This app is private. Enter the site password to continue.
      </p>

      <Suspense
        fallback={<p className="mt-8 text-sm text-muted">Loading…</p>}
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}

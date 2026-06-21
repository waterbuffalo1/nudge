import { CategoryGrid } from "@/components/CategoryGrid";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-foreground">
        nudge...
      </h1>
      <CategoryGrid />
      <div className="scroll-pad-bottom-spacer" aria-hidden />
    </main>
  );
}

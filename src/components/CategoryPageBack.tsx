"use client";

import { NavLink } from "@/components/NavLink";

export function CategoryPageBack() {
  return (
    <NavLink
      href="/"
      className="mb-8 text-sm font-medium text-muted active:text-foreground"
    >
      ← back
    </NavLink>
  );
}

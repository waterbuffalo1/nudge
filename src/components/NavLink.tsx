"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { useTransition } from "react";

type NavLinkProps = ComponentProps<typeof Link>;

function getHrefString(href: NavLinkProps["href"]): string {
  if (typeof href === "string") {
    return href;
  }

  const pathname = href.pathname ?? "/";
  const query = href.query;

  if (!query) {
    return pathname;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item));
      }
      continue;
    }

    params.set(key, String(value));
  }

  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function NavLink({
  href,
  className,
  onClick,
  children,
  ...props
}: NavLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    startTransition(() => {
      router.push(getHrefString(href));
    });
  }

  return (
    <Link
      href={href}
      className={`${className ?? ""}${isPending ? " pointer-events-none opacity-60" : ""}`}
      aria-busy={isPending}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}

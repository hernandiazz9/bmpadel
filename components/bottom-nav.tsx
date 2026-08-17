"use client";

import { CalendarDays, Newspaper, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/wall", label: strings.nav.wall, Icon: Newspaper },
  { href: "/classes", label: strings.nav.classes, Icon: CalendarDays },
  { href: "/me", label: strings.nav.me, Icon: User },
] as const;

/**
 * Three tabs, fixed to the bottom, capped to the same 480px as the content.
 *
 * No `ball` here on purpose: the two-per-screen budget for the loudest colour
 * belongs to content, and a permanently visible nav would spend it on every
 * screen at once (CONTEXT.md rule 2).
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card">
      <ul className="mx-auto flex w-full max-w-app pb-safe">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon
                  className="size-6"
                  strokeWidth={active ? 2.25 : 1.75}
                  aria-hidden
                />
                <span
                  className={cn(
                    "text-[11px] leading-none",
                    active ? "font-semibold" : "font-medium",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

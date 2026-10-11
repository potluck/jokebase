"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/hunks", label: "Hunks" },
  { href: "/bits", label: "Bits" },
  { href: "/sets", label: "Sets" },
];

export default function Nav({
  user,
}: {
  user: { name: string; email: string } | null;
}) {
  const path = usePathname();

  return (
    <nav className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-3 flex items-center gap-6">
      <span className="font-mono font-bold text-sm tracking-tight mr-2">
        jokebase
      </span>
      {user && links.map(({ href, label }) => {
        const active =
          href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`text-sm ${
              active
                ? "text-foreground font-medium"
                : "text-neutral-500 hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}
      {user && (
        <form
          action="/auth/logout"
          method="post"
          className="ml-auto flex items-center gap-3"
        >
          <span
            className="text-sm text-neutral-500 hidden sm:inline"
            title={user.email}
          >
            {user.name}
          </span>
          <button
            type="submit"
            className="text-sm text-neutral-500 hover:text-foreground"
          >
            Log out
          </button>
        </form>
      )}
    </nav>
  );
}

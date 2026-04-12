"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/hunks", label: "Hunks" },
  { href: "/bits", label: "Bits" },
  { href: "/shows", label: "Shows" },
];

export default function Nav() {
  const path = usePathname();

  return (
    <nav className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-3 flex items-center gap-6">
      <span className="font-mono font-bold text-sm tracking-tight mr-2">
        jokebase
      </span>
      {links.map(({ href, label }) => {
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
    </nav>
  );
}

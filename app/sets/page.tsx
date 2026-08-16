import Link from "next/link";
import type { Metadata } from "next";
import { getSets } from "@/app/lib/data";

export const metadata: Metadata = { title: "Sets" };

function setTypeLabel(type: string) {
  return type === "SHOW" ? "Show" : "Open mic";
}

export default async function SetsPage() {
  const sets = await getSets();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sets</h1>
        <Link
          href="/sets/new"
          className="text-sm bg-foreground text-background px-3 py-1.5 rounded hover:opacity-80"
        >
          + Log set
        </Link>
      </div>

      {sets.length === 0 ? (
        <p className="text-neutral-500">No sets logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {sets.map((set) => {
            const totalLines = set.hunks.reduce(
              (acc, h) => acc + h.bits.reduce((a, b) => a + b.lines.length, 0),
              0
            );
            return (
              <li key={set.id}>
                <Link
                  href={`/sets/${set.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
                >
                  <div>
                    <span className="font-medium">
                      {new Date(set.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        timeZone: "UTC",
                        day: "numeric",
                      })}
                    </span>
                    {set.venue && (
                      <span className="text-neutral-500 ml-2">@ {set.venue}</span>
                    )}
                  </div>
                  <span className="text-sm text-neutral-500">
                    {setTypeLabel(set.type)} · {set.hunks.length} hunk
                    {set.hunks.length !== 1 ? "s" : ""} · {totalLines} line
                    {totalLines !== 1 ? "s" : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

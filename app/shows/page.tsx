import Link from "next/link";
import type { Metadata } from "next";
import { getShows } from "@/app/lib/data";

export const metadata: Metadata = { title: "Shows" };

function showLabel(type: string) {
  return type === "SHOW" ? "Show" : "Open mic";
}

export default async function ShowsPage() {
  const shows = await getShows();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shows</h1>
        <Link
          href="/shows/new"
          className="text-sm bg-foreground text-background px-3 py-1.5 rounded hover:opacity-80"
        >
          + Log show
        </Link>
      </div>

      {shows.length === 0 ? (
        <p className="text-neutral-500">No shows logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {shows.map((show) => {
            const totalLines = show.hunks.reduce(
              (acc, h) => acc + h.bits.reduce((a, b) => a + b.lines.length, 0),
              0
            );
            return (
              <li key={show.id}>
                <Link
                  href={`/shows/${show.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
                >
                  <div>
                    <span className="font-medium">
                      {new Date(show.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        timeZone: "UTC",
                        day: "numeric",
                      })}
                    </span>
                    {show.venue && (
                      <span className="text-neutral-500 ml-2">@ {show.venue}</span>
                    )}
                  </div>
                  <span className="text-sm text-neutral-500">
                    {showLabel(show.type)} · {show.hunks.length} hunk
                    {show.hunks.length !== 1 ? "s" : ""} · {totalLines} line
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

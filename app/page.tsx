import Link from "next/link";
import { db } from "./lib/db";
import { getShows } from "./lib/data";

export default async function DashboardPage() {
  const [hunkCount, bitCount, shows] = await Promise.all([
    db.hunk.count(),
    db.bit.count(),
    getShows(),
  ]);

  const recentShows = shows.slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Hunks", value: hunkCount, href: "/hunks" },
          { label: "Bits", value: bitCount, href: "/bits" },
          { label: "Shows", value: shows.length, href: "/shows" },
        ].map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors text-center"
          >
            <div className="text-3xl font-bold">{value}</div>
            <div className="text-sm text-neutral-500 mt-1">{label}</div>
          </Link>
        ))}
      </div>

      {/* Recent shows */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent shows</h2>
          <Link href="/shows/new" className="text-sm text-neutral-500 hover:text-foreground">
            + Log show
          </Link>
        </div>
        {recentShows.length === 0 ? (
          <p className="text-neutral-500 text-sm">No shows logged yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentShows.map((show) => (
              <li key={show.id}>
                <Link
                  href={`/shows/${show.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors text-sm"
                >
                  <span>
                    {new Date(show.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                    {show.venue && (
                      <span className="text-neutral-500 ml-2">@ {show.venue}</span>
                    )}
                  </span>
                  <span className="text-neutral-500">
                    {show.hunks.length} hunk{show.hunks.length !== 1 ? "s" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

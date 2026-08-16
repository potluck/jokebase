import Link from "next/link";
import { db } from "./lib/db";
import { getSets } from "./lib/data";

export default async function DashboardPage() {
  const [hunkCount, bitCount, sets] = await Promise.all([
    db.hunk.count(),
    db.bit.count(),
    getSets(),
  ]);

  const recentSets = sets.slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Hunks", value: hunkCount, href: "/hunks" },
          { label: "Bits", value: bitCount, href: "/bits" },
          { label: "Sets", value: sets.length, href: "/sets" },
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

      {/* Recent sets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent sets</h2>
          <Link href="/sets/new" className="text-sm text-neutral-500 hover:text-foreground">
            + Log set
          </Link>
        </div>
        {recentSets.length === 0 ? (
          <p className="text-neutral-500 text-sm">No sets logged yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentSets.map((set) => (
              <li key={set.id}>
                <Link
                  href={`/sets/${set.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors text-sm"
                >
                  <span>
                    {new Date(set.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                    {set.venue && (
                      <span className="text-neutral-500 ml-2">@ {set.venue}</span>
                    )}
                  </span>
                  <span className="text-neutral-500">
                    {set.hunks.length} hunk{set.hunks.length !== 1 ? "s" : ""}
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

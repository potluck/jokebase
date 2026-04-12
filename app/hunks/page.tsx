import Link from "next/link";
import { getLatestHunkVersions } from "@/app/lib/data";

export default async function HunksPage() {
  const hunks = await getLatestHunkVersions();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Hunks</h1>
        <Link
          href="/hunks/new"
          className="text-sm bg-foreground text-background px-3 py-1.5 rounded hover:opacity-80"
        >
          + New hunk
        </Link>
      </div>

      {hunks.length === 0 ? (
        <p className="text-neutral-500">No hunks yet.</p>
      ) : (
        <ul className="space-y-2">
          {hunks.map((hv) => (
            <li key={hv.hunkId}>
              <Link
                href={`/hunks/${hv.hunkId}`}
                className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
              >
                <span className="font-medium">{hv.title}</span>
                <span className="text-sm text-neutral-500">
                  {hv.bits.length} bit{hv.bits.length !== 1 ? "s" : ""} · v
                  {hv.version}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

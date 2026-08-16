import Link from "next/link";
import BitScore from "@/app/components/bit-score";
import { calculateBitScore } from "@/app/lib/bit-score";
import type { getBitSetHistory } from "@/app/lib/data";

type History = Awaited<ReturnType<typeof getBitSetHistory>>;

function formatSetDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function setTypeLabel(type: string) {
  return type === "SHOW" ? "Show" : "Open mic";
}

function StaticRating({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-neutral-400">Not rated</span>;
  }

  return (
    <span
      className="inline-flex gap-0.5 text-sm"
      aria-label={`${value} out of 5 stars`}
      title={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          aria-hidden="true"
          className={star <= value ? "text-yellow-400" : "text-neutral-300 dark:text-neutral-600"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function BitSetHistory({ history }: { history: History }) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">Set history</h2>
        <span className="text-sm text-neutral-500">
          {history.length} performance{history.length === 1 ? "" : "s"}
        </span>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-neutral-500 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-4">
          This bit has not appeared in a logged set yet.
        </p>
      ) : (
        <ol className="relative ml-2 border-l border-neutral-200 dark:border-neutral-800 space-y-5">
          {history.map((performance) => {
            const set = performance.showHunk.show;
            const score = calculateBitScore(performance.lines);

            return (
              <li key={performance.id} className="relative pl-6">
                <span className="absolute -left-1.5 top-5 h-3 w-3 rounded-full bg-foreground ring-4 ring-background" />
                <article className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                  <div className="flex items-start justify-between gap-4 px-4 py-3 bg-neutral-50 dark:bg-neutral-900/40 border-b border-neutral-100 dark:border-neutral-800">
                    <div>
                      <Link
                        href={`/sets/${set.id}`}
                        className="font-medium hover:underline underline-offset-4"
                      >
                        {formatSetDate(set.date)}
                        {set.venue ? ` · ${set.venue}` : ""}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                        <span>
                          {setTypeLabel(set.type)} · {performance.showHunk.hunkVersion.title} · bit v
                          {performance.bitVersion.version}
                        </span>
                        <BitScore score={score} />
                      </div>
                    </div>
                  </div>

                  <ol className="px-4 py-3 space-y-2">
                    {performance.lines.map((line) => (
                      <li
                        key={line.id}
                        className={`flex items-start gap-3 text-sm rounded px-2 py-0.5 -mx-2 ${
                          (line.rating ?? 0) >= 3
                            ? "bg-yellow-100 dark:bg-yellow-900/30"
                            : ""
                        }`}
                      >
                        <span className="flex-1 text-neutral-700 dark:text-neutral-300 leading-snug">
                          {line.lineVersion.line.type === "SETUP" && (
                            <span className="inline-block text-[10px] font-medium uppercase tracking-wide bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded px-1.5 py-0.5 mr-2 align-middle">
                              setup
                            </span>
                          )}
                          {line.lineVersion.text}
                        </span>
                        <StaticRating value={line.rating} />
                      </li>
                    ))}
                  </ol>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

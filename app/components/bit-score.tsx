import { formatBitScore } from "@/app/lib/bit-score";

export default function BitScore({ score }: { score: number | null }) {
  if (score === null) return null;

  const maximumScore = 3.5;
  const progress = Math.min(Math.max(score / maximumScore, 0), 1);
  const hue = Math.round(progress * 120);

  return (
    <span
      className="shrink-0 rounded-full border border-[hsl(var(--score-hue)_65%_50%)] bg-[hsl(var(--score-hue)_80%_88%)] dark:bg-[hsl(var(--score-hue)_55%_20%)] px-2.5 py-0.5 text-sm font-bold tabular-nums text-[hsl(var(--score-hue)_70%_20%)] dark:text-[hsl(var(--score-hue)_75%_82%)]"
      style={{ "--score-hue": hue } as React.CSSProperties}
      title="Score on a red-to-green scale capped at 3.5; unrated non-setup lines count as 0"
    >
      {formatBitScore(score)}
    </span>
  );
}

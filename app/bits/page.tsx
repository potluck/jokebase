import Link from "next/link";
import type { Metadata } from "next";
import { getSession, isOwner } from "@/app/lib/session";
import BitScore from "@/app/components/bit-score";
import { getLatestBitVersionsWithSetCounts } from "@/app/lib/data";

export const metadata: Metadata = { title: "Bits" };

export default async function BitsPage() {
  const [bits, session] = await Promise.all([getLatestBitVersionsWithSetCounts(), getSession()]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bits</h1>
        {isOwner(session) && (
          <Link
            href="/bits/new"
            className="text-sm bg-foreground text-background px-3 py-1.5 rounded hover:opacity-80"
          >
            + New bit
          </Link>
        )}
      </div>

      {bits.length === 0 ? (
        <p className="text-neutral-500">No bits yet.</p>
      ) : (
        <ul className="space-y-2">
          {bits.map((bv) => (
            <li key={bv.bitId}>
              <Link
                href={`/bits/${bv.bitId}`}
                className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="font-medium">{bv.title}</span>
                  <BitScore score={bv.averageScore} />
                  <span className="text-xs text-neutral-500">
                    {bv.setCount} set{bv.setCount === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="text-sm text-neutral-500">
                  {bv.lines.length} line{bv.lines.length !== 1 ? "s" : ""} · v{bv.version}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { updateHunk } from "@/app/lib/actions";
import type { getLatestHunkVersion, getAllHunkVersions, getLatestBitVersions } from "@/app/lib/data";

type LatestHunkVersion = NonNullable<Awaited<ReturnType<typeof getLatestHunkVersion>>>;
type AllVersions = Awaited<ReturnType<typeof getAllHunkVersions>>;
type AllBits = Awaited<ReturnType<typeof getLatestBitVersions>>;

interface Props {
  hunkId: string;
  latestVersion: LatestHunkVersion;
  allVersions: AllVersions;
  allBits: AllBits;
}

interface BitSlot {
  bitId: string;
  bitVersionId: string;
  title: string;
}

export default function HunkEditor({ hunkId, latestVersion, allVersions, allBits }: Props) {
  const [title, setTitle] = useState(latestVersion.title);
  const [bits, setBits] = useState<BitSlot[]>(
    latestVersion.bits.map((hvb) => ({
      bitId: hvb.bitId,
      bitVersionId: hvb.bitVersionId,
      title: hvb.bitVersion.title,
    }))
  );
  const [showHistory, setShowHistory] = useState(false);
  const [pending, startTransition] = useTransition();

  const assignedBitIds = new Set(bits.map((b) => b.bitId));
  const availableBits = allBits.filter((bv) => !assignedBitIds.has(bv.bitId));

  function addBit(bv: AllBits[number]) {
    setBits((prev) => [
      ...prev,
      { bitId: bv.bitId, bitVersionId: bv.id, title: bv.title },
    ]);
  }

  function removeBit(bitId: string) {
    setBits((prev) => prev.filter((b) => b.bitId !== bitId));
  }

  function moveUp(i: number) {
    if (i === 0) return;
    setBits((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  }

  function moveDown(i: number) {
    setBits((prev) => {
      if (i === prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      await updateHunk(hunkId, title, bits.map(({ bitId, bitVersionId }) => ({ bitId, bitVersionId })));
    });
  }

  const hasChanges =
    title !== latestVersion.title ||
    bits.length !== latestVersion.bits.length ||
    bits.some((b, i) => b.bitId !== latestVersion.bits[i]?.bitId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-foreground focus:outline-none w-full mr-4"
        />
        <button
          onClick={handleSave}
          disabled={pending || !hasChanges || !title.trim()}
          className="shrink-0 bg-foreground text-background px-4 py-1.5 rounded text-sm font-medium hover:opacity-80 disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save new version"}
        </button>
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-3">
          Bits in this hunk
        </h2>
        {bits.length === 0 ? (
          <p className="text-neutral-500 text-sm">No bits added yet.</p>
        ) : (
          <ul className="space-y-2">
            {bits.map((b, i) => (
              <li
                key={b.bitId}
                className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800"
              >
                <span className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    className="text-xs text-neutral-400 hover:text-foreground disabled:opacity-20 leading-none"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(i)}
                    disabled={i === bits.length - 1}
                    className="text-xs text-neutral-400 hover:text-foreground disabled:opacity-20 leading-none"
                  >
                    ▼
                  </button>
                </span>
                <span className="flex-1 font-medium">{b.title}</span>
                <button
                  type="button"
                  onClick={() => removeBit(b.bitId)}
                  className="text-neutral-400 hover:text-red-500 text-sm px-1"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {availableBits.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-neutral-500 mb-2">Add a bit:</p>
            <div className="flex flex-wrap gap-2">
              {availableBits.map((bv) => (
                <button
                  key={bv.bitId}
                  type="button"
                  onClick={() => addBit(bv)}
                  className="text-sm border border-dashed border-neutral-300 dark:border-neutral-700 rounded px-3 py-1 hover:border-foreground hover:text-foreground text-neutral-500"
                >
                  + {bv.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="text-sm text-neutral-500 hover:text-foreground"
        >
          {showHistory ? "Hide" : "Show"} version history ({allVersions.length})
        </button>
        {showHistory && (
          <ul className="mt-3 space-y-3">
            {allVersions.map((v) => (
              <li
                key={v.id}
                className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">
                    v{v.version}: {v.title}
                  </span>
                  <span className="text-neutral-400 text-xs">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-neutral-500 text-xs">
                  {v.bits.map((b) => b.bitVersion.title).join(", ") || "No bits"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

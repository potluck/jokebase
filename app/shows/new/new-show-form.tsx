"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Rating from "@/app/components/rating";
import { createShow } from "@/app/lib/actions";
import type { CreateShowInput, ShowHunkInput, ShowBitInput, ShowLineInput } from "@/app/lib/actions";
import type { getLatestHunkVersions } from "@/app/lib/data";
type ShowType = "SHOW" | "OPEN_MIC";

type HunkVersions = Awaited<ReturnType<typeof getLatestHunkVersions>>;
type HunkVersion = HunkVersions[number];
type BitVersion = HunkVersion["bits"][number]["bitVersion"];

interface Props {
  hunks: HunkVersions;
}

// Per-bit state: which lines are selected + their ratings
interface BitState {
  selected: boolean;
  rating: number | null;
  lines: { lineVersionId: string; text: string; selected: boolean; rating: number | null }[];
}

// Per-hunk state
interface HunkState {
  selected: boolean;
  rating: number | null;
  bits: Record<string, BitState>; // keyed by bitVersionId
}

function initBitState(bv: BitVersion): BitState {
  return {
    selected: true,
    rating: null,
    lines: bv.lines.map((bvl) => ({
      lineVersionId: bvl.lineVersionId,
      text: bvl.lineVersion.text,
      selected: true,
      rating: null,
    })),
  };
}

function initHunkState(hv: HunkVersion): HunkState {
  const bits: Record<string, BitState> = {};
  for (const hvb of hv.bits) {
    bits[hvb.bitVersionId] = initBitState(hvb.bitVersion);
  }
  return { selected: false, rating: null, bits };
}

export default function NewShowForm({ hunks }: Props) {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const [date, setDate] = useState(today);
  const [venue, setVenue] = useState("");
  const [type, setType] = useState<ShowType>("OPEN_MIC");
  const [notes, setNotes] = useState("");
  const [hunkState, setHunkState] = useState<Record<string, HunkState>>(
    () => Object.fromEntries(hunks.map((hv) => [hv.id, initHunkState(hv)]))
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // ── helpers ───────────────────────────────────────────────────────────────

  function toggleHunk(hvId: string) {
    setHunkState((prev) => ({
      ...prev,
      [hvId]: { ...prev[hvId], selected: !prev[hvId].selected },
    }));
  }

  function setHunkRating(hvId: string, rating: number | null) {
    setHunkState((prev) => ({ ...prev, [hvId]: { ...prev[hvId], rating } }));
  }

  function toggleBit(hvId: string, bvId: string) {
    setHunkState((prev) => ({
      ...prev,
      [hvId]: {
        ...prev[hvId],
        bits: {
          ...prev[hvId].bits,
          [bvId]: { ...prev[hvId].bits[bvId], selected: !prev[hvId].bits[bvId].selected },
        },
      },
    }));
  }

  function setBitRating(hvId: string, bvId: string, rating: number | null) {
    setHunkState((prev) => ({
      ...prev,
      [hvId]: {
        ...prev[hvId],
        bits: { ...prev[hvId].bits, [bvId]: { ...prev[hvId].bits[bvId], rating } },
      },
    }));
  }

  function toggleLine(hvId: string, bvId: string, li: number) {
    setHunkState((prev) => {
      const bit = prev[hvId].bits[bvId];
      const lines = bit.lines.map((l, i) =>
        i === li ? { ...l, selected: !l.selected } : l
      );
      return {
        ...prev,
        [hvId]: { ...prev[hvId], bits: { ...prev[hvId].bits, [bvId]: { ...bit, lines } } },
      };
    });
  }

  function setLineRating(hvId: string, bvId: string, li: number, rating: number | null) {
    setHunkState((prev) => {
      const bit = prev[hvId].bits[bvId];
      const lines = bit.lines.map((l, i) => (i === li ? { ...l, rating } : l));
      return {
        ...prev,
        [hvId]: { ...prev[hvId], bits: { ...prev[hvId].bits, [bvId]: { ...bit, lines } } },
      };
    });
  }

  // ── submit ────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const selectedHunks: ShowHunkInput[] = [];
    for (const hv of hunks) {
      const hs = hunkState[hv.id];
      if (!hs.selected) continue;

      const selectedBits: ShowBitInput[] = [];
      for (const hvb of hv.bits) {
        const bs = hs.bits[hvb.bitVersionId];
        if (!bs.selected) continue;

        const selectedLines: ShowLineInput[] = bs.lines
          .filter((l) => l.selected)
          .map((l) => ({ lineVersionId: l.lineVersionId, rating: l.rating }));

        selectedBits.push({
          bitVersionId: hvb.bitVersionId,
          rating: bs.rating,
          lines: selectedLines,
        });
      }

      selectedHunks.push({
        hunkVersionId: hv.id,
        rating: hs.rating,
        bits: selectedBits,
      });
    }

    const input: CreateShowInput = { date, venue, type, notes, hunks: selectedHunks };
    startTransition(async () => {
      await createShow(input);
    });
  }

  const selectedCount = hunks.filter((hv) => hunkState[hv.id].selected).length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Log a show</h1>
      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Show details ── */}
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ShowType)}
                className="w-full border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-foreground"
              >
                <option value="OPEN_MIC">Open mic</option>
                <option value="SHOW">Show</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Venue <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. The Comedy Store"
              className="w-full border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Notes <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground resize-none"
            />
          </div>
        </section>

        {/* ── Hunk / Bit / Line selection ── */}
        <section>
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-3">
            Set list
          </h2>
          {hunks.length === 0 ? (
            <p className="text-neutral-500 text-sm">No hunks yet — create some first.</p>
          ) : (
            <div className="space-y-4">
              {hunks.map((hv) => {
                const hs = hunkState[hv.id];
                return (
                  <div
                    key={hv.id}
                    className={`rounded-lg border transition-colors ${
                      hs.selected
                        ? "border-foreground"
                        : "border-neutral-200 dark:border-neutral-800"
                    }`}
                  >
                    {/* Hunk header */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                      onClick={() => toggleHunk(hv.id)}
                    >
                      <input
                        type="checkbox"
                        checked={hs.selected}
                        onChange={() => toggleHunk(hv.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                      />
                      <span className="font-semibold flex-1">{hv.title}</span>
                      {hs.selected && (
                        <span onClick={(e) => e.stopPropagation()}>
                          <Rating
                            value={hs.rating}
                            onChange={(r) => setHunkRating(hv.id, r)}
                            size="sm"
                          />
                        </span>
                      )}
                    </div>

                    {/* Bits */}
                    {hs.selected && hv.bits.length > 0 && (
                      <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 py-3 space-y-4">
                        {hv.bits.map((hvb) => {
                          const bs = hs.bits[hvb.bitVersionId];
                          return (
                            <div key={hvb.bitVersionId}>
                              {/* Bit header */}
                              <div className="flex items-center gap-3 mb-2">
                                <input
                                  type="checkbox"
                                  checked={bs.selected}
                                  onChange={() => toggleBit(hv.id, hvb.bitVersionId)}
                                  className="rounded"
                                />
                                <span className="font-medium text-sm flex-1">
                                  {hvb.bitVersion.title}
                                </span>
                                {bs.selected && (
                                  <Rating
                                    value={bs.rating}
                                    onChange={(r) => setBitRating(hv.id, hvb.bitVersionId, r)}
                                    size="sm"
                                  />
                                )}
                              </div>

                              {/* Lines */}
                              {bs.selected && bs.lines.length > 0 && (
                                <div className="ml-6 space-y-1.5">
                                  {bs.lines.map((line, li) => (
                                    <div key={line.lineVersionId} className="flex items-start gap-2">
                                      <input
                                        type="checkbox"
                                        checked={line.selected}
                                        onChange={() =>
                                          toggleLine(hv.id, hvb.bitVersionId, li)
                                        }
                                        className="rounded mt-0.5"
                                      />
                                      <span
                                        className={`text-sm flex-1 leading-snug ${
                                          line.selected
                                            ? ""
                                            : "line-through text-neutral-400"
                                        }`}
                                      >
                                        {line.text}
                                      </span>
                                      {line.selected && (
                                        <Rating
                                          value={line.rating}
                                          onChange={(r) =>
                                            setLineRating(hv.id, hvb.bitVersionId, li, r)
                                          }
                                          size="sm"
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending || selectedCount === 0}
            className="bg-foreground text-background px-4 py-2 rounded text-sm font-medium hover:opacity-80 disabled:opacity-40"
          >
            {pending ? "Saving…" : `Save show (${selectedCount} hunk${selectedCount !== 1 ? "s" : ""})`}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-neutral-500 hover:text-foreground px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

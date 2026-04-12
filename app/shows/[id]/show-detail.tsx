"use client";

import { useState, useTransition } from "react";
import Rating from "@/app/components/rating";
import {
  updateShowHunkRating,
  updateShowBitRating,
  updateShowLineRating,
  updateShowMeta,
} from "@/app/lib/actions";
import type { getShow } from "@/app/lib/data";

type Show = NonNullable<Awaited<ReturnType<typeof getShow>>>;
type ShowType = "SHOW" | "OPEN_MIC";

// Dates are stored as UTC midnight — always read/write the UTC date components
// to avoid timezone rollovers when displaying or editing.
function utcDateStr(date: Date | string) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function showLabel(type: string) {
  return type === "SHOW" ? "Show" : "Open mic";
}

interface Props {
  show: Show;
}

export default function ShowDetail({ show }: Props) {
  // ── Rating state: keyed by entity id ──────────────────────────────────────
  const [hunkRatings, setHunkRatings] = useState<Record<string, number | null>>(
    () => Object.fromEntries(show.hunks.map((sh) => [sh.id, sh.rating]))
  );
  const [bitRatings, setBitRatings] = useState<Record<string, number | null>>(
    () =>
      Object.fromEntries(
        show.hunks.flatMap((sh) => sh.bits.map((sb) => [sb.id, sb.rating]))
      )
  );
  const [lineRatings, setLineRatings] = useState<Record<string, number | null>>(
    () =>
      Object.fromEntries(
        show.hunks.flatMap((sh) =>
          sh.bits.flatMap((sb) => sb.lines.map((sl) => [sl.id, sl.rating]))
        )
      )
  );

  // ── Meta edit state ────────────────────────────────────────────────────────
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaDate, setMetaDate] = useState(() => utcDateStr(show.date));
  const [metaVenue, setMetaVenue] = useState(show.venue ?? "");
  const [metaType, setMetaType] = useState<ShowType>(show.type as ShowType);
  const [metaNotes, setMetaNotes] = useState(show.notes ?? "");
  const [displayDate, setDisplayDate] = useState(show.date);
  const [displayVenue, setDisplayVenue] = useState(show.venue ?? "");
  const [displayType, setDisplayType] = useState(show.type);
  const [displayNotes, setDisplayNotes] = useState(show.notes ?? "");
  const [metaPending, startMetaTransition] = useTransition();

  // ── Rating handlers (fire-and-forget, optimistic local update) ────────────
  function rateHunk(shId: string, rating: number | null) {
    setHunkRatings((prev) => ({ ...prev, [shId]: rating }));
    updateShowHunkRating(shId, rating).catch(() =>
      setHunkRatings((prev) => ({ ...prev, [shId]: show.hunks.find((h) => h.id === shId)?.rating ?? null }))
    );
  }

  function rateBit(sbId: string, rating: number | null) {
    setBitRatings((prev) => ({ ...prev, [sbId]: rating }));
    updateShowBitRating(sbId, rating).catch(() => {
      const orig = show.hunks.flatMap((h) => h.bits).find((b) => b.id === sbId)?.rating ?? null;
      setBitRatings((prev) => ({ ...prev, [sbId]: orig }));
    });
  }

  function rateLine(slId: string, rating: number | null) {
    setLineRatings((prev) => ({ ...prev, [slId]: rating }));
    updateShowLineRating(slId, rating).catch(() => {
      const orig = show.hunks.flatMap((h) => h.bits.flatMap((b) => b.lines)).find((l) => l.id === slId)?.rating ?? null;
      setLineRatings((prev) => ({ ...prev, [slId]: orig }));
    });
  }

  // ── Meta save ──────────────────────────────────────────────────────────────
  function saveMeta() {
    startMetaTransition(async () => {
      await updateShowMeta(show.id, {
        date: metaDate,
        venue: metaVenue,
        type: metaType,
        notes: metaNotes,
      });
      setDisplayDate(new Date(metaDate));
      setDisplayVenue(metaVenue);
      setDisplayType(metaType);
      setDisplayNotes(metaNotes);
      setEditingMeta(false);
    });
  }

  function cancelMeta() {
    setMetaDate(utcDateStr(displayDate));
    setMetaVenue(displayVenue);
    setMetaType(displayType as ShowType);
    setMetaNotes(displayNotes);
    setEditingMeta(false);
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6">
        {editingMeta ? (
          <div className="space-y-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-neutral-500">Date</label>
                <input
                  type="date"
                  value={metaDate}
                  onChange={(e) => setMetaDate(e.target.value)}
                  className="w-full border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1.5 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-neutral-500">Type</label>
                <select
                  value={metaType}
                  onChange={(e) => setMetaType(e.target.value as ShowType)}
                  className="w-full border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
                >
                  <option value="OPEN_MIC">Open mic</option>
                  <option value="SHOW">Show</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-neutral-500">Venue</label>
              <input
                type="text"
                value={metaVenue}
                onChange={(e) => setMetaVenue(e.target.value)}
                placeholder="e.g. The Comedy Store"
                className="w-full border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1.5 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-neutral-500">Notes</label>
              <textarea
                value={metaNotes}
                onChange={(e) => setMetaNotes(e.target.value)}
                rows={2}
                className="w-full border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1.5 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-foreground resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveMeta}
                disabled={metaPending}
                className="bg-foreground text-background px-3 py-1.5 rounded text-sm font-medium hover:opacity-80 disabled:opacity-40"
              >
                {metaPending ? "Saving…" : "Save"}
              </button>
              <button
                onClick={cancelMeta}
                className="text-sm text-neutral-500 hover:text-foreground px-3 py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {new Date(displayDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </h1>
              <p className="text-neutral-500 mt-1">
                {showLabel(displayType)}
                {displayVenue && ` · ${displayVenue}`}
              </p>
              {displayNotes && (
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 italic">
                  {displayNotes}
                </p>
              )}
            </div>
            <button
              onClick={() => setEditingMeta(true)}
              className="text-sm text-neutral-400 hover:text-foreground shrink-0 ml-4"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* ── Set list with ratings ── */}
      <div className="space-y-6">
        {show.hunks.map((sh) => (
          <div key={sh.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800">
            {/* Hunk row */}
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <span className="font-semibold">{sh.hunkVersion.title}</span>
            </div>

            {/* Bits */}
            <div className="px-4 py-3 space-y-4">
              {sh.bits.map((sb) => (
                <div key={sb.id}>
                  <div className="mb-2">
                    <span className="font-medium text-sm">{sb.bitVersion.title}</span>
                  </div>

                  {/* Lines */}
                  <div className="ml-4 space-y-1.5">
                    {sb.lines.map((sl) => (
                      <div key={sl.id} className={`flex items-start gap-3 text-sm rounded px-2 py-0.5 -mx-2 ${sl.lineVersion.line.type === "SETUP" ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                        <span className="flex-1 text-neutral-700 dark:text-neutral-300 leading-snug">
                          {sl.lineVersion.line.type === "SETUP" && (
                            <span className="inline-block text-[10px] font-medium uppercase tracking-wide bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded px-1.5 py-0.5 mr-2 align-middle">
                              setup
                            </span>
                          )}
                          {sl.lineVersion.text}
                        </span>
                        <Rating
                          value={lineRatings[sl.id]}
                          onChange={(r) => rateLine(sl.id, r)}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

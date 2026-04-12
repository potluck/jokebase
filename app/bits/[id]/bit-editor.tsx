"use client";

import { useState, useTransition } from "react";
import { updateBit } from "@/app/lib/actions";
type LineType = "SETUP" | "PUNCHLINE" | "BOTH";
import type { getLatestBitVersion, getAllBitVersions } from "@/app/lib/data";

type LatestBitVersion = NonNullable<Awaited<ReturnType<typeof getLatestBitVersion>>>;
type AllVersions = Awaited<ReturnType<typeof getAllBitVersions>>;

interface Props {
  bitId: string;
  latestVersion: LatestBitVersion;
  allVersions: AllVersions;
}

interface LineSlot {
  lineId?: string;
  lineVersionId?: string;
  text: string;
  type: LineType;
}

const LINE_TYPE_LABELS: Record<LineType, string> = {
  SETUP: "setup",
  PUNCHLINE: "punchline",
  BOTH: "both",
};

const LINE_TYPE_OPTIONS: LineType[] = ["SETUP", "PUNCHLINE", "BOTH"];

export default function BitEditor({ bitId, latestVersion, allVersions }: Props) {
  const [title, setTitle] = useState(latestVersion.title);
  const [lines, setLines] = useState<LineSlot[]>(
    latestVersion.lines.map((bvl) => ({
      lineId: bvl.lineId,
      lineVersionId: bvl.lineVersionId,
      text: bvl.lineVersion.text,
      type: bvl.line.type,
    }))
  );
  const [showHistory, setShowHistory] = useState(false);
  const [pending, startTransition] = useTransition();

  function updateLine(i: number, patch: Partial<LineSlot>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { text: "", type: "BOTH" as LineType }]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function moveUp(i: number) {
    if (i === 0) return;
    setLines((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  }

  function moveDown(i: number) {
    setLines((prev) => {
      if (i === prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      await updateBit(bitId, title, lines);
    });
  }

  const hasChanges =
    title !== latestVersion.title ||
    lines.length !== latestVersion.lines.length ||
    lines.some((l, i) => {
      const orig = latestVersion.lines[i];
      return (
        !orig ||
        l.text !== orig.lineVersion.text ||
        l.type !== orig.line.type ||
        l.lineId !== orig.lineId
      );
    });

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

      <section className="mb-8 space-y-3">
        {lines.map((line, i) => (
          <div
            key={i}
            className="flex gap-2 items-start p-3 rounded-lg border border-neutral-200 dark:border-neutral-800"
          >
            <span className="flex flex-col gap-0.5 pt-1">
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
                disabled={i === lines.length - 1}
                className="text-xs text-neutral-400 hover:text-foreground disabled:opacity-20 leading-none"
              >
                ▼
              </button>
            </span>

            <div className="flex-1 space-y-1.5">
              <textarea
                value={line.text}
                onChange={(e) => updateLine(i, { text: e.target.value })}
                rows={Math.max(1, line.text.split("\n").length)}
                className="w-full bg-transparent border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-foreground resize-none"
              />
              <div className="flex gap-1">
                {LINE_TYPE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateLine(i, { type: t })}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      line.type === t
                        ? "border-foreground bg-foreground text-background"
                        : "border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:border-foreground"
                    }`}
                  >
                    {LINE_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeLine(i)}
              className="text-neutral-400 hover:text-red-500 text-sm px-1 pt-1"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addLine}
          className="w-full text-sm border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg py-2 text-neutral-500 hover:text-foreground hover:border-foreground transition-colors"
        >
          + Add line
        </button>
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
          <ul className="mt-3 space-y-4">
            {allVersions.map((v) => (
              <li
                key={v.id}
                className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">v{v.version}: {v.title}</span>
                  <span className="text-neutral-400 text-xs">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <ol className="space-y-1 list-decimal list-inside">
                  {v.lines.map((bvl) => (
                    <li key={bvl.id} className="text-neutral-600 dark:text-neutral-400 text-xs">
                      <span className="text-neutral-400 mr-1">
                        [{LINE_TYPE_LABELS[bvl.line.type]}]
                      </span>
                      {bvl.lineVersion.text}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

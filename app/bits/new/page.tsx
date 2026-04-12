"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBit } from "@/app/lib/actions";

export default function NewBitPage() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const preview = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    startTransition(async () => {
      await createBit(title.trim(), text);
    });
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">New bit</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Tinder openers"
            className="w-full border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="text">
            Lines{" "}
            <span className="font-normal text-neutral-500">
              (one line per line — newline = new comedy line)
            </span>
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={"So I was on Tinder the other night…\nAnd I matched with a woman who said she loves long walks on the beach.\nI said great, me too.\nShe said she meant alone."}
            className="w-full border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground font-mono text-sm resize-y"
          />
        </div>

        {preview.length > 0 && (
          <div>
            <p className="text-sm text-neutral-500 mb-2">
              Preview — {preview.length} line{preview.length !== 1 ? "s" : ""}:
            </p>
            <ol className="space-y-1 list-decimal list-inside">
              {preview.map((line, i) => (
                <li key={i} className="text-sm text-neutral-600 dark:text-neutral-400">
                  {line}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending || !title.trim() || !text.trim()}
            className="bg-foreground text-background px-4 py-2 rounded text-sm font-medium hover:opacity-80 disabled:opacity-40"
          >
            {pending ? "Creating…" : "Create bit"}
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

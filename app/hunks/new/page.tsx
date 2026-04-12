"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createHunk } from "@/app/lib/actions";

export default function NewHunkPage() {
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      await createHunk(title.trim());
    });
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">New hunk</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Dating"
            className="w-full border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground"
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending || !title.trim()}
            className="bg-foreground text-background px-4 py-2 rounded text-sm font-medium hover:opacity-80 disabled:opacity-40"
          >
            {pending ? "Creating…" : "Create hunk"}
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

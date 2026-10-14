"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireOwner } from "./session";
import { LineType } from "@/app/generated/prisma/client";
type SetType = "SHOW" | "OPEN_MIC";

// ─── Hunks ────────────────────────────────────────────────────────────────────

export async function createHunk(title: string) {
  await requireOwner();
  const hunk = await db.hunk.create({ data: {} });
  await db.hunkVersion.create({
    data: { hunkId: hunk.id, version: 1, title },
  });
  revalidatePath("/");
  revalidatePath("/hunks");
  revalidatePath("/sets/new");
  redirect("/hunks");
}

export async function updateHunk(
  hunkId: string,
  title: string,
  // Each entry: the stable bitId + the current bitVersionId to snapshot
  bits: { bitId: string; bitVersionId: string }[]
) {
  await requireOwner();
  const latest = await db.hunkVersion.findFirst({
    where: { hunkId },
    orderBy: { version: "desc" },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  await db.hunkVersion.create({
    data: {
      hunkId,
      version: nextVersion,
      title,
      bits: {
        create: bits.map(({ bitId, bitVersionId }, i) => ({
          bitId,
          bitVersionId,
          order: i,
        })),
      },
    },
  });
  revalidatePath("/hunks");
  revalidatePath(`/hunks/${hunkId}`);
  revalidatePath("/sets/new");
  redirect(`/hunks/${hunkId}`);
}

// ─── Bits ─────────────────────────────────────────────────────────────────────

export async function createBit(title: string, rawText: string) {
  await requireOwner();
  const lineTexts = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const bit = await db.bit.create({ data: {} });

  // Create all lines and their first versions
  const lineData = await Promise.all(
    lineTexts.map(async (text) => {
      const line = await db.line.create({ data: { type: LineType.BOTH } });
      const lineVersion = await db.lineVersion.create({
        data: { lineId: line.id, version: 1, text },
      });
      return { lineId: line.id, lineVersionId: lineVersion.id };
    })
  );

  await db.bitVersion.create({
    data: {
      bitId: bit.id,
      version: 1,
      title,
      lines: {
        create: lineData.map(({ lineId, lineVersionId }, i) => ({
          lineId,
          lineVersionId,
          order: i,
        })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/bits");
  revalidatePath("/hunks/[id]", "page");
  redirect(`/bits/${bit.id}`);
}

export async function updateBit(
  bitId: string,
  title: string,
  lines: {
    lineId?: string; // undefined = new line
    lineVersionId?: string; // current version id (to check if changed)
    text: string;
    type: LineType;
  }[]
) {
  await requireOwner();
  const latest = await db.bitVersion.findFirst({
    where: { bitId },
    orderBy: { version: "desc" },
  });
  const nextBitVersion = (latest?.version ?? 0) + 1;

  const lineData = await Promise.all(
    lines.map(async ({ lineId, lineVersionId, text, type }) => {
      if (lineId && lineVersionId) {
        // Existing line
        const currentVersion = await db.lineVersion.findUnique({
          where: { id: lineVersionId },
        });

        // Update type unconditionally (not versioned)
        await db.line.update({ where: { id: lineId }, data: { type } });

        if (currentVersion && currentVersion.text !== text) {
          // Text changed — create a new LineVersion
          const newLineVersion = await db.lineVersion.create({
            data: {
              lineId,
              version: currentVersion.version + 1,
              text,
            },
          });
          return { lineId, lineVersionId: newLineVersion.id };
        }
        return { lineId, lineVersionId };
      } else {
        // New line
        const line = await db.line.create({ data: { type } });
        const lineVersion = await db.lineVersion.create({
          data: { lineId: line.id, version: 1, text },
        });
        return { lineId: line.id, lineVersionId: lineVersion.id };
      }
    })
  );

  await db.bitVersion.create({
    data: {
      bitId,
      version: nextBitVersion,
      title,
      lines: {
        create: lineData.map(({ lineId, lineVersionId }, i) => ({
          lineId,
          lineVersionId,
          order: i,
        })),
      },
    },
  });

  revalidatePath("/bits");
  revalidatePath(`/bits/${bitId}`);
  revalidatePath("/hunks/[id]", "page");
  redirect(`/bits/${bitId}`);
}

export async function updateLineType(lineId: string, type: LineType) {
  await requireOwner();
  await db.line.update({ where: { id: lineId }, data: { type } });
}

// ─── Sets ────────────────────────────────────────────────────────────────────

export interface SetLineInput {
  lineVersionId: string;
  rating: number | null;
}

export interface SetBitInput {
  bitVersionId: string;
  rating: number | null;
  lines: SetLineInput[];
}

export interface SetHunkInput {
  hunkVersionId: string;
  rating: number | null;
  bits: SetBitInput[];
}

export interface CreateSetInput {
  date: string; // ISO date string
  venue: string;
  type: SetType;
  notes: string;
  hunks: SetHunkInput[];
}

export async function createSet(input: CreateSetInput) {
  await requireOwner();
  const set = await db.show.create({
    data: {
      date: new Date(input.date),
      venue: input.venue || null,
      type: input.type,
      notes: input.notes || null,
    },
  });

  for (let hi = 0; hi < input.hunks.length; hi++) {
    const h = input.hunks[hi];
    const showHunk = await db.showHunk.create({
      data: {
        showId: set.id,
        hunkVersionId: h.hunkVersionId,
        order: hi,
        rating: h.rating,
      },
    });

    for (let bi = 0; bi < h.bits.length; bi++) {
      const b = h.bits[bi];
      const showBit = await db.showBit.create({
        data: {
          showHunkId: showHunk.id,
          bitVersionId: b.bitVersionId,
          order: bi,
          rating: b.rating,
        },
      });

      for (let li = 0; li < b.lines.length; li++) {
        const l = b.lines[li];
        await db.showLine.create({
          data: {
            showBitId: showBit.id,
            lineVersionId: l.lineVersionId,
            order: li,
            rating: l.rating,
          },
        });
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/sets");
  redirect(`/sets/${set.id}`);
}

export async function reorderSetHunks(setId: string, orderedSetHunkIds: string[]) {
  await requireOwner();
  await Promise.all(
    orderedSetHunkIds.map((id, i) =>
      db.showHunk.update({ where: { id }, data: { order: i } })
    )
  );
  revalidatePath(`/sets/${setId}`);
}

export async function updateSetHunkRating(showHunkId: string, rating: number | null) {
  await requireOwner();
  await db.showHunk.update({ where: { id: showHunkId }, data: { rating } });
}

export async function updateSetBitRating(showBitId: string, rating: number | null) {
  await requireOwner();
  await db.showBit.update({ where: { id: showBitId }, data: { rating } });
}

export async function updateSetLineRating(showLineId: string, rating: number | null) {
  await requireOwner();
  await db.showLine.update({ where: { id: showLineId }, data: { rating } });
}

export async function updateSetMeta(
  setId: string,
  data: { date: string; venue: string; type: SetType; notes: string }
) {
  await requireOwner();
  await db.show.update({
    where: { id: setId },
    data: {
      date: new Date(data.date),
      venue: data.venue || null,
      type: data.type,
      notes: data.notes || null,
    },
  });
  revalidatePath("/");
  revalidatePath("/sets");
  revalidatePath(`/sets/${setId}`);
}

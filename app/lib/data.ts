import { db } from "./db";
import { averageScores, calculateBitScore } from "./bit-score";

// Returns the latest HunkVersion for every hunk, including its ordered bits
export async function getLatestHunkVersions() {
  const versions = await db.hunkVersion.findMany({
    orderBy: [{ hunkId: "asc" }, { version: "desc" }],
    include: {
      bits: {
        orderBy: { order: "asc" },
        include: {
          bit: true,
          bitVersion: {
            include: {
              lines: {
                orderBy: { order: "asc" },
                include: {
                  line: true,
                  lineVersion: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const seen = new Set<string>();
  return versions.filter((v) => {
    if (seen.has(v.hunkId)) return false;
    seen.add(v.hunkId);
    return true;
  });
}

export async function getLatestHunkVersionsForSetForm() {
  const [hunkVersions, latestBits, performances] = await Promise.all([
    getLatestHunkVersions(),
    getLatestBitVersions(),
    db.showHunk.findMany({
      select: {
        order: true,
        showId: true,
        hunkVersion: { select: { hunkId: true } },
        show: { select: { date: true, createdAt: true } },
      },
    }),
  ]);

  // A hunk version snapshots the bit versions it was saved with. When logging a
  // set, show and record each bit's current version instead.
  const latestBitById = new Map(latestBits.map((bv) => [bv.bitId, bv]));
  const hunks = hunkVersions.map((hv) => ({
    ...hv,
    bits: hv.bits.map((hvb) => {
      const latest = latestBitById.get(hvb.bitId);
      return latest
        ? { ...hvb, bitVersionId: latest.id, bitVersion: latest }
        : hvb;
    }),
  }));

  const latestPerformanceByHunk = new Map<string, (typeof performances)[number]>();
  for (const performance of performances) {
    const hunkId = performance.hunkVersion.hunkId;
    const current = latestPerformanceByHunk.get(hunkId);
    if (!current || compareHunkPerformances(performance, current) < 0) {
      latestPerformanceByHunk.set(hunkId, performance);
    }
  }

  return hunks.sort((a, b) => {
    const aPerformance = latestPerformanceByHunk.get(a.hunkId);
    const bPerformance = latestPerformanceByHunk.get(b.hunkId);

    if (aPerformance && bPerformance) {
      return compareHunkPerformances(aPerformance, bPerformance);
    }
    if (aPerformance) return -1;
    if (bPerformance) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

function compareHunkPerformances(
  a: { order: number; showId: string; show: { date: Date; createdAt: Date } },
  b: { order: number; showId: string; show: { date: Date; createdAt: Date } }
) {
  const dateDifference = b.show.date.getTime() - a.show.date.getTime();
  if (dateDifference !== 0) return dateDifference;

  const showDifference = b.show.createdAt.getTime() - a.show.createdAt.getTime();
  if (showDifference !== 0) return showDifference;

  return a.order - b.order;
}

// Returns the latest BitVersion for every bit, including its ordered lines
export async function getLatestBitVersions() {
  const versions = await db.bitVersion.findMany({
    orderBy: [{ bitId: "asc" }, { version: "desc" }],
    include: {
      lines: {
        orderBy: { order: "asc" },
        include: {
          line: true,
          lineVersion: true,
        },
      },
    },
  });

  const seen = new Set<string>();
  return versions.filter((v) => {
    if (seen.has(v.bitId)) return false;
    seen.add(v.bitId);
    return true;
  });
}

export async function getLatestBitVersionsWithSetCounts() {
  const [bits, performances] = await Promise.all([
    getLatestBitVersions(),
    db.showBit.findMany({
      select: {
        order: true,
        bitVersion: { select: { bitId: true } },
        lines: {
          select: {
            rating: true,
            lineVersion: { select: { line: { select: { type: true } } } },
          },
        },
        showHunk: {
          select: {
            showId: true,
            order: true,
            show: { select: { date: true, createdAt: true } },
          },
        },
      },
    }),
  ]);

  const setIdsByBit = new Map<string, Set<string>>();
  const scoresByBitAndSet = new Map<string, Map<string, number[]>>();
  const latestPerformanceByBit = new Map<string, (typeof performances)[number]>();

  for (const performance of performances) {
    const bitId = performance.bitVersion.bitId;
    const setIds = setIdsByBit.get(bitId) ?? new Set<string>();
    setIds.add(performance.showHunk.showId);
    setIdsByBit.set(bitId, setIds);

    const score = calculateBitScore(performance.lines);
    if (score !== null) {
      const scoresBySet = scoresByBitAndSet.get(bitId) ?? new Map<string, number[]>();
      const setScores = scoresBySet.get(performance.showHunk.showId) ?? [];
      setScores.push(score);
      scoresBySet.set(performance.showHunk.showId, setScores);
      scoresByBitAndSet.set(bitId, scoresBySet);
    }

    const current = latestPerformanceByBit.get(bitId);
    if (!current || comparePerformances(performance, current) < 0) {
      latestPerformanceByBit.set(bitId, performance);
    }
  }

  return bits
    .map((bit) => {
      const scoresBySet = scoresByBitAndSet.get(bit.bitId);
      const setScores = scoresBySet
        ? [...scoresBySet.values()].map((scores) => averageScores(scores) as number)
        : [];

      return {
        ...bit,
        setCount: setIdsByBit.get(bit.bitId)?.size ?? 0,
        averageScore: averageScores(setScores),
      };
    })
    .sort((a, b) => {
      const aPerformance = latestPerformanceByBit.get(a.bitId);
      const bPerformance = latestPerformanceByBit.get(b.bitId);

      if (aPerformance && bPerformance) {
        return comparePerformances(aPerformance, bPerformance);
      }
      if (aPerformance) return -1;
      if (bPerformance) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
}

function comparePerformances(
  a: {
    order: number;
    showHunk: { showId: string; order: number; show: { date: Date; createdAt: Date } };
  },
  b: {
    order: number;
    showHunk: { showId: string; order: number; show: { date: Date; createdAt: Date } };
  }
) {
  const dateDifference = b.showHunk.show.date.getTime() - a.showHunk.show.date.getTime();
  if (dateDifference !== 0) return dateDifference;

  const showDifference =
    b.showHunk.show.createdAt.getTime() - a.showHunk.show.createdAt.getTime();
  if (showDifference !== 0) return showDifference;

  const hunkDifference = a.showHunk.order - b.showHunk.order;
  if (hunkDifference !== 0) return hunkDifference;

  return a.order - b.order;
}

export async function getLatestBitVersion(bitId: string) {
  return db.bitVersion.findFirst({
    where: { bitId },
    orderBy: { version: "desc" },
    include: {
      lines: {
        orderBy: { order: "asc" },
        include: { line: true, lineVersion: true },
      },
    },
  });
}

export async function getLatestHunkVersion(hunkId: string) {
  return db.hunkVersion.findFirst({
    where: { hunkId },
    orderBy: { version: "desc" },
    include: {
      bits: {
        orderBy: { order: "asc" },
        include: {
          bit: true,
          bitVersion: {
            include: {
              lines: {
                orderBy: { order: "asc" },
                include: { line: true, lineVersion: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function getAllHunkVersions(hunkId: string) {
  return db.hunkVersion.findMany({
    where: { hunkId },
    orderBy: { version: "desc" },
    include: {
      bits: {
        orderBy: { order: "asc" },
        include: { bit: true, bitVersion: true },
      },
    },
  });
}

export async function getAllBitVersions(bitId: string) {
  return db.bitVersion.findMany({
    where: { bitId },
    orderBy: { version: "desc" },
    include: {
      lines: {
        orderBy: { order: "asc" },
        include: { line: true, lineVersion: true },
      },
    },
  });
}

// Returns every set performance of a stable bit, regardless of which version was used.
export async function getBitSetHistory(bitId: string) {
  return db.showBit.findMany({
    where: { bitVersion: { bitId } },
    orderBy: { showHunk: { show: { date: "desc" } } },
    include: {
      bitVersion: true,
      showHunk: {
        include: {
          show: true,
          hunkVersion: true,
        },
      },
      lines: {
        orderBy: { order: "asc" },
        include: {
          lineVersion: { include: { line: true } },
        },
      },
    },
  });
}

export async function getSet(setId: string) {
  return db.show.findUnique({
    where: { id: setId },
    include: {
      hunks: {
        orderBy: { order: "asc" },
        include: {
          hunkVersion: true,
          bits: {
            orderBy: { order: "asc" },
            include: {
              bitVersion: true,
              lines: {
                orderBy: { order: "asc" },
                include: { lineVersion: { include: { line: true } } },
              },
            },
          },
        },
      },
    },
  });
}

export async function getSets() {
  return db.show.findMany({
    orderBy: { date: "desc" },
    include: {
      hunks: {
        include: {
          bits: { include: { lines: true } },
        },
      },
    },
  });
}

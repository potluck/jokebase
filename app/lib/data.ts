import { db } from "./db";

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

export async function getShow(showId: string) {
  return db.show.findUnique({
    where: { id: showId },
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
                include: { lineVersion: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function getShows() {
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

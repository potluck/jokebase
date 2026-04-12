import { notFound } from "next/navigation";
import HunkEditor from "./hunk-editor";
import { getAllHunkVersions, getLatestBitVersions, getLatestHunkVersion } from "@/app/lib/data";

export default async function HunkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [latestVersion, allVersions, allBits] = await Promise.all([
    getLatestHunkVersion(id),
    getAllHunkVersions(id),
    getLatestBitVersions(),
  ]);

  if (!latestVersion) notFound();

  return (
    <HunkEditor
      hunkId={id}
      latestVersion={latestVersion}
      allVersions={allVersions}
      allBits={allBits}
    />
  );
}

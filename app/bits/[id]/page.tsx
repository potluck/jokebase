import { notFound } from "next/navigation";
import BitEditor from "./bit-editor";
import { getAllBitVersions, getLatestBitVersion } from "@/app/lib/data";

export default async function BitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [latestVersion, allVersions] = await Promise.all([
    getLatestBitVersion(id),
    getAllBitVersions(id),
  ]);

  if (!latestVersion) notFound();

  return (
    <BitEditor
      bitId={id}
      latestVersion={latestVersion}
      allVersions={allVersions}
    />
  );
}

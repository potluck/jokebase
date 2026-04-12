import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BitEditor from "./bit-editor";
import { getAllBitVersions, getLatestBitVersion } from "@/app/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const v = await getLatestBitVersion(id);
  return { title: v?.title ?? "Bit" };
}

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

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BitEditor from "./bit-editor";
import BitSetHistory from "./bit-set-history";
import {
  getAllBitVersions,
  getBitSetHistory,
  getLatestBitVersion,
} from "@/app/lib/data";
import { getSession, isOwner } from "@/app/lib/session";

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

  const [latestVersion, allVersions, setHistory, session] = await Promise.all([
    getLatestBitVersion(id),
    getAllBitVersions(id),
    getBitSetHistory(id),
    getSession(),
  ]);

  if (!latestVersion) notFound();

  return (
    <>
      <BitEditor
        bitId={id}
        latestVersion={latestVersion}
        allVersions={allVersions}
        canEdit={isOwner(session)}
      />
      <BitSetHistory history={setHistory} />
    </>
  );
}

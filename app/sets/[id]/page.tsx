import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSet } from "@/app/lib/data";
import SetDetail from "./set-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const set = await getSet(id);
  if (!set) return {};
  const date = new Date(set.date).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
  const title = set.venue ? `${date} @ ${set.venue}` : date;
  return { title };
}

export default async function SetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const set = await getSet(id);
  if (!set) notFound();
  return <SetDetail set={set} />;
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getShow } from "@/app/lib/data";
import ShowDetail from "./show-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const show = await getShow(id);
  if (!show) return {};
  const date = new Date(show.date).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
  const title = show.venue ? `${date} @ ${show.venue}` : date;
  return { title };
}

export default async function ShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const show = await getShow(id);
  if (!show) notFound();
  return <ShowDetail show={show} />;
}

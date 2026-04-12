import { notFound } from "next/navigation";
import { getShow } from "@/app/lib/data";
import ShowDetail from "./show-detail";

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

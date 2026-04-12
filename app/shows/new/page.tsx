import { getLatestHunkVersions } from "@/app/lib/data";
import NewShowForm from "./new-show-form";

export default async function NewShowPage() {
  const hunks = await getLatestHunkVersions();
  return <NewShowForm hunks={hunks} />;
}

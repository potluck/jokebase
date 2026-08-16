import { getLatestHunkVersionsForShowForm } from "@/app/lib/data";
import NewShowForm from "./new-show-form";

export default async function NewShowPage() {
  const hunks = await getLatestHunkVersionsForShowForm();
  return <NewShowForm hunks={hunks} />;
}

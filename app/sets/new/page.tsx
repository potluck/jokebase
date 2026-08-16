import { getLatestHunkVersionsForSetForm } from "@/app/lib/data";
import NewSetForm from "./new-set-form";

export default async function NewSetPage() {
  const hunks = await getLatestHunkVersionsForSetForm();
  return <NewSetForm hunks={hunks} />;
}

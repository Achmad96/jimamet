import { getServerFoodRecords } from "@/lib/server-api";
import { mapRawFoodRecords } from "@/lib/history-utils";
import { HistoryView } from "@/components/history/HistoryView";

export default async function HistoryPage() {
  const res = await getServerFoodRecords();
  const rawRecords = res.ok && Array.isArray(res.data) ? res.data : [];
  const initialRecords = mapRawFoodRecords(rawRecords);

  return <HistoryView initialRecords={initialRecords} />;
}

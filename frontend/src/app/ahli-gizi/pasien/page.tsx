import { getServerConsultations } from "@/lib/server-api";
import { ConsultationListView, ConsultationItem } from "@/components/nutritionist/ConsultationListView";

export default async function KonsultasiPage() {
  const res = await getServerConsultations();
  const initialConsultations: ConsultationItem[] = res.ok && Array.isArray(res.data) ? res.data : [];

  return <ConsultationListView initialConsultations={initialConsultations} />;
}

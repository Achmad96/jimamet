import { getServerPatientDetails, getServerChat } from "@/lib/server-api";
import {
  PatientDetailClient,
  PatientProfile,
  FoodRecord,
  ChatMsg,
} from "@/components/nutritionist/PatientDetailClient";

export default async function ConsultationChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: consultationId } = await params;

  const [detailsRes, chatRes] = await Promise.all([
    getServerPatientDetails(consultationId),
    getServerChat(consultationId),
  ]);

  const details = detailsRes.data;
  const initialProfile = (details?.profile as PatientProfile | null) || null;
  const initialFoodHistory = (details?.food_history as FoodRecord[]) || [];
  const initialStatus = details?.consultation?.status || "pending";
  const initialCatatan = details?.consultation?.nutritionist_notes || "";
  const initialChat = (chatRes.data as ChatMsg[]) || [];

  return (
    <PatientDetailClient
      consultationId={consultationId}
      initialProfile={initialProfile}
      initialFoodHistory={initialFoodHistory}
      initialStatus={initialStatus}
      initialCatatan={initialCatatan}
      initialChat={initialChat}
    />
  );
}

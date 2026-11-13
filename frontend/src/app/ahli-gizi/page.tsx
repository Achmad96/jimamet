import { getServerMe } from "@/lib/server-api";
import { formatDateHeader } from "@/lib/dashboard-utils";
import { NutritionistDashboardHeader } from "@/components/nutritionist/NutritionistDashboardHeader";
import { NutritionistSupervisionModules } from "@/components/nutritionist/NutritionistSupervisionModules";

export const metadata = {
  title: "Portal Ahli Gizi | Jimamet",
  description: "Supervisi klinis dietetika dan intervensi rujukan pasien."
};

export default async function AhliGiziDashboard() {
  const { data: user } = await getServerMe();
  const today = formatDateHeader();

  let firstName = "Ahli Gizi";
  if (user?.full_name) {
    const parts = user.full_name.split(" ");
    firstName = parts.length > 1 && parts[0].toLowerCase().includes("dr") ? `${parts[0]} ${parts[1]}` : parts[0];
  }

  return (
    <div>
      <NutritionistDashboardHeader firstName={firstName} today={today} />
      <NutritionistSupervisionModules />
    </div>
  );
}

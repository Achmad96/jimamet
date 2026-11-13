import { getServerProfile, getServerDashboardSummary } from "@/lib/server-api";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileData } from "@/lib/profile-utils";

export default async function ProfilePage() {
  const [profRes, sumRes] = await Promise.all([
    getServerProfile(),
    getServerDashboardSummary(),
  ]);

  const p = profRes.data;
  const initialProfile: ProfileData = {
    fullName: p?.full_name || "",
    email: p?.email || "",
    username: p?.username || "",
    age: p?.age?.toString() || "",
    weight: p?.weight?.toString() || "",
    height: p?.height?.toString() || "",
    gender: (p?.gender as "male" | "female") || "male",
    activityLevel: (p?.activity_level as ProfileData["activityLevel"]) || "moderate",
    goal: (p?.goal as ProfileData["goal"]) || "maintain",
  };

  const todayCalories = sumRes.data?.total_calories || 0;

  return <ProfileForm initialProfile={initialProfile} todayCalories={todayCalories} />;
}

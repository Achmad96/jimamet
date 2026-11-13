import { getServerMe, getServerDashboardSummary } from "@/lib/server-api";
import {
  getGreeting,
  formatDateHeader,
  calculateMacroProgress,
  DEFAULT_PROTEIN_TARGET,
  DEFAULT_CARB_TARGET,
  DEFAULT_FAT_TARGET,
  DEFAULT_FIBER_TARGET,
  DashboardMeal,
} from "@/lib/dashboard-utils";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTelemetryStrip } from "@/components/dashboard/DashboardTelemetryStrip";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardMealLog } from "@/components/dashboard/DashboardMealLog";
import { DashboardMacroTargets } from "@/components/dashboard/DashboardMacroTargets";

export const metadata = {
  title: "Dashboard Pasien | Jimamet",
  description: "Monitoring nutrisi harian, analisis kalori, dan evaluasi makronutrien.",
};

export default async function DashboardPage() {
  const [meRes, summaryRes] = await Promise.all([
    getServerMe(),
    getServerDashboardSummary(),
  ]);

  const user = meRes.data;
  const summary = summaryRes.data || {
    total_calories: 0,
    target_calories: 2000,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    meals: [],
    weekly_data: [],
  };

  const greeting = getGreeting();
  const dateFormatted = formatDateHeader();
  const progress = calculateMacroProgress(summary);
  const displayName = user?.full_name?.split(" ")[0] || user?.username || "Pasien";

  const macroProgressBars = [
    { name: "Protein", value: progress.protein, target: DEFAULT_PROTEIN_TARGET, unit: "g", color: "#c85a32" },
    { name: "Karbohidrat", value: progress.carbs, target: DEFAULT_CARB_TARGET, unit: "g", color: "#d9822b" },
    { name: "Lemak", value: progress.fat, target: DEFAULT_FAT_TARGET, unit: "g", color: "#2b6f77" },
    { name: "Serat", value: 0, target: DEFAULT_FIBER_TARGET, unit: "g", color: "#588157" },
  ];

  const meals = (summary.meals || []) as DashboardMeal[];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header (SSR Pre-rendered) ── */}
      <DashboardHeader
        greeting={greeting}
        displayName={displayName}
        dateFormatted={dateFormatted}
      />

      {/* ── 4-Column Clinical Telemetry Strip ── */}
      <DashboardTelemetryStrip
        progress={progress}
        targets={{
          protein: DEFAULT_PROTEIN_TARGET,
          carbs: DEFAULT_CARB_TARGET,
          fat: DEFAULT_FAT_TARGET,
        }}
      />

      {/* ── Charts Row (Interactive Client Component) ── */}
      <DashboardCharts
        weeklyData={summary.weekly_data || []}
        todayCalories={progress.calories}
        targetCalories={progress.calorieTarget}
        protein={progress.protein}
        carbs={progress.carbs}
        fat={progress.fat}
      />

      {/* ── Bottom Row (Log Konsumsi & Target Makronutrien) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DashboardMealLog meals={meals} />
        <DashboardMacroTargets macroProgressBars={macroProgressBars} />
      </div>
    </div>
  );
}

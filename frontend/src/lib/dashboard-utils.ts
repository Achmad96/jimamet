export interface DashboardMeal {
  id?: number | string;
  food_name?: string;
  nama_makanan?: string;
  recorded_at?: string;
  tanggal?: string;
  calories?: number;
  kalori?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export const DEFAULT_CALORIE_TARGET = 2000;
export const DEFAULT_PROTEIN_TARGET = 60;
export const DEFAULT_CARB_TARGET = 200;
export const DEFAULT_FAT_TARGET = 60;
export const DEFAULT_FIBER_TARGET = 25;

export interface MacroProgress {
  calories: number;
  calorieTarget: number;
  caloriePct: number;
  protein: number;
  proteinPct: number;
  carbs: number;
  carbPct: number;
  fat: number;
  fatPct: number;
}

export function getGreeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 11) return "Selamat Pagi";
  if (h >= 11 && h < 15) return "Selamat Siang";
  if (h >= 15 && h < 18) return "Selamat Sore";
  return "Selamat Malam";
}

export function formatTime(iso?: string): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export function formatDateHeader(now: Date = new Date()): string {
  return now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function calculateMacroProgress(summary: {
  total_calories?: number;
  target_calories?: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
}): MacroProgress {
  const calorieTarget = summary.target_calories || DEFAULT_CALORIE_TARGET;
  const calories = summary.total_calories || 0;
  const caloriePct = Math.min((calories / calorieTarget) * 100, 100);

  const protein = Number(summary.total_protein) || 0;
  const proteinPct = Math.min((protein / DEFAULT_PROTEIN_TARGET) * 100, 100);

  const carbs = Number(summary.total_carbs) || 0;
  const carbPct = Math.min((carbs / DEFAULT_CARB_TARGET) * 100, 100);

  const fat = Number(summary.total_fat) || 0;
  const fatPct = Math.min((fat / DEFAULT_FAT_TARGET) * 100, 100);

  return {
    calories,
    calorieTarget,
    caloriePct,
    protein,
    proteinPct,
    carbs,
    carbPct,
    fat,
    fatPct,
  };
}

export function buildWeeklyCalorieData(
  weeklyData: Array<{ date: string; calories: number }> = [],
  todayCalories: number = 0,
  targetCalories: number = DEFAULT_CALORIE_TARGET
) {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));

    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    const isoDate = localDate.toISOString().split("T")[0];

    const dayName = d.toLocaleDateString("id-ID", { weekday: "short" });
    const apiDay = weeklyData.find((w) => w.date === isoDate);
    const val = apiDay ? apiDay.calories : 0;

    if (i === 6) {
      return { day: "Hari Ini", value: todayCalories, target: targetCalories };
    }
    return { day: dayName, value: val, target: targetCalories };
  });
}

export function buildNutrientDonutSegments(
  prot: number,
  carbs: number,
  fat: number
) {
  const rawSum = prot + carbs + fat;
  const total = rawSum || 1;

  return {
    rawSum,
    segments: [
      { name: "Protein", pct: rawSum ? Math.round((prot / total) * 100) : 0, color: "#c85a32", value: prot },
      { name: "Karbohidrat", pct: rawSum ? Math.round((carbs / total) * 100) : 0, color: "#d9822b", value: carbs },
      { name: "Lemak", pct: rawSum ? Math.round((fat / total) * 100) : 0, color: "#2b6f77", value: fat },
    ],
  };
}

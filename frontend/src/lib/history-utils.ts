import { formatFoodLabel } from "@/lib/food-labels";

export interface MealRecord {
  id: string;
  date: string;
  time: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl: string | null;
}

export function formatDate(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return isoStr;
  }
}

export function formatTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "-";
  }
}

export function isToday(dateStr: string): boolean {
  const today = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const todayFormatted = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  return dateStr === todayFormatted;
}

export function isThisWeek(dateStr: string): boolean {
  try {
    const parts = dateStr.split(" ");
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const d = new Date(parseInt(parts[2]), months.indexOf(parts[1]), parseInt(parts[0]));
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function mapRawFoodRecords(data: unknown[]): MealRecord[] {
  if (!Array.isArray(data)) return [];

  return data.map((item) => {
    const r = item as Record<string, unknown>;
    const images = r.images as Record<string, unknown> | null;
    const imageUrl = (images?.file_path as string) || (r.image as string) || (r.gambar_url as string) || null;
    const rawDate = (r.tanggal as string) || (r.recorded_at as string) || new Date().toISOString();

    return {
      id: (r.id_analysis as string) || (r.id as string) || Math.random().toString(),
      date: formatDate(rawDate),
      time: formatTime(rawDate),
      name: formatFoodLabel((r.nama_makanan as string) || (r.food_name as string) || "Makanan"),
      calories: (r.kalori as number) || (r.calories as number) || 0,
      protein: (r.protein as number) || 0,
      carbs: (r.karbohidrat as number) || (r.carbs as number) || 0,
      fat: (r.lemak as number) || (r.fat as number) || 0,
      imageUrl,
    };
  });
}

export function filterMealRecords(
  records: MealRecord[],
  filter: "all" | "today" | "week",
  searchQuery: string
): MealRecord[] {
  return records.filter((item) => {
    const itemName = item.name || "";
    const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "today") return matchesSearch && isToday(item.date);
    if (filter === "week") return matchesSearch && isThisWeek(item.date);
    return matchesSearch;
  });
}

export function groupMealsByDateHeader(meals: MealRecord[]): Record<string, MealRecord[]> {
  return meals.reduce<Record<string, MealRecord[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});
}

export function calculateMacroSummary(meals: MealRecord[]) {
  return {
    totalCal: meals.reduce((s, i) => s + i.calories, 0),
    totalProtein: Math.round(meals.reduce((s, i) => s + i.protein, 0) * 10) / 10,
    totalCarbs: Math.round(meals.reduce((s, i) => s + i.carbs, 0) * 10) / 10,
    totalFat: Math.round(meals.reduce((s, i) => s + i.fat, 0) * 10) / 10,
  };
}

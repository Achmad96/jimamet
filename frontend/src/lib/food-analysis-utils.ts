import { formatFoodLabel } from "@/lib/food-labels";
import { AnalysisResult, DetectionBox } from "@/lib/food-detection";

export function buildAnalysisResultFromDetection(top: DetectionBox): AnalysisResult {
  const nut = top.nutrition || {};
  const cals = nut.calories || 0;
  const protein = nut.protein || 0;
  const carbs = nut.carbs || 0;
  const fat = nut.fat || 0;
  const fiber = nut.fiber || 0;
  const sugar = nut.sugar || 0;
  const servingSize = nut.serving_size || 0;
  const servingUnit = nut.serving_unit || "g";
  const isUnavailable = nut.source === "unavailable";

  const portionLabel =
    servingSize > 0 ? `~${Math.round(servingSize)}${servingUnit}` : "1 Porsi (100g)";

  return {
    foodName: formatFoodLabel(top.food_name),
    confidence: top.confidence,
    calories: cals,
    portion: portionLabel,
    nutrients: [
      {
        name: "Protein",
        value: protein,
        unit: "g",
        pct: Math.min(100, Math.round((protein / 50) * 100)),
        color: "#c85a32",
      },
      {
        name: "Karbohidrat",
        value: carbs,
        unit: "g",
        pct: Math.min(100, Math.round((carbs / 300) * 100)),
        color: "#d9822b",
      },
      {
        name: "Lemak",
        value: fat,
        unit: "g",
        pct: Math.min(100, Math.round((fat / 65) * 100)),
        color: "#2b6f77",
      },
      {
        name: "Serat",
        value: fiber,
        unit: "g",
        pct: Math.min(100, Math.round((fiber / 25) * 100)),
        color: "#588157",
      },
      {
        name: "Gula",
        value: sugar,
        unit: "g",
        pct: Math.min(100, Math.round((sugar / 50) * 100)),
        color: "#a8385d",
      },
    ],
    tags: isUnavailable
      ? ["Data Tidak Tersedia"]
      : nut.source === "csv"
      ? ["Data Akurat (Dataset)", "Real-time Low Latency"]
      : ["Estimasi AI"],
    recommendation: isUnavailable
      ? "Layanan AI sedang tidak tersedia. Silakan coba analisis ulang beberapa saat lagi."
      : nut.source === "csv"
      ? "Data kalori dan makronutrisi divalidasi langsung dari basis data gizi makanan Indonesia."
      : "Nutrisi di atas merupakan estimasi model berdasarkan komposisi porsi makanan standar.",
    nutritionUnavailable: isUnavailable,
  };
}

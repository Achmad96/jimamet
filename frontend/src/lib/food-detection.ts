export interface NutrientResult {
  name: string;
  value: number;
  unit: string;
  pct: number;
  color: string;
}

export interface AnalysisResult {
  foodName: string;
  confidence: number;
  calories: number;
  portion: string;
  nutrients: NutrientResult[];
  tags: string[];
  recommendation: string;
  nutritionUnavailable: boolean;
}

export interface DetectionBox {
  class_id: number;
  raw_label: string;
  food_name: string;
  confidence: number;
  bbox: [number, number, number, number];
  bbox_normalized: [number, number, number, number];
  nutrition: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    serving_size?: number;
    serving_unit?: string;
    source?: string;
  };
}

export interface VideoSummaryItem {
  food_name: string;
  raw_label: string;
  max_confidence: number;
  first_seen: number;
  last_seen: number;
  appearances: number;
  nutrition: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export interface VideoReport {
  video_info: {
    fps: number;
    total_frames: number;
    duration_sec: number;
    sampled_frames: number;
    width: number;
    height: number;
  };
  summary: VideoSummaryItem[];
  total_nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const DETECTION_PALETTE = [
  { stroke: "#4caf50", fill: "rgba(76, 175, 80, 0.18)", tag: "#2e7d32" },
  { stroke: "#2196f3", fill: "rgba(33, 150, 243, 0.18)", tag: "#1565c0" },
  { stroke: "#ff9800", fill: "rgba(255, 152, 0, 0.18)", tag: "#e65100" },
  { stroke: "#9c27b0", fill: "rgba(156, 39, 176, 0.18)", tag: "#6a1b9a" },
  { stroke: "#00bcd4", fill: "rgba(0, 188, 212, 0.18)", tag: "#00838f" },
  { stroke: "#e91e63", fill: "rgba(233, 30, 99, 0.18)", tag: "#c2185b" },
];

/**
 * Draws YOLO bounding boxes and labels onto the target canvas
 */
export function drawDetections(
  canvas: HTMLCanvasElement,
  detections: DetectionBox[],
  activeFoodName?: string | null,
  isMirrored: boolean = false
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  detections.forEach((det) => {
    const [nx1, ny1, nx2, ny2] = det.bbox_normalized;
    const bw = (nx2 - nx1) * w;
    const bh = (ny2 - ny1) * h;
    const x = isMirrored ? (1 - nx2) * w : nx1 * w;
    const y = ny1 * h;

    const color = DETECTION_PALETTE[det.class_id % DETECTION_PALETTE.length];
    const isHighlighted = activeFoodName === det.food_name;

    ctx.save();
    ctx.lineWidth = isHighlighted ? 4 : 2.5;
    ctx.strokeStyle = color.stroke;
    ctx.fillStyle = color.fill;

    // Rounded rectangle
    const r = Math.min(8, bw * 0.2, bh * 0.2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + bw - r, y);
    ctx.quadraticCurveTo(x + bw, y, x + bw, y + r);
    ctx.lineTo(x + bw, y + bh - r);
    ctx.quadraticCurveTo(x + bw, y + bh, x + bw - r, y + bh);
    ctx.lineTo(x + r, y + bh);
    ctx.quadraticCurveTo(x, y + bh, x, y + bh - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Corner accents
    const cLen = Math.min(18, bw * 0.25, bh * 0.25);
    ctx.lineWidth = 4;
    ctx.strokeStyle = color.stroke;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(x, y + cLen);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cLen, y);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(x + bw - cLen, y);
    ctx.lineTo(x + bw, y);
    ctx.lineTo(x + bw, y + cLen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(x, y + bh - cLen);
    ctx.lineTo(x, y + bh);
    ctx.lineTo(x + cLen, y + bh);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(x + bw - cLen, y + bh);
    ctx.lineTo(x + bw, y + bh);
    ctx.lineTo(x + bw, y + bh - cLen);
    ctx.stroke();

    // Tag Pill (Food Name + Conf % + Calories)
    const label = `${det.food_name} ${Math.round(det.confidence)}%`;
    const calLabel = det.nutrition?.calories ? `${Math.round(det.nutrition.calories)} kkal` : "";

    ctx.font = "bold 13px 'DM Sans', sans-serif";
    const textWidth = ctx.measureText(label).width;
    const tagW = Math.max(textWidth + 20, calLabel ? 115 : 85);
    const tagH = calLabel ? 36 : 24;
    const tagY = Math.max(6, y - tagH - 6);

    // Pill background
    ctx.fillStyle = color.tag;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, tagY, tagW, tagH, 6);
      ctx.fill();
    } else {
      ctx.fillRect(x, tagY, tagW, tagH);
    }

    // Text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + 8, tagY + 16);
    if (calLabel) {
      ctx.font = "11px 'DM Sans', sans-serif";
      ctx.fillStyle = "#e0f2f1";
      ctx.fillText(calLabel, x + 8, tagY + 30);
    }

    ctx.restore();
  });
}

/**
 * Recalculates nutrients based on gram weight and base nutritional values
 */
export function calculateNutrients(
  nutrition: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  },
  portionMultiplier: number = 1
): NutrientResult[] {
  const cals = (nutrition.calories || 0) * portionMultiplier;
  const prot = (nutrition.protein || 0) * portionMultiplier;
  const carbs = (nutrition.carbs || 0) * portionMultiplier;
  const fat = (nutrition.fat || 0) * portionMultiplier;
  const fiber = (nutrition.fiber || 0) * portionMultiplier;

  return [
    { name: "Energi", value: Math.round(cals), unit: "kkal", pct: Math.min(Math.round((cals / 2000) * 100), 100), color: "#1b4332" },
    { name: "Protein", value: Math.round(prot * 10) / 10, unit: "g", pct: Math.min(Math.round((prot / 60) * 100), 100), color: "#c85a32" },
    { name: "Karbohidrat", value: Math.round(carbs * 10) / 10, unit: "g", pct: Math.min(Math.round((carbs / 200) * 100), 100), color: "#d9822b" },
    { name: "Lemak", value: Math.round(fat * 10) / 10, unit: "g", pct: Math.min(Math.round((fat / 60) * 100), 100), color: "#2b6f77" },
    { name: "Serat", value: Math.round(fiber * 10) / 10, unit: "g", pct: Math.min(Math.round((fiber / 25) * 100), 100), color: "#588157" },
  ];
}

/**
 * Generate clinical dietetic feedback text based on macros
 */
export function generateNutritionFeedback(
  foodName: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number
): string {
  if (calories > 700) {
    return `${foodName} memiliki densitas kalori tinggi (${calories} kkal). Seimbangkan dengan memperbanyak sayuran tinggi serat dan hindari minuman manis berkalori tinggi.`;
  }
  if (protein >= 25) {
    return `Pilihan sangat baik! ${foodName} menyediakan ${protein}g protein yang optimal untuk pemeliharaan jaringan otot dan rasa kenyang lebih lama.`;
  }
  if (fat > 30) {
    return `${foodName} memiliki kandungan lemak yang cukup tinggi (${fat}g). Pertimbangkan metode pengolahan minim minyak (kukus, rebus, atau panggang) pada waktu makan berikutnya.`;
  }
  return `Porsi ${foodName} seimbang untuk kebutuhan energi harian Anda. Pastikan konsumsi air putih yang cukup untuk mendukung metabolisme optimal.`;
}

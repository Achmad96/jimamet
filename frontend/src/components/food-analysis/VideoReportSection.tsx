import { VideoReport } from "@/lib/food-detection";
import { formatFoodLabel } from "@/lib/food-labels";

interface VideoReportSectionProps {
  videoReport: VideoReport;
}

export function VideoReportSection({ videoReport }: VideoReportSectionProps) {
  return (
    <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start pb-3 border-b border-surface-container">
        <div>
          <h3 className="font-headline text-base font-bold text-on-surface">Ringkasan Deteksi Video</h3>
          <span className="font-mono text-[11px] text-outline">
            Durasi: {videoReport.video_info.duration_sec}s | {videoReport.video_info.sampled_frames} frame dianalisis
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-md bg-surface-low border border-surface-high">
          <span className="block font-mono text-[10px] uppercase text-outline">Total Kalori</span>
          <div className="font-mono text-base font-bold text-primary mt-0.5 tabular-nums">{videoReport.total_nutrition.calories} kkal</div>
        </div>
        <div className="p-3 rounded-md bg-surface-low border border-surface-high">
          <span className="block font-mono text-[10px] uppercase text-outline">Protein</span>
          <div className="font-mono text-base font-bold text-macro-protein mt-0.5 tabular-nums">{videoReport.total_nutrition.protein}g</div>
        </div>
        <div className="p-3 rounded-md bg-surface-low border border-surface-high">
          <span className="block font-mono text-[10px] uppercase text-outline">Karbohidrat</span>
          <div className="font-mono text-base font-bold text-macro-carbs mt-0.5 tabular-nums">{videoReport.total_nutrition.carbs}g</div>
        </div>
        <div className="p-3 rounded-md bg-surface-low border border-surface-high">
          <span className="block font-mono text-[10px] uppercase text-outline">Lemak</span>
          <div className="font-mono text-base font-bold text-macro-fat mt-0.5 tabular-nums">{videoReport.total_nutrition.fat}g</div>
        </div>
      </div>

      <div>
        <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-2.5">Hidangan Ditemukan ({videoReport.summary.length})</h4>
        <div className="flex flex-col gap-2">
          {videoReport.summary.map((item, i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-md bg-surface-low border border-surface-high">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-on-surface">{formatFoodLabel(item.food_name)}</span>
                <span className="font-mono text-[11px] text-outline">
                  {item.first_seen}s - {item.last_seen}s ({item.appearances}x) · {Math.round(item.max_confidence)}%
                </span>
              </div>
              <div className="text-right font-mono">
                <div className="text-xs font-bold text-primary">{item.nutrition.calories || 0} kkal</div>
                <span className="text-[11px] text-outline">
                  P {item.nutrition.protein || 0}g · K {item.nutrition.carbs || 0}g
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

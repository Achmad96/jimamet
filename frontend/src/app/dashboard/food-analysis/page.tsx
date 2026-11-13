import { FoodAnalysisClient } from "@/components/food-analysis/FoodAnalysisClient";

export const metadata = {
  title: "Analisis Nutrisi Makanan | Jimamet",
  description: "Identifikasi hidangan Nusantara secara instan melalui kamera real-time, foto, atau pemindaian video.",
};

export default function FoodAnalysisPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header (Server-rendered) ── */}
      <div className="flex justify-between items-end pb-4 border-b border-surface-high">
        <div>
          <h1 className="font-headline text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">
            Analisis Nutrisi Makanan
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Identifikasi hidangan Nusantara secara instan melalui kamera real-time, foto, atau pemindaian video.
          </p>
        </div>
      </div>

      {/* ── Client Interactive Island ── */}
      <FoodAnalysisClient />
    </div>
  );
}

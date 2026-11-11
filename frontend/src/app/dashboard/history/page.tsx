"use client";

import { useState, useEffect } from "react";
import { apiListFoodRecords } from "@/lib/api";
import { SkeletonHistory } from "@/components/Skeleton";
import { formatFoodLabel } from "@/lib/food-labels";

interface MealRecord {
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

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const todayFormatted = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  return dateStr === todayFormatted;
}

function isThisWeek(dateStr: string): boolean {
  const parts = dateStr.split(" ");
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const d = new Date(parseInt(parts[2]), months.indexOf(parts[1]), parseInt(parts[0]));
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [allData, setAllData] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiListFoodRecords().then(({ ok, data }) => {
      if (ok && Array.isArray(data) && data.length > 0) {
        const mapped: MealRecord[] = data.map((r: Record<string, unknown>) => {
          const images = r.images as Record<string, unknown> | null;
          const imageUrl = images?.file_path as string | null;

          return {
            id: (r.id_analysis as string) || (r.id as string) || Math.random().toString(),
            date: formatDate((r.tanggal as string) || (r.recorded_at as string)),
            time: formatTime((r.tanggal as string) || (r.recorded_at as string)),
            name: formatFoodLabel((r.nama_makanan as string) || (r.food_name as string) || "Makanan"),
            calories: (r.kalori as number) || (r.calories as number) || 0,
            protein: (r.protein as number) || 0,
            carbs: (r.karbohidrat as number) || (r.carbs as number) || 0,
            fat: (r.lemak as number) || (r.fat as number) || 0,
            imageUrl: imageUrl || null,
          };
        });
        setAllData(mapped);
      }
      setLoading(false);
    });
  }, []);

  const filteredData = allData.filter((item) => {
    const itemName = item.name || "";
    const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "today") return matchesSearch && isToday(item.date);
    if (filter === "week") return matchesSearch && isThisWeek(item.date);
    return matchesSearch;
  });

  const grouped = filteredData.reduce<Record<string, MealRecord[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  const totalCal = filteredData.reduce((s, i) => s + i.calories, 0);
  const totalProtein = filteredData.reduce((s, i) => s + i.protein, 0);
  const totalCarbs = filteredData.reduce((s, i) => s + i.carbs, 0);
  const totalFat = filteredData.reduce((s, i) => s + i.fat, 0);

  if (loading) return <SkeletonHistory />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-surface-high">
        <div>
          <span className="block font-mono text-[11px] font-semibold tracking-wider text-primary mb-1.5">
            REKAM JEJAK DIETETIKA
          </span>
          <h1 className="font-headline text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">
            Histori Konsumsi
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Buku besar kronologis asupan energi dan makronutrisi harian Anda.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Total Kalori
            </span>
            <span className="w-2 h-2 rounded-[2px] bg-macro-cal" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[26px] font-bold text-on-surface tabular-nums tracking-tight">
              {totalCal.toLocaleString()}
            </span>
            <span className="font-mono text-xs text-outline">kkal</span>
          </div>
        </div>

        <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Protein
            </span>
            <span className="w-2 h-2 rounded-[2px] bg-macro-protein" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[26px] font-bold text-on-surface tabular-nums tracking-tight">
              {totalProtein}
            </span>
            <span className="font-mono text-xs text-outline">gram</span>
          </div>
        </div>

        <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Karbohidrat
            </span>
            <span className="w-2 h-2 rounded-[2px] bg-macro-carbs" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[26px] font-bold text-on-surface tabular-nums tracking-tight">
              {totalCarbs}
            </span>
            <span className="font-mono text-xs text-outline">gram</span>
          </div>
        </div>

        <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Lemak
            </span>
            <span className="w-2 h-2 rounded-[2px] bg-macro-fat" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[26px] font-bold text-on-surface tabular-nums tracking-tight">
              {totalFat}
            </span>
            <span className="font-mono text-xs text-outline">gram</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex gap-1 bg-surface-container border border-surface-high rounded-md p-1">
          {(["all", "today", "week"] as const).map((f) => (
            <button
              key={f}
              className={`px-4 py-1.5 border-none rounded-[6px] font-body text-[13px] cursor-pointer transition-all ${
                filter === f
                  ? "bg-surface-lowest text-primary font-semibold shadow-xs"
                  : "bg-transparent text-on-surface-variant font-medium hover:text-on-surface"
              }`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Semua Riwayat" : f === "today" ? "Hari Ini" : "7 Hari Terakhir"}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Cari spesimen makanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-[260px] py-2 pl-9 pr-3.5 border border-surface-high rounded-md text-[13px] font-body text-on-surface bg-surface-lowest outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/10 placeholder:text-outline"
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex flex-col gap-5">
        {Object.entries(grouped).map(([date, meals]) => (
          <div key={date} className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-1">
              <span className="font-headline text-sm font-bold text-on-surface">{date}</span>
              <span className="font-mono text-xs font-semibold text-primary tabular-nums">
                {meals.reduce((s, m) => s + m.calories, 0).toLocaleString()} kkal
              </span>
            </div>
            <div className="bg-surface-lowest border border-surface-high rounded-lg overflow-hidden">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center gap-3.5 px-5 py-3.5 transition-colors border-b border-surface-container last:border-b-0 hover:bg-surface-low"
                >
                  {meal.imageUrl ? (
                    <img
                      src={meal.imageUrl}
                      alt={meal.name}
                      className="w-10 h-10 rounded-md object-cover shrink-0 bg-surface-container border border-surface-high"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-surface-low border border-surface-high text-on-surface-variant flex items-center justify-center shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                        <line x1="6" y1="1" x2="6" y2="4" />
                        <line x1="10" y1="1" x2="10" y2="4" />
                        <line x1="14" y1="1" x2="14" y2="4" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-on-surface truncate">
                      {meal.name}
                    </span>
                    <span className="font-mono text-[11px] text-outline tabular-nums">
                      {meal.time}
                    </span>
                  </div>
                  <div className="hidden md:flex gap-1.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-semibold whitespace-nowrap tabular-nums bg-macro-protein/10 text-macro-protein">
                      P {meal.protein}g
                    </span>
                    <span className="px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-semibold whitespace-nowrap tabular-nums bg-macro-carbs/10 text-macro-carbs">
                      K {meal.carbs}g
                    </span>
                    <span className="px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-semibold whitespace-nowrap tabular-nums bg-macro-fat/10 text-macro-fat">
                      L {meal.fat}g
                    </span>
                  </div>
                  <span className="font-mono text-[13px] font-bold text-on-surface w-22 text-right shrink-0 tabular-nums">
                    {meal.calories} kkal
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="text-center py-14 px-5 text-on-surface-variant text-sm bg-surface-lowest rounded-lg border border-surface-high">
            <p>Tidak ada rekaman konsumsi yang sesuai dengan filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useCallback, ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MealRecord,
  filterMealRecords,
  groupMealsByDateHeader,
  calculateMacroSummary,
} from "@/lib/history-utils";

interface HistoryViewProps {
  initialRecords: MealRecord[];
}

export function HistoryView({ initialRecords }: HistoryViewProps) {
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(
    () => filterMealRecords(initialRecords, filter, searchQuery),
    [initialRecords, filter, searchQuery]
  );

  const grouped = useMemo(
    () => groupMealsByDateHeader(filteredData),
    [filteredData]
  );

  const { totalCal, totalProtein, totalCarbs, totalFat } = useMemo(
    () => calculateMacroSummary(filteredData),
    [filteredData]
  );

  const handleFilterClick = useCallback((f: "all" | "today" | "week") => {
    setFilter(f);
  }, []);

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-surface-high">
        <div>
          <h1 className="font-headline text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">
            Riwayat Konsumsi Makanan
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Arsip seluruh catatan asupan gizi yang terdeteksi dan tersimpan dalam sistem.
          </p>
        </div>
        <Link
          href="/dashboard/food-analysis"
          className="px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-md text-xs font-semibold font-headline no-underline transition-colors shrink-0"
        >
          + Catat Makanan Baru
        </Link>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-lowest border border-surface-high rounded-lg p-4">
          <span className="block font-mono text-[11px] text-outline uppercase tracking-wider mb-1">
            Total Energi
          </span>
          <span className="font-mono text-2xl font-bold text-primary tabular-nums">
            {totalCal.toLocaleString("id-ID")}
          </span>
          <span className="font-mono text-xs text-outline ml-1">kkal</span>
        </div>
        <div className="bg-surface-lowest border border-surface-high rounded-lg p-4">
          <span className="block font-mono text-[11px] text-outline uppercase tracking-wider mb-1">
            Total Protein
          </span>
          <span className="font-mono text-2xl font-bold text-macro-protein tabular-nums">
            {totalProtein}
          </span>
          <span className="font-mono text-xs text-outline ml-1">g</span>
        </div>
        <div className="bg-surface-lowest border border-surface-high rounded-lg p-4">
          <span className="block font-mono text-[11px] text-outline uppercase tracking-wider mb-1">
            Total Karbohidrat
          </span>
          <span className="font-mono text-2xl font-bold text-macro-carbs tabular-nums">
            {totalCarbs}
          </span>
          <span className="font-mono text-xs text-outline ml-1">g</span>
        </div>
        <div className="bg-surface-lowest border border-surface-high rounded-lg p-4">
          <span className="block font-mono text-[11px] text-outline uppercase tracking-wider mb-1">
            Total Lemak
          </span>
          <span className="font-mono text-2xl font-bold text-macro-fat tabular-nums">
            {totalFat}
          </span>
          <span className="font-mono text-xs text-outline ml-1">g</span>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-lowest border border-surface-high rounded-lg p-3">
        <div className="flex items-center gap-1.5 bg-surface-low p-1 rounded-md">
          <button
            onClick={() => handleFilterClick("all")}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold font-headline transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-surface-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Semua ({initialRecords.length})
          </button>
          <button
            onClick={() => handleFilterClick("today")}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold font-headline transition-colors cursor-pointer ${
              filter === "today"
                ? "bg-surface-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => handleFilterClick("week")}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold font-headline transition-colors cursor-pointer ${
              filter === "week"
                ? "bg-surface-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            7 Hari Terakhir
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Cari makanan..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-low border border-surface-high rounded-md text-on-surface placeholder:text-outline outline-none focus:border-primary"
          />
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none"
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
        </div>
      </div>

      {/* ── Meal History Grouped List ── */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 bg-surface-lowest border border-dashed border-surface-high rounded-lg p-6">
          <p className="text-sm text-on-surface-variant mb-2">
            {searchQuery
              ? `Tidak ditemukan makanan dengan kata kunci "${searchQuery}".`
              : "Belum ada riwayat konsumsi makanan yang tercatat."}
          </p>
          <Link
            href="/dashboard/food-analysis"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Mulai analisis makanan baru →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([dateHeader, meals]) => (
            <div key={dateHeader} className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <span className="font-headline text-sm font-bold text-on-surface">
                  {dateHeader}
                </span>
                <span className="font-mono text-xs font-semibold text-primary tabular-nums">
                  {meals.reduce((s, m) => s + m.calories, 0).toLocaleString("id-ID")} kkal
                </span>
              </div>
              <div className="bg-surface-lowest border border-surface-high rounded-lg overflow-hidden divide-y divide-surface-container">
                {meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-surface-low"
                  >
                    {meal.imageUrl ? (
                      <Image
                        src={meal.imageUrl}
                        alt={meal.name}
                        width={40}
                        height={40}
                        unoptimized
                        className="w-10 h-10 rounded-md object-cover shrink-0 bg-surface-container border border-surface-high"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-surface-low border border-surface-high text-on-surface-variant flex items-center justify-center shrink-0">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
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
                      <span className="px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-semibold tabular-nums bg-macro-protein/10 text-macro-protein">
                        P {meal.protein}g
                      </span>
                      <span className="px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-semibold tabular-nums bg-macro-carbs/10 text-macro-carbs">
                        K {meal.carbs}g
                      </span>
                      <span className="px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-semibold tabular-nums bg-macro-fat/10 text-macro-fat">
                        L {meal.fat}g
                      </span>
                    </div>
                    <span className="font-mono text-sm font-bold text-primary shrink-0 tabular-nums">
                      {meal.calories} kkal
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

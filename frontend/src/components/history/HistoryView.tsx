"use client";

import { useState, useMemo, useCallback, ChangeEvent } from "react";
import { MealRecord, filterMealRecords, groupMealsByDateHeader, calculateMacroSummary } from "@/lib/history-utils";
import { HistoryHeader } from "./HistoryHeader";
import { HistoryMacroSummaryCards } from "./HistoryMacroSummaryCards";
import { HistoryFilterToolbar } from "./HistoryFilterToolbar";
import { HistoryGroupedList } from "./HistoryGroupedList";

interface HistoryViewProps {
  initialRecords: MealRecord[];
}

export function HistoryView({ initialRecords }: HistoryViewProps) {
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => filterMealRecords(initialRecords, filter, searchQuery), [initialRecords, filter, searchQuery]);

  const grouped = useMemo(() => groupMealsByDateHeader(filteredData), [filteredData]);

  const { totalCal, totalProtein, totalCarbs, totalFat } = useMemo(() => calculateMacroSummary(filteredData), [filteredData]);

  const handleFilterClick = useCallback((f: "all" | "today" | "week") => {
    setFilter(f);
  }, []);

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header Component ── */}
      <HistoryHeader />

      {/* ── Summary Macro Cards Component ── */}
      <HistoryMacroSummaryCards totalCal={totalCal} totalProtein={totalProtein} totalCarbs={totalCarbs} totalFat={totalFat} />

      {/* ── Filter & Search Toolbar Component ── */}
      <HistoryFilterToolbar filter={filter} totalRecordsCount={initialRecords.length} searchQuery={searchQuery} onFilterChange={handleFilterClick} onSearchChange={handleSearchChange} />

      {/* ── Meal History Grouped List Component ── */}
      <HistoryGroupedList grouped={grouped} searchQuery={searchQuery} />
    </div>
  );
}

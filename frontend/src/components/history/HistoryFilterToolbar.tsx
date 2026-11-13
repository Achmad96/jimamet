import { ChangeEvent } from "react";

interface HistoryFilterToolbarProps {
  filter: "all" | "today" | "week";
  totalRecordsCount: number;
  searchQuery: string;
  onFilterChange: (filter: "all" | "today" | "week") => void;
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function HistoryFilterToolbar({ filter, totalRecordsCount, searchQuery, onFilterChange, onSearchChange }: HistoryFilterToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-lowest border border-surface-high rounded-lg p-3">
      <div className="flex items-center gap-1.5 bg-surface-low p-1 rounded-md">
        <button onClick={() => onFilterChange("all")} className={`px-3 py-1.5 rounded-sm text-xs font-semibold font-headline transition-colors cursor-pointer ${filter === "all" ? "bg-surface-lowest text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"}`}>
          Semua ({totalRecordsCount})
        </button>
        <button onClick={() => onFilterChange("today")} className={`px-3 py-1.5 rounded-sm text-xs font-semibold font-headline transition-colors cursor-pointer ${filter === "today" ? "bg-surface-lowest text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"}`}>
          Hari Ini
        </button>
        <button onClick={() => onFilterChange("week")} className={`px-3 py-1.5 rounded-sm text-xs font-semibold font-headline transition-colors cursor-pointer ${filter === "week" ? "bg-surface-lowest text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"}`}>
          7 Hari Terakhir
        </button>
      </div>

      <div className="relative flex-1 sm:max-w-xs">
        <input type="text" value={searchQuery} onChange={onSearchChange} placeholder="Cari makanan..." className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-low border border-surface-high rounded-md text-on-surface placeholder:text-outline outline-none focus:border-primary" />
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
    </div>
  );
}

interface DashboardHeaderProps {
  greeting: string;
  displayName: string;
  dateFormatted: string;
}

export function DashboardHeader({
  greeting,
  displayName,
  dateFormatted,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-surface-high">
      <div>
        <h1 className="font-headline text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">
          {greeting}, {displayName}
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Ringkasan keseimbangan energi dan makronutrien berdasarkan catatan konsumsi Anda.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 font-mono text-xs font-medium text-on-surface-variant px-3.5 py-2 bg-surface-lowest rounded-md border border-surface-high">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {dateFormatted}
        </span>
      </div>
    </div>
  );
}

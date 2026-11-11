"use client";

/**
 * Skeleton loading components that mirror actual page layouts
 * using Tailwind CSS utility classes.
 */

export function SkeletonLine({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded-md bg-surface-high ${className}`} style={style} />;
}

export function SkeletonCircle({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-surface-high ${className}`} />;
}

/* ── Dashboard Skeleton ── */

export function SkeletonDashboard() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header — greeting + date badge */}
      <div className="flex items-end justify-between gap-6 border-b border-surface-high pb-6 max-[600px]:flex-col max-[600px]:items-start">
        <div className="space-y-2">
          <SkeletonLine className="h-3 w-36" />
          <SkeletonLine className="h-8 w-64" />
          <SkeletonLine className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonLine className="h-9 w-48 rounded-md" />
        </div>
      </div>

      {/* 4 Stat cards */}
      <div className="grid grid-cols-4 gap-4 max-[1024px]:grid-cols-2 max-[600px]:grid-cols-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-3.5 rounded-xl border border-surface-high bg-surface-lowest p-5">
            <div className="flex items-center justify-between">
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-8 w-8 rounded-md" />
            </div>
            <div className="flex flex-col gap-1.5">
              <SkeletonLine className="h-7 w-24" />
              <SkeletonLine className="h-3 w-20" />
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-container">
              <SkeletonLine className="h-full w-1/3 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row — 1.55fr + 1fr */}
      <div className="grid grid-cols-[1.55fr_1fr] gap-5 max-[1024px]:grid-cols-1">
        {/* Bar chart card */}
        <div className="rounded-xl border border-surface-high bg-surface-lowest p-6">
          <div className="mb-5 flex items-start justify-between">
            <SkeletonLine className="h-5 w-52" />
          </div>
          <div className="flex h-40 items-end gap-3">
            {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
              <SkeletonLine key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        {/* Donut chart card */}
        <div className="rounded-xl border border-surface-high bg-surface-lowest p-6">
          <div className="mb-5 flex items-start justify-between">
            <SkeletonLine className="h-5 w-44" />
          </div>
          <div className="flex items-center justify-center gap-7 py-2">
            <SkeletonCircle className="h-32 w-32" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <SkeletonLine className="h-2.5 w-2.5 rounded-sm" />
                  <SkeletonLine className="h-3 w-16" />
                  <SkeletonLine className="h-3 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row — 1fr + 1fr */}
      <div className="grid grid-cols-2 gap-5 max-[1024px]:grid-cols-1">
        {/* Meals list card */}
        <div className="rounded-xl border border-surface-high bg-surface-lowest p-6">
          <div className="mb-5 flex items-start justify-between">
            <div className="space-y-1">
              <SkeletonLine className="h-5 w-44" />
              <SkeletonLine className="h-3 w-28" />
            </div>
            <SkeletonLine className="h-8 w-20 rounded-md" />
          </div>
          <div className="flex flex-col">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3.5 border-b border-surface-container py-3 last:border-b-0">
                <SkeletonLine className="h-10 w-10 shrink-0 rounded-md" />
                <div className="flex flex-1 flex-col gap-1">
                  <SkeletonLine className="h-4 w-36" />
                  <SkeletonLine className="h-3 w-20" />
                </div>
                <SkeletonLine className="h-4 w-16 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Macro progress card */}
        <div className="rounded-xl border border-surface-high bg-surface-lowest p-6">
          <div className="mb-5 flex items-start justify-between">
            <SkeletonLine className="h-5 w-44" />
          </div>
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <SkeletonLine className="h-4 w-20" />
                  <SkeletonLine className="h-4 w-24" />
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                  <SkeletonLine className="h-full rounded-full" style={{ width: `${30 + i * 15}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Profile Skeleton ── */

export function SkeletonProfile() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-surface-high pb-5">
        <div className="space-y-1">
          <SkeletonLine className="h-3 w-40" />
          <SkeletonLine className="h-7 w-44" />
          <SkeletonLine className="h-4 w-64" />
        </div>
      </div>

      {/* Content grid: 1fr 340px */}
      <div className="grid grid-cols-[1fr_340px] gap-6 max-[960px]:grid-cols-1">
        {/* ROW 1 LEFT: Informasi Pribadi card */}
        <div className="flex flex-col gap-5 rounded-xl border border-surface-high bg-surface-lowest p-6">
          <div className="flex items-center gap-2.5">
            <SkeletonLine className="h-[18px] w-[18px] rounded" />
            <SkeletonLine className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* ROW 1 RIGHT: Avatar card */}
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-surface-high bg-surface-lowest p-7 text-center">
          <SkeletonLine className="h-16 w-16 rounded-lg" />
          <SkeletonLine className="mt-2 h-5 w-32" />
          <SkeletonLine className="h-3 w-24" />
        </div>

        {/* ROW 2 LEFT: Metrik Tubuh card */}
        <div className="flex flex-col gap-5 rounded-xl border border-surface-high bg-surface-lowest p-6">
          <div className="flex items-center gap-2.5">
            <SkeletonLine className="h-[18px] w-[18px] rounded" />
            <SkeletonLine className="h-4 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* ROW 2 RIGHT: BMI card */}
        <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-surface-high bg-surface-lowest p-6 text-center">
          <SkeletonLine className="h-3 w-36" />
          <SkeletonLine className="h-10 w-20" />
          <SkeletonLine className="h-5 w-24 rounded-md" />
          <div className="mt-2 w-full">
            <SkeletonLine className="h-2 w-full rounded-full" />
            <div className="mt-1.5 flex justify-between">
              {[...Array(5)].map((_, i) => (
                <SkeletonLine key={i} className="h-2 w-4" />
              ))}
            </div>
          </div>
        </div>

        {/* ROW 3 LEFT: Target Kesehatan card */}
        <div className="flex flex-col gap-5 rounded-xl border border-surface-high bg-surface-lowest p-6">
          <div className="flex items-center gap-2.5">
            <SkeletonLine className="h-[18px] w-[18px] rounded" />
            <SkeletonLine className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-3 gap-3 max-[640px]:grid-cols-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 rounded-lg border border-surface-high bg-surface-low p-4">
                <SkeletonLine className="h-8 w-8 rounded-md" />
                <SkeletonLine className="h-4 w-24" />
                <SkeletonLine className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* ROW 3 RIGHT: Calorie Target card */}
        <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-surface-high bg-surface-lowest p-6 text-center">
          <SkeletonLine className="h-3 w-32" />
          <SkeletonLine className="h-9 w-24" />
          <SkeletonLine className="h-3 w-16" />
          <SkeletonLine className="mt-2 h-3 w-48" />
        </div>

        {/* Save button bar */}
        <div className="col-span-full flex items-center gap-4">
          <SkeletonLine className="h-10 w-44 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/* ── Coach / NutriCoach AI Skeleton ── */

export function SkeletonCoach() {
  return (
    <div className="flex h-[calc(100vh-116px)] min-h-[500px] overflow-hidden rounded-xl border border-surface-high bg-surface-lowest">
      {/* Sidebar */}
      <aside className="flex w-[280px] shrink-0 flex-col border-r border-surface-high bg-surface-low">
        <div className="border-b border-surface-high p-5">
          <SkeletonLine className="mb-4 h-5 w-32" />
          <SkeletonLine className="h-10 w-full rounded-md" />
        </div>
        <div className="flex-1 space-y-2 overflow-hidden p-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2 rounded-md p-3">
              <SkeletonLine className="h-4 w-36" />
              <SkeletonLine className="h-3 w-20" />
            </div>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex flex-1 flex-col bg-surface">
        {/* Chat header */}
        <header className="flex items-center gap-3 border-b border-surface-high bg-surface-lowest p-4">
          <SkeletonLine className="h-9 w-9 rounded-md" />
          <div className="space-y-1">
            <SkeletonLine className="h-4 w-28" />
            <SkeletonLine className="h-3 w-16" />
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-hidden p-6">
          <div className="flex justify-start">
            <div className="max-w-[65%] space-y-2 rounded-xl border border-surface-high bg-surface-lowest p-4">
              <SkeletonLine className="h-4 w-56" />
              <SkeletonLine className="h-4 w-40" />
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[50%] space-y-2 rounded-xl bg-surface-container p-4">
              <SkeletonLine className="h-4 w-44" />
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="flex gap-3 border-t border-surface-high bg-surface-lowest p-4">
          <SkeletonLine className="h-10 flex-1 rounded-md" />
          <SkeletonLine className="h-10 w-10 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/* ── History Skeleton ── */

export function SkeletonHistory() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-surface-high pb-5">
        <div className="space-y-1">
          <SkeletonLine className="h-3 w-36" />
          <SkeletonLine className="h-7 w-44" />
          <SkeletonLine className="h-4 w-56" />
        </div>
      </div>

      {/* 4 Summary cards */}
      <div className="grid grid-cols-4 gap-4 max-[768px]:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5 rounded-xl border border-surface-high bg-surface-lowest px-5 py-[18px]">
            <SkeletonLine className="h-3 w-20" />
            <SkeletonLine className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Toolbar — filter tabs + search */}
      <div className="flex items-center justify-between gap-4 max-[768px]:flex-col max-[768px]:items-stretch">
        <div className="flex gap-1 rounded-md bg-surface-container p-1">
          <SkeletonLine className="h-8 w-20 rounded" />
          <SkeletonLine className="h-8 w-20 rounded" />
          <SkeletonLine className="h-8 w-20 rounded" />
        </div>
        <SkeletonLine className="h-9 w-[260px] rounded-md" />
      </div>

      {/* History grouped by date */}
      <div className="flex flex-col gap-5">
        {[...Array(2)].map((_, gi) => (
          <div key={gi} className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <SkeletonLine className="h-4 w-32" />
              <SkeletonLine className="h-3 w-20" />
            </div>
            <div className="overflow-hidden rounded-xl border border-surface-high bg-surface-lowest">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3.5 border-b border-surface-container px-5 py-3.5 last:border-b-0">
                  <SkeletonLine className="h-10 w-10 shrink-0 rounded-md" />
                  <div className="flex flex-1 flex-col gap-1">
                    <SkeletonLine className="h-4 w-36" />
                    <SkeletonLine className="h-3 w-16" />
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <SkeletonLine className="h-5 w-12 rounded-md" />
                    <SkeletonLine className="h-5 w-12 rounded-md" />
                    <SkeletonLine className="h-5 w-12 rounded-md" />
                  </div>
                  <SkeletonLine className="h-4 w-16 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Food Analysis Skeleton ── */

export function SkeletonFoodAnalysis() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="space-y-1">
        <SkeletonLine className="h-3 w-36" />
        <SkeletonLine className="h-7 w-40" />
        <SkeletonLine className="h-4 w-72" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 items-start gap-8 max-[900px]:grid-cols-1">
        {/* Left: Upload area */}
        <div className="rounded-xl border border-surface-high bg-surface-lowest p-8">
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-outline-variant px-12 py-20 text-center">
            <SkeletonLine className="h-14 w-14 rounded-lg" />
            <SkeletonLine className="h-5 w-48" />
            <SkeletonLine className="h-4 w-64" />
            <SkeletonLine className="mt-2 h-10 w-36 rounded-md" />
          </div>
        </div>

        {/* Right: Empty results placeholder */}
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-surface-high bg-surface-lowest px-12 py-24 text-center">
          <SkeletonLine className="h-14 w-14 rounded-lg" />
          <SkeletonLine className="h-5 w-44" />
          <SkeletonLine className="h-4 w-56" />
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard Layout Skeleton ── */

export function SkeletonLayout() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-surface-high border-t-primary" />
        <SkeletonLine className="h-3.5 w-24" />
      </div>
    </div>
  );
}

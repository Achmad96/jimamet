"use client";

/**
 * Skeleton loading components using TailwindCSS v4.
 * Reusable shimmer placeholders for each page layout.
 */

/* ── Base building blocks ── */

export function SkeletonLine({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} style={style} />;
}

export function SkeletonCircle({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-gray-200 ${className}`} />;
}

/* ── Dashboard Skeleton ── */

export function SkeletonDashboard() {
  return (
    <div className="p-6 max-w-[1280px] mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonLine className="h-8 w-64" />
        <SkeletonLine className="h-4 w-40" />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
            <SkeletonLine className="h-4 w-20" />
            <SkeletonLine className="h-8 w-28" />
            <SkeletonLine className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Chart + Donut Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm space-y-4">
          <SkeletonLine className="h-5 w-48" />
          <div className="flex items-end gap-2 h-40">
            {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
              <SkeletonLine
                key={i}
                className="flex-1 rounded-t-md"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm flex flex-col items-center gap-4">
          <SkeletonLine className="h-5 w-36" />
          <SkeletonCircle className="h-32 w-32" />
          <div className="space-y-2 w-full">
            {[...Array(3)].map((_, i) => (
              <SkeletonLine key={i} className="h-3 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Meals List */}
      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <SkeletonLine className="h-5 w-40" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
            <SkeletonCircle className="h-10 w-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonLine className="h-4 w-36" />
              <SkeletonLine className="h-3 w-24" />
            </div>
            <SkeletonLine className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Profile Skeleton ── */

export function SkeletonProfile() {
  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-6 animate-in fade-in">
      {/* Header + BMI card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <SkeletonCircle className="h-16 w-16 shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonLine className="h-6 w-40" />
              <SkeletonLine className="h-4 w-28" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm flex flex-col items-center gap-3">
          <SkeletonLine className="h-5 w-24" />
          <SkeletonCircle className="h-28 w-28" />
          <SkeletonLine className="h-4 w-32" />
        </div>
      </div>

      {/* Form fields */}
      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
        <SkeletonLine className="h-6 w-36" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonLine className="h-4 w-20" />
              <SkeletonLine className="h-11 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Goal selector */}
      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <SkeletonLine className="h-5 w-32" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border-2 border-gray-100 p-4 space-y-2">
              <SkeletonCircle className="h-10 w-10" />
              <SkeletonLine className="h-4 w-24" />
              <SkeletonLine className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <SkeletonLine className="h-12 w-full rounded-xl" />
    </div>
  );
}

/* ── Coach / NutriCoach AI Skeleton ── */

export function SkeletonCoach() {
  return (
    <div className="flex h-[calc(100vh-64px)] animate-in fade-in">
      {/* Sidebar */}
      <div className="w-[280px] bg-white border-r border-gray-100 p-4 space-y-4 hidden md:block">
        <SkeletonLine className="h-10 w-full rounded-xl" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl p-3 space-y-2 bg-gray-50">
              <SkeletonLine className="h-4 w-32" />
              <SkeletonLine className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <SkeletonCircle className="h-8 w-8" />
          <SkeletonLine className="h-5 w-40" />
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 space-y-4 overflow-hidden">
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-100 p-4 max-w-[60%] space-y-2">
              <SkeletonLine className="h-4 w-56" />
              <SkeletonLine className="h-4 w-40" />
            </div>
          </div>
          <div className="flex justify-end">
            <div className="rounded-2xl bg-green-50 p-4 max-w-[50%] space-y-2">
              <SkeletonLine className="h-4 w-44" />
            </div>
          </div>
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-100 p-4 max-w-[65%] space-y-2">
              <SkeletonLine className="h-4 w-64" />
              <SkeletonLine className="h-4 w-48" />
              <SkeletonLine className="h-4 w-36" />
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <SkeletonLine className="h-11 flex-1 rounded-xl" />
          <SkeletonCircle className="h-11 w-11" />
        </div>
      </div>
    </div>
  );
}

/* ── History Skeleton ── */

export function SkeletonHistory() {
  return (
    <div className="p-6 max-w-[1280px] mx-auto space-y-6 animate-in fade-in">
      <SkeletonLine className="h-8 w-48" />

      {/* Filter bar */}
      <div className="flex gap-3 flex-wrap">
        <SkeletonLine className="h-10 w-32 rounded-lg" />
        <SkeletonLine className="h-10 w-32 rounded-lg" />
        <SkeletonLine className="h-10 w-24 rounded-lg" />
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-sm flex items-center gap-4">
            <SkeletonCircle className="h-12 w-12 shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonLine className="h-5 w-44" />
              <div className="flex gap-4">
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="h-3 w-16" />
                <SkeletonLine className="h-3 w-18" />
              </div>
            </div>
            <SkeletonLine className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Food Analysis Skeleton ── */

export function SkeletonFoodAnalysis() {
  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-6 animate-in fade-in">
      <SkeletonLine className="h-8 w-56" />

      {/* Upload area */}
      <div className="rounded-2xl bg-white p-8 shadow-sm flex flex-col items-center gap-4">
        <SkeletonCircle className="h-20 w-20" />
        <SkeletonLine className="h-5 w-48" />
        <SkeletonLine className="h-4 w-64" />
        <SkeletonLine className="h-11 w-40 rounded-xl" />
      </div>

      {/* Results placeholder */}
      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <SkeletonLine className="h-6 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <SkeletonLine className="h-4 w-16 mx-auto" />
              <SkeletonLine className="h-7 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard Layout Skeleton ── */

export function SkeletonLayout() {
  return (
    <div className="flex items-center justify-center h-screen bg-[var(--surface)]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-200 border-t-green-600" />
        <SkeletonLine className="h-4 w-24" />
      </div>
    </div>
  );
}

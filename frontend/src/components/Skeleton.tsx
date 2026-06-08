"use client";

/**
 * Skeleton loading components that mirror actual page layouts.
 * Each skeleton uses the same CSS module classes as the real page
 * to guarantee structural alignment.
 */

import dashStyles from "@/app/dashboard/dashboard.module.css";
import histStyles from "@/app/dashboard/history/history.module.css";
import profStyles from "@/app/dashboard/profile/profile.module.css";

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
    <div className={dashStyles.dashboard}>
      {/* Header — greeting + date badge */}
      <div className={dashStyles.header}>
        <div className="space-y-2">
          <SkeletonLine className="h-8 w-64" />
          <SkeletonLine className="h-4 w-72" />
        </div>
        <div className={dashStyles.headerActions}>
          <SkeletonLine className="h-9 w-48 rounded-full" />
        </div>
      </div>

      {/* 2 Stat cards (Kalori + Protein) — grid-template-columns: repeat(4, 1fr) with only 2 children */}
      <div className={dashStyles.statCards}>
        {[...Array(2)].map((_, i) => (
          <div key={i} className={dashStyles.statCard}>
            <SkeletonLine className="h-11 w-11 rounded-lg" />
            <div className={dashStyles.statInfo}>
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-7 w-20" />
              <SkeletonLine className="h-3 w-16" />
            </div>
            <div className={dashStyles.statProgress}>
              <SkeletonLine className="h-full w-1/3 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row — 1.5fr + 1fr */}
      <div className={dashStyles.chartsRow}>
        {/* Bar chart card */}
        <div className={dashStyles.chartCard}>
          <div className={dashStyles.chartHeader}>
            <SkeletonLine className="h-5 w-52" />
          </div>
          <div className="flex items-end gap-3 h-40">
            {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
              <SkeletonLine key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        {/* Donut chart card */}
        <div className={dashStyles.chartCard}>
          <div className={dashStyles.chartHeader}>
            <SkeletonLine className="h-5 w-44" />
          </div>
          <div className={dashStyles.donutWrapper}>
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
      <div className={dashStyles.bottomRow}>
        {/* Meals list card */}
        <div className={dashStyles.mealsCard}>
          <div className={dashStyles.chartHeader}>
            <div className="space-y-1">
              <SkeletonLine className="h-5 w-44" />
              <SkeletonLine className="h-3 w-28" />
            </div>
            <SkeletonLine className="h-8 w-20 rounded-lg" />
          </div>
          <div className={dashStyles.mealsList}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={dashStyles.mealItem}>
                <SkeletonLine className="h-11 w-11 rounded-lg shrink-0" />
                <div className={dashStyles.mealInfo} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <SkeletonLine className="h-4 w-36" />
                  <SkeletonLine className="h-3 w-20" />
                </div>
                <SkeletonLine className="h-4 w-16 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Macro progress card */}
        <div className={dashStyles.macroCard}>
          <div className={dashStyles.chartHeader}>
            <SkeletonLine className="h-5 w-44" />
          </div>
          <div className={dashStyles.macroList}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={dashStyles.macroItem}>
                <div className={dashStyles.macroTop}>
                  <SkeletonLine className="h-4 w-20" />
                  <SkeletonLine className="h-4 w-24" />
                </div>
                <div className={dashStyles.macroTrack}>
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
    <div className={profStyles.page}>
      {/* Header */}
      <div className={profStyles.header}>
        <div className="space-y-1">
          <SkeletonLine className="h-7 w-36" />
          <SkeletonLine className="h-4 w-64" />
        </div>
      </div>

      {/* Content grid: 1fr 360px */}
      <div className={profStyles.content}>
        {/* ROW 1 LEFT: Informasi Pribadi card */}
        <div className={profStyles.card}>
          <div className="flex items-center gap-2.5">
            <SkeletonLine className="h-[18px] w-[18px] rounded" />
            <SkeletonLine className="h-4 w-32" />
          </div>
          <div className={profStyles.fieldGrid}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={profStyles.field}>
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-11 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* ROW 1 RIGHT: Avatar card */}
        <div className={profStyles.avatarCard}>
          <SkeletonCircle className="h-20 w-20" />
          <SkeletonLine className="h-5 w-32 mt-2" />
          <SkeletonLine className="h-3 w-24" />
        </div>

        {/* ROW 2 LEFT: Metrik Tubuh card */}
        <div className={profStyles.card}>
          <div className="flex items-center gap-2.5">
            <SkeletonLine className="h-[18px] w-[18px] rounded" />
            <SkeletonLine className="h-4 w-24" />
          </div>
          <div className={profStyles.fieldGrid}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={profStyles.field}>
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="h-11 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* ROW 2 RIGHT: BMI card */}
        <div className={profStyles.bmiCard}>
          <SkeletonLine className="h-4 w-36" />
          <SkeletonLine className="h-12 w-20" />
          <SkeletonLine className="h-6 w-24 rounded-full" />
          <div className="w-full mt-2">
            <SkeletonLine className="h-2 w-full rounded-full" />
            <div className="flex justify-between mt-1.5">
              {[...Array(5)].map((_, i) => (
                <SkeletonLine key={i} className="h-2 w-4" />
              ))}
            </div>
          </div>
        </div>

        {/* ROW 3 LEFT: Target Kesehatan card */}
        <div className={profStyles.card}>
          <div className="flex items-center gap-2.5">
            <SkeletonLine className="h-[18px] w-[18px] rounded" />
            <SkeletonLine className="h-4 w-32" />
          </div>
          <div className={profStyles.goalOptions}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={profStyles.goalCard}>
                <SkeletonLine className="h-7 w-7 rounded" />
                <SkeletonLine className="h-4 w-24" />
                <SkeletonLine className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* ROW 3 RIGHT: Calorie Target card */}
        <div className={profStyles.calorieCard}>
          <SkeletonLine className="h-4 w-32" />
          <SkeletonLine className="h-10 w-24" />
          <SkeletonLine className="h-3 w-16" />
          <SkeletonLine className="h-3 w-48 mt-2" />
        </div>

        {/* Save button bar */}
        <div className={profStyles.saveBar}>
          <SkeletonLine className="h-11 w-40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/* ── Coach / NutriCoach AI Skeleton ── */

export function SkeletonCoach() {
  return (
    <div className="flex bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden" style={{ height: "calc(100vh - 176px)", minHeight: 500 }}>
      {/* Sidebar */}
      <aside className="w-[300px] shrink-0 bg-[#f1f8e9] border-r border-[#e0e0e0] flex flex-col">
        <div className="p-6 border-b border-[rgba(46,125,50,0.1)]">
          <SkeletonLine className="h-5 w-32 mb-4" />
          <SkeletonLine className="h-11 w-full rounded-lg" />
        </div>
        <div className="flex-1 overflow-hidden p-3 space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg p-3.5 space-y-2">
              <SkeletonLine className="h-4 w-36" />
              <SkeletonLine className="h-3 w-20" />
            </div>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <header className="flex items-center gap-3 p-5 border-b border-[#e0e0e0]">
          <SkeletonCircle className="h-9 w-9" />
          <div className="space-y-1">
            <SkeletonLine className="h-4 w-28" />
            <SkeletonLine className="h-3 w-16" />
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 p-7 space-y-5 overflow-hidden">
          <div className="flex justify-start">
            <div className="rounded-[18px] bg-gray-100 p-4 max-w-[65%] space-y-2">
              <SkeletonLine className="h-4 w-56" />
              <SkeletonLine className="h-4 w-40" />
            </div>
          </div>
          <div className="flex justify-end">
            <div className="rounded-[18px] bg-green-50 p-4 max-w-[50%] space-y-2">
              <SkeletonLine className="h-4 w-44" />
            </div>
          </div>
          <div className="flex justify-start">
            <div className="rounded-[18px] bg-gray-100 p-4 max-w-[65%] space-y-2">
              <SkeletonLine className="h-4 w-64" />
              <SkeletonLine className="h-4 w-48" />
              <SkeletonLine className="h-4 w-36" />
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="flex gap-3 p-5 border-t border-[#eee]">
          <SkeletonLine className="h-11 flex-1 rounded-full" />
          <SkeletonCircle className="h-12 w-12" />
        </div>
      </div>
    </div>
  );
}

/* ── History Skeleton ── */

export function SkeletonHistory() {
  return (
    <div className={histStyles.page}>
      {/* Header */}
      <div className={histStyles.header}>
        <div className="space-y-1">
          <SkeletonLine className="h-7 w-40" />
          <SkeletonLine className="h-4 w-56" />
        </div>
      </div>

      {/* 4 Summary cards */}
      <div className={histStyles.summaryCards}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={histStyles.summaryCard}>
            <SkeletonLine className="h-3 w-16 mx-auto" />
            <SkeletonLine className="h-7 w-16 mx-auto" />
            <SkeletonLine className="h-2.5 w-10 mx-auto" />
          </div>
        ))}
      </div>

      {/* Toolbar — filter tabs + search */}
      <div className={histStyles.toolbar}>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <SkeletonLine className="h-8 w-16 rounded" />
          <SkeletonLine className="h-8 w-16 rounded" />
          <SkeletonLine className="h-8 w-16 rounded" />
        </div>
        <SkeletonLine className="h-10 w-[260px] rounded-full" />
      </div>

      {/* History grouped by date */}
      <div className={histStyles.historyList}>
        {[...Array(2)].map((_, gi) => (
          <div key={gi} className={histStyles.dateGroup}>
            <div className={histStyles.dateHeader}>
              <SkeletonLine className="h-4 w-32" />
              <SkeletonLine className="h-3 w-20" />
            </div>
            <div className={histStyles.mealsTable}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className={histStyles.mealRow}>
                  <SkeletonLine className="h-11 w-11 rounded-lg shrink-0" />
                  <div className={histStyles.mealInfo} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <SkeletonLine className="h-4 w-36" />
                    <SkeletonLine className="h-3 w-16" />
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <SkeletonLine className="h-5 w-12 rounded-full" />
                    <SkeletonLine className="h-5 w-12 rounded-full" />
                    <SkeletonLine className="h-5 w-12 rounded-full" />
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
        <SkeletonLine className="h-7 w-40" />
        <SkeletonLine className="h-4 w-72" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 items-start gap-8 max-[900px]:grid-cols-1">
        {/* Left: Upload area */}
        <div className="bg-white border border-gray-200 rounded-3xl p-9">
          <div className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-center py-20 px-12 gap-4">
            <SkeletonCircle className="h-14 w-14" />
            <SkeletonLine className="h-5 w-48" />
            <SkeletonLine className="h-4 w-64" />
            <SkeletonLine className="h-10 w-36 rounded-lg mt-2" />
          </div>
        </div>

        {/* Right: Empty results placeholder */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center py-24 px-12 gap-3">
          <SkeletonCircle className="h-16 w-16" />
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
    <div className="flex items-center justify-center h-screen bg-[var(--surface)]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-200 border-t-green-600" />
        <SkeletonLine className="h-4 w-24" />
      </div>
    </div>
  );
}

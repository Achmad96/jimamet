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
  return <div className={`animate-pulse rounded-md bg-[var(--surface-container-high)] ${className}`} style={style} />;
}

export function SkeletonCircle({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-[var(--surface-container-high)] ${className}`} />;
}

/* ── Dashboard Skeleton ── */

export function SkeletonDashboard() {
  return (
    <div className={dashStyles.dashboard}>
      {/* Header — greeting + date badge */}
      <div className={dashStyles.header}>
        <div className="space-y-2">
          <SkeletonLine className="h-3 w-36" />
          <SkeletonLine className="h-8 w-64" />
          <SkeletonLine className="h-4 w-72" />
        </div>
        <div className={dashStyles.headerActions}>
          <SkeletonLine className="h-9 w-48 rounded-md" />
        </div>
      </div>

      {/* 4 Stat cards (Energi + Protein + Karbohidrat + Lemak) */}
      <div className={dashStyles.statCards}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={dashStyles.statCard}>
            <div className={dashStyles.statTopRow}>
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-8 w-8 rounded-md" />
            </div>
            <div className={dashStyles.statInfo}>
              <SkeletonLine className="h-7 w-24" />
              <SkeletonLine className="h-3 w-20" />
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
            <SkeletonLine className="h-8 w-20 rounded-md" />
          </div>
          <div className={dashStyles.mealsList}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={dashStyles.mealItem}>
                <SkeletonLine className="h-10 w-10 rounded-md shrink-0" />
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
          <SkeletonLine className="h-3 w-40" />
          <SkeletonLine className="h-7 w-44" />
          <SkeletonLine className="h-4 w-64" />
        </div>
      </div>

      {/* Content grid: 1fr 340px */}
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
                <SkeletonLine className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* ROW 1 RIGHT: Avatar card */}
        <div className={profStyles.avatarCard}>
          <SkeletonLine className="h-16 w-16 rounded-lg" />
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
                <SkeletonLine className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* ROW 2 RIGHT: BMI card */}
        <div className={profStyles.bmiCard}>
          <SkeletonLine className="h-3 w-36" />
          <SkeletonLine className="h-10 w-20" />
          <SkeletonLine className="h-5 w-24 rounded-md" />
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
                <SkeletonLine className="h-8 w-8 rounded-md" />
                <SkeletonLine className="h-4 w-24" />
                <SkeletonLine className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* ROW 3 RIGHT: Calorie Target card */}
        <div className={profStyles.calorieCard}>
          <SkeletonLine className="h-3 w-32" />
          <SkeletonLine className="h-9 w-24" />
          <SkeletonLine className="h-3 w-16" />
          <SkeletonLine className="h-3 w-48 mt-2" />
        </div>

        {/* Save button bar */}
        <div className={profStyles.saveBar}>
          <SkeletonLine className="h-10 w-44 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/* ── Coach / NutriCoach AI Skeleton ── */

export function SkeletonCoach() {
  return (
    <div className="flex bg-[var(--surface-container-lowest)] border border-[var(--surface-container-high)] rounded-xl overflow-hidden" style={{ height: "calc(100vh - 116px)", minHeight: 500 }}>
      {/* Sidebar */}
      <aside className="w-[280px] shrink-0 bg-[var(--surface-container-low)] border-r border-[var(--surface-container-high)] flex flex-col">
        <div className="p-5 border-b border-[var(--surface-container-high)]">
          <SkeletonLine className="h-5 w-32 mb-4" />
          <SkeletonLine className="h-10 w-full rounded-md" />
        </div>
        <div className="flex-1 overflow-hidden p-3 space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-md p-3 space-y-2">
              <SkeletonLine className="h-4 w-36" />
              <SkeletonLine className="h-3 w-20" />
            </div>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-[var(--surface)]">
        {/* Chat header */}
        <header className="flex items-center gap-3 p-4 bg-[var(--surface-container-lowest)] border-b border-[var(--surface-container-high)]">
          <SkeletonLine className="h-9 w-9 rounded-md" />
          <div className="space-y-1">
            <SkeletonLine className="h-4 w-28" />
            <SkeletonLine className="h-3 w-16" />
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 p-6 space-y-4 overflow-hidden">
          <div className="flex justify-start">
            <div className="rounded-xl bg-[var(--surface-container-lowest)] border border-[var(--surface-container-high)] p-4 max-w-[65%] space-y-2">
              <SkeletonLine className="h-4 w-56" />
              <SkeletonLine className="h-4 w-40" />
            </div>
          </div>
          <div className="flex justify-end">
            <div className="rounded-xl bg-[var(--surface-container)] p-4 max-w-[50%] space-y-2">
              <SkeletonLine className="h-4 w-44" />
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="flex gap-3 p-4 bg-[var(--surface-container-lowest)] border-t border-[var(--surface-container-high)]">
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
    <div className={histStyles.page}>
      {/* Header */}
      <div className={histStyles.header}>
        <div className="space-y-1">
          <SkeletonLine className="h-3 w-36" />
          <SkeletonLine className="h-7 w-44" />
          <SkeletonLine className="h-4 w-56" />
        </div>
      </div>

      {/* 4 Summary cards */}
      <div className={histStyles.summaryCards}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={histStyles.summaryCard}>
            <SkeletonLine className="h-3 w-20" />
            <SkeletonLine className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Toolbar — filter tabs + search */}
      <div className={histStyles.toolbar}>
        <div className="flex gap-1 bg-[var(--surface-container)] rounded-md p-1">
          <SkeletonLine className="h-8 w-20 rounded" />
          <SkeletonLine className="h-8 w-20 rounded" />
          <SkeletonLine className="h-8 w-20 rounded" />
        </div>
        <SkeletonLine className="h-9 w-[260px] rounded-md" />
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
                  <SkeletonLine className="h-10 w-10 rounded-md shrink-0" />
                  <div className={histStyles.mealInfo} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <SkeletonLine className="h-4 w-36" />
                    <SkeletonLine className="h-3 w-16" />
                  </div>
                  <div className="flex gap-1.5 shrink-0">
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
        <div className="bg-[var(--surface-container-lowest)] border border-[var(--surface-container-high)] rounded-xl p-8">
          <div className="border border-dashed border-[var(--outline-variant)] rounded-lg flex flex-col items-center justify-center text-center py-20 px-12 gap-4">
            <SkeletonLine className="h-14 w-14 rounded-lg" />
            <SkeletonLine className="h-5 w-48" />
            <SkeletonLine className="h-4 w-64" />
            <SkeletonLine className="h-10 w-36 rounded-md mt-2" />
          </div>
        </div>

        {/* Right: Empty results placeholder */}
        <div className="bg-[var(--surface-container-lowest)] border border-[var(--surface-container-high)] rounded-xl flex flex-col items-center justify-center text-center py-24 px-12 gap-3">
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
    <div className="flex items-center justify-center h-screen bg-[var(--surface)]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-7 w-7 rounded-full border-3 border-[var(--surface-container-high)] border-t-[var(--primary)]" />
        <SkeletonLine className="h-3.5 w-24" />
      </div>
    </div>
  );
}

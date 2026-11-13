"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiDeleteConsultation, apiListConsultations } from "@/lib/api";

export interface ConsultationItem {
  id: string;
  user_id?: string;
  full_name?: string;
  coach_message?: string;
  nutritionist_notes?: string;
  status: "pending" | "completed" | "cancelled";
  handled_by?: string;
  created_at: string;
}

const statusStyle = {
  pending: { bg: "rgba(217, 130, 43, 0.12)", color: "#d9822b", label: "Menunggu Penanganan" },
  completed: { bg: "rgba(20, 54, 37, 0.12)", color: "#143625", label: "Selesai Ditangani" },
  cancelled: { bg: "rgba(110, 120, 112, 0.12)", color: "#6e7870", label: "Dibatalkan" },
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ConsultationListView({
  initialConsultations,
}: {
  initialConsultations: ConsultationItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<ConsultationItem[]>(initialConsultations);
  const [filter, setFilter] = useState<"semua" | "pending" | "completed">("semua");
  const [loading, setLoading] = useState(false);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await apiListConsultations();
    if (ok && Array.isArray(data)) {
      setItems(data);
    }
    setLoading(false);
  }, []);

  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus data konsultasi ini beserta seluruh chatnya?")) return;

    const { ok } = await apiDeleteConsultation(id);
    if (ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      alert("Gagal menghapus konsultasi.");
    }
  }, []);

  const displayed = useMemo(
    () =>
      items.filter((i) => {
        if (filter === "pending") return i.status === "pending";
        if (filter === "completed") return i.status === "completed";
        return true;
      }),
    [items, filter]
  );

  const pendingCount = useMemo(
    () => items.filter((i) => i.status === "pending").length,
    [items]
  );
  const completedCount = useMemo(
    () => items.filter((i) => i.status === "completed").length,
    [items]
  );


  return (
    <div>
      {/* ── Page Header ── */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
            ANTREAN RUJUKAN KLINIS
          </span>
          <h1 className="font-headline text-[26px] font-bold tracking-[-0.03em] text-on-surface">
            Daftar Konsultasi Pasien
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Pemeriksaan riwayat makanan dan komunikasi dua arah bersama pasien rujukan.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-surface-high bg-surface-lowest px-3.5 py-2 font-mono text-xs font-medium text-on-surface-variant transition-colors hover:border-outline-variant hover:text-on-surface disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[17px] ${loading ? "animate-spin" : ""}`}>
              refresh
            </span>
            Sinkronkan
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="mb-5 flex gap-2 border-b border-surface-container pb-3">
        <button
          onClick={() => setFilter("semua")}
          className={`cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
            filter === "semua"
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-surface-low text-on-surface-variant hover:bg-surface-high hover:text-on-surface"
          }`}
        >
          Semua ({items.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
            filter === "pending"
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-surface-low text-on-surface-variant hover:bg-surface-high hover:text-on-surface"
          }`}
        >
          Menunggu ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
            filter === "completed"
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-surface-low text-on-surface-variant hover:bg-surface-high hover:text-on-surface"
          }`}
        >
          Selesai ({completedCount})
        </button>
      </div>

      {/* ── Consultation Table / List ── */}
      {displayed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-high bg-surface-lowest p-12 text-center">
          <span className="material-symbols-outlined mb-2.5 block text-[40px] text-outline-variant">
            inbox
          </span>
          <div className="font-headline text-[15px] font-bold text-on-surface">
            Tidak ada antrean konsultasi
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            {filter === "semua"
              ? "Belum ada pasien yang dirujuk ke portal ahli gizi."
              : `Tidak ditemukan konsultasi berstatus "${filter === "pending" ? "Menunggu" : "Selesai"}".`}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-surface-high bg-surface-lowest p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-headline text-[17px] font-bold tracking-[-0.02em] text-on-surface">
              Daftar Rujukan Pasien ({displayed.length})
            </h2>
          </div>
          <div className="flex flex-col">
            {displayed.map((item) => {
              const rawStatus = item.status || "pending";
              let s = statusStyle[rawStatus as keyof typeof statusStyle] || statusStyle.pending;
              if (item.handled_by && rawStatus === "pending") {
                s = { bg: "rgba(43, 111, 119, 0.12)", color: "#2b6f77", label: `Ditangani: ${item.handled_by}` };
              }
              return (
                <div
                  key={item.id}
                  onClick={() => router.push(`/ahli-gizi/pasien/${item.id}`)}
                  className="flex cursor-pointer items-start gap-4 rounded-lg border-b border-surface-container px-2 py-4 transition-colors hover:bg-surface-low last:border-b-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] font-headline text-base font-bold text-primary">
                    {item.full_name?.[0]?.toUpperCase() ?? "P"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-headline text-sm font-bold text-on-surface">
                        {item.full_name || "Pasien"}
                      </span>
                      <span className="font-mono text-[11px] text-outline">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <div className="mb-2 truncate text-[13px] leading-normal text-on-surface-variant">
                      {item.coach_message || "Rujukan pemeriksaan gizi lanjutan"}
                    </div>
                    <span
                      className="inline-block rounded-md px-2.5 py-0.5 font-mono text-[11px] font-semibold"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Hapus Konsultasi"
                      className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-outline transition-colors hover:bg-error-container hover:text-error"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    <span className="material-symbols-outlined text-[18px] text-outline">
                      chevron_right
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

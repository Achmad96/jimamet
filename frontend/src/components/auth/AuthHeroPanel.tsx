import Link from "next/link";
import Image from "next/image";

export function AuthHeroPanel() {
  return (
    <div className="hidden lg:flex relative overflow-hidden items-end p-12 border-r border-surface-high">
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d2418]/95 via-[#143625]/82 to-[#143625]/68 z-10" />
      <Image
        src="/hero-nutrition.png"
        alt="Healthy nutritious food"
        fill
        priority
        className="object-cover saturate-85"
        sizes="(min-width: 1024px) 50vw, 100vw"
      />
      <div className="relative z-20 text-white flex flex-col gap-9 max-w-[480px] w-full">
        <Link href="/" className="inline-flex items-center gap-2.5 no-underline text-white">
          <Image
            src="/jimamet_logo.webp"
            alt="Jimamet Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="font-headline text-xl font-bold tracking-tight">Jimamet</span>
          <span className="font-mono text-[10px] font-semibold tracking-widest px-2 py-0.5 rounded-sm bg-white/14 text-primary-fixed">
            CLINICAL
          </span>
        </Link>
        <div>
          <span className="block font-mono text-[11px] font-semibold tracking-widest text-primary-fixed-dim mb-2.5">
            MONITORING NUTRISI & DIETETIKA
          </span>
          <h1 className="font-headline text-3xl xl:text-[34px] font-bold leading-[1.16] tracking-[-0.025em] mb-3.5">
            Rekam gizi presisi untuk keputusan klinis harian.
          </h1>
          <p className="text-[15px] leading-[1.65] text-white/80">
            Identifikasi komponen makronutrien makanan secara otomatis melalui visi komputer dan
            terhubung langsung dengan evaluasi Ahli Gizi.
          </p>
        </div>
        <div className="flex items-center gap-6 px-5 py-4 bg-black/28 border border-white/14 rounded-lg backdrop-blur-md">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-lg font-bold tracking-tight">YOLOv8</span>
            <span className="text-[11px] text-white/70">Deteksi Visual</span>
          </div>
          <div className="w-px h-7 bg-white/15" />
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-lg font-bold tracking-tight">500+</span>
            <span className="text-[11px] text-white/70">Indeks Pangan</span>
          </div>
          <div className="w-px h-7 bg-white/15" />
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-lg font-bold tracking-tight">Live WS</span>
            <span className="text-[11px] text-white/70">Konsultasi Gizi</span>
          </div>
        </div>
      </div>
    </div>
  );
}

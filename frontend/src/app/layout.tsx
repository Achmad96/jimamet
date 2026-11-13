import type { Metadata } from "next";
import { DM_Sans, Crimson_Pro, Space_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson-pro",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jimamet — Pencatat Kalori & Gizi Praktis",
  description: "Kenali kalori dan kandungan gizi makanan Anda cukup dengan sekali foto. Hitung nutrisi otomatis sesuai standar Kemenkes RI dan konsultasi langsung bersama Ahli Gizi.",
  keywords: ["nutrisi", "kalori makanan indonesia", "hitung kalori foto", "tabel komposisi pangan indonesia", "pola makan sehat", "diet sehat", "ahli gizi", "jimamet"],
  authors: [{ name: "Jimamet Team" }],
  openGraph: {
    title: "Jimamet — Pencatat Kalori & Gizi Praktis",
    description: "Kenali kalori dan kandungan gizi makanan Anda cukup dengan sekali foto.",
    type: "website",
    locale: "id_ID"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${dmSans.variable} ${crimsonPro.variable} ${spaceMono.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}


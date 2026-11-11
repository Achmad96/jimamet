import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jimamet — Medical Nutrition Platform",
  description:
    "Transformasikan kesehatan Anda dengan analisis nutrisi berbasis AI yang presisi. Pantau asupan makanan secara klinis dan profesional.",
  keywords: [
    "nutrisi",
    "medical nutrition",
    "AI food analysis",
    "diet tracking",
    "kesehatan",
    "jimamet",
  ],
  authors: [{ name: "Jimamet Team" }],
  openGraph: {
    title: "Jimamet — Medical Nutrition Platform",
    description:
      "Analisis nutrisi berbasis AI dengan presisi klinis.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

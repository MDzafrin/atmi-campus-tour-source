import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ATMI Campus Tour — Politeknik Industri ATMI Cikarang",
  description:
    "Jelajahi kampus vokasi industri di jantung kawasan Jababeka, Cikarang. Reservasi Campus Tour: lihat langsung Teaching Factory, workshop CNC, lab mekatronika, dan asrama mahasiswa Politeknik Industri ATMI.",
  keywords: [
    "ATMI Cikarang",
    "Politeknik Industri ATMI",
    "campus tour",
    "kampus vokasi",
    "Jababeka",
    "mekatronika",
    "mesin industri",
    "manajemen industri",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "ATMI Campus Tour — Politeknik Industri ATMI Cikarang",
    description:
      "Reservasi kunjungan kampus: rasakan langsung budaya industri, PBET 67% praktik, dan fasilitas produksi nyata di kawasan Jababeka.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

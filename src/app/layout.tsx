import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistem Operasional Logistik & Armada",
  description: "Manajemen armada, surat jalan, dan buku kas operasional",
  // iOS "Add to Home Screen" — pelengkap manifest.ts
  appleWebApp: {
    capable: true,
    title: "Portal Driver",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

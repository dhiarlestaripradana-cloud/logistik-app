import Link from "next/link";
import { Truck, Store, Users, Wallet, AlertTriangle, FileText, Hourglass } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatRupiah } from "@/lib/utils/date";
import { getKendaraanList } from "@/modules/kendaraan/queries";
import { getSaldoKas } from "@/modules/kas/queries";
import { getDanaPending, getTripAktifCount } from "@/modules/perjalanan/queries";
import { getAntrianVerifikasi } from "@/modules/verifikasi/queries";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [kendaraan, saldo, danaPending, tripAktif, customerCount, driverCount, antrianVerif] =
    await Promise.all([
      getKendaraanList(),
      getSaldoKas(),
      getDanaPending(),
      getTripAktifCount(),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "DRIVER", isActive: true } }),
      getAntrianVerifikasi(),
    ]);

  // Blueprint 4.5: Kas Efektif = Saldo Buku − Dana Pending (kasbon di jalan)
  // → admin tidak akan over-commit uang jalan melebihi uang riil di laci.
  const kasEfektif = saldo - danaPending;

  // Panel alert: kumpulkan semua dokumen yang tidak HIJAU (Blueprint 5.1)
  const alerts = kendaraan
    .filter((k) => k.status !== "NONAKTIF")
    .flatMap((k) => [
      { plat: k.nomorPolisi, jenis: "Pajak STNK", alert: k.pajakAlert },
      // Armada tanpa KIR (kirAlert null) tidak menghasilkan alert KIR
      ...(k.kirAlert ? [{ plat: k.nomorPolisi, jenis: "KIR", alert: k.kirAlert }] : []),
      ...(k.sisaKmServis <= 100
        ? [
            {
              plat: k.nomorPolisi,
              jenis: "Servis",
              alert: {
                level: "MERAH" as const,
                label: `Sisa ${k.sisaKmServis.toLocaleString("id-ID")} KM`,
                sisaHari: 0,
              },
            },
          ]
        : []),
    ])
    .filter((a) => a.alert.level !== "HIJAU")
    .sort((a, b) => a.alert.sisaHari - b.alert.sisaHari);

  const cardsKeuangan = [
    { label: "Saldo Kas Buku", value: formatRupiah(saldo), icon: Wallet, href: "/kas" },
    { label: "Dana Pending (Kasbon)", value: formatRupiah(danaPending), icon: Hourglass, href: "/perjalanan" },
    { label: "Kas Efektif", value: formatRupiah(kasEfektif), icon: Wallet, href: "/kas" },
    { label: "Trip Aktif", value: String(tripAktif), icon: FileText, href: "/perjalanan" },
  ];
  const cards = [
    { label: "Armada Terdaftar", value: String(kendaraan.length), icon: Truck, href: "/kendaraan" },
    { label: "Customer Aktif", value: String(customerCount), icon: Store, href: "/customer" },
    { label: "Driver Aktif", value: String(driverCount), icon: Users, href: "/driver" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Ringkasan operasional. Kas Efektif = Saldo Buku − Dana Pending (kasbon trip aktif).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cardsKeuangan.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex items-center gap-2 text-slate-500">
              <Icon size={16} />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{value}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex items-center gap-2 text-slate-500">
              <Icon size={16} />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{value}</div>
          </Link>
        ))}
      </div>

      {antrianVerif.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              📋 Trip Menunggu Verifikasi ({antrianVerif.length})
            </h2>
            <Link href="/verifikasi" className="text-sm font-medium text-blue-600 hover:underline">
              Buka Verifikasi →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {antrianVerif.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <span className="font-mono font-semibold">{a.nomorSj}</span>
                  <span className="ml-2 text-slate-500">{a.driver} · {a.kendaraan}</span>
                </div>
                <Link href={`/verifikasi/${a.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                  Periksa →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <AlertTriangle size={17} className="text-amber-500" />
          <h2 className="font-semibold text-slate-900">Panel Alert Dokumen &amp; Servis</h2>
        </div>
        {alerts.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            ✅ Tidak ada alert. Semua dokumen armada aman (di atas H-14).
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {alerts.map((a, i) => (
              <li key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <span className="font-semibold text-slate-900">{a.plat}</span>
                  <span className="ml-2 text-slate-500">{a.jenis}</span>
                </div>
                <Badge level={a.alert.level}>{a.alert.label}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

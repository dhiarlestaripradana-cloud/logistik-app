"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { kompresFoto, labelUkuran } from "@/lib/utils/image";
import { cn } from "@/lib/utils/cn";

// =====================================================================
//  Input foto bukti mobile-friendly:
//  - membuka kamera belakang (capture="environment") atau galeri
//  - foto LANGSUNG dikompresi di HP (< ~300KB) sebelum masuk state
//  - preview + label ukuran + tombol hapus
// =====================================================================

export function FotoInput({
  label,
  value,
  onChange,
  wajib = false,
}: {
  label: string;
  value: Blob | null;
  onChange: (b: Blob | null) => void;
  wajib?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [sibuk, setSibuk] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const pilihFoto = async (file: File | undefined) => {
    if (!file) return;
    setSibuk(true);
    try {
      onChange(await kompresFoto(file));
    } catch {
      window.alert("Gagal memproses foto. Coba ambil ulang.");
    } finally {
      setSibuk(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        suppressHydrationWarning
        onChange={(e) => pilihFoto(e.target.files?.[0])}
      />

      {value && previewUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={label} className="h-36 w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-3 py-1.5 text-xs text-white">
            <span>✓ {label} · {labelUkuran(value.size)}</span>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => onChange(null)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20"
              aria-label={`Hapus ${label}`}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          suppressHydrationWarning
          disabled={sibuk}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm font-medium transition",
            wajib
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-slate-300 bg-slate-50 text-slate-500",
            sibuk && "opacity-60"
          )}
        >
          <Camera size={19} />
          {sibuk ? "Mengompresi foto..." : `${label}${wajib ? " (wajib)" : ""}`}
        </button>
      )}
    </div>
  );
}

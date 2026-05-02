"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, X, Loader2 } from "lucide-react";
import { uploadJobPhoto, clearJobPhoto } from "@/lib/jobs";

interface Props {
  jobId:    string;
  kind:     "before" | "after";
  url:      string | null;
  disabled?: boolean;
  onChange: (url: string | null) => void;
}

export default function JobPhotoSlot({ jobId, kind, url, disabled, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const label = kind === "before" ? "Before" : "After";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const newUrl = await uploadJobPhoto(jobId, kind, file);
      onChange(newUrl);
    } catch (err) {
      console.error(err);
      alert("Photo upload failed. Try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    setBusy(true);
    try {
      await clearJobPhoto(jobId, kind);
      onChange(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide">{label}</p>
      <label
        className={`relative aspect-square rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${
          url
            ? "border-[#16A34A] bg-[#F0FDF4]"
            : "border-[#C9A96E] bg-[#FAFAF7] active:bg-[#F5ECD7]"
        } ${disabled ? "opacity-40 pointer-events-none" : "cursor-pointer"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          disabled={disabled || busy}
          className="hidden"
        />
        {busy ? (
          <Loader2 size={24} className="text-[#C9A96E] animate-spin" />
        ) : url ? (
          <>
            <Image src={url} alt={label} fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
              aria-label={`Remove ${label} photo`}
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-[#A07840]">
            <Camera size={24} />
            <span className="text-xs font-semibold">Tap to add</span>
          </div>
        )}
      </label>
    </div>
  );
}

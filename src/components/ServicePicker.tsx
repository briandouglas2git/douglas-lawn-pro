"use client";
import { useEffect, useState } from "react";
import { Wrench, Plus } from "lucide-react";
import { getServices, type Service } from "@/lib/services";

interface Props {
  onPick: (service: Service) => void;
}

export default function ServicePicker({ onPick }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [open,     setOpen]     = useState(false);

  useEffect(() => { getServices().then(setServices); }, []);

  if (services.length === 0) return null;

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-[#C9A96E] font-semibold mb-2">
        <Wrench size={14} /> {open ? "Hide" : "Pick from saved services"}
      </button>

      {open && (
        <div className="bg-[#F5ECD7] rounded-xl p-2 mb-3 max-h-56 overflow-y-auto flex flex-col gap-1">
          {services.map(s => (
            <button key={s.id} type="button"
              onClick={() => { onPick(s); setOpen(false); }}
              className="w-full flex items-center justify-between bg-white rounded-lg px-3 py-2 text-left active:scale-95 transition-transform">
              <span className="text-sm text-[#1a1a1a]">{s.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#A07840]">${s.defaultPrice.toFixed(2)}</span>
                <Plus size={14} className="text-[#C9A96E]" />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

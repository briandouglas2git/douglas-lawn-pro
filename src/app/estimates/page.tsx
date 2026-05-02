"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ChevronRight, ClipboardList } from "lucide-react";
import { getEstimates, type Estimate } from "@/lib/estimates";

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  draft:    { bg: "#F3F4F6", color: "#6b7280", label: "Draft"    },
  sent:     { bg: "#FEF3C7", color: "#B45309", label: "Sent"     },
  accepted: { bg: "#DCFCE7", color: "#16A34A", label: "Accepted" },
  booked:   { bg: "#F5ECD7", color: "#A07840", label: "Booked"   },
  declined: { bg: "#FEE2E2", color: "#DC2626", label: "Declined" },
};

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    getEstimates()
      .then(setEstimates)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Estimates</h1>
        <Link href="/estimates/new"
          className="bg-[#C9A96E] text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md">
          <Plus size={20} strokeWidth={2.5} />
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-[#ede8df] h-20 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && estimates.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-[#ede8df] shadow-sm text-center">
          <ClipboardList size={32} className="text-[#C9A96E] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#1a1a1a] mb-1">No estimates yet</p>
          <p className="text-xs text-[#6b7280] mb-4">Create your first estimate to send a customer.</p>
          <Link href="/estimates/new"
            className="inline-flex items-center gap-1.5 bg-[#C9A96E] text-white rounded-xl px-4 py-2 text-sm font-semibold">
            <Plus size={14} /> New Estimate
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {estimates.map(est => {
          const badge = STATUS_COLORS[est.status] ?? STATUS_COLORS.draft;
          return (
            <Link key={est.id} href={`/estimates/${est.id}`}
              className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm active:scale-95 transition-transform">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <ClipboardList size={15} className="text-[#C9A96E] shrink-0" />
                  <p className="font-semibold text-[#1a1a1a] text-sm truncate">{est.customerName}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: badge.bg, color: badge.color }}>
                  {est.isPlan ? "Plan" : badge.label}
                </span>
              </div>
              <p className="text-xs text-[#6b7280] mb-2 pl-5 truncate">{est.description || "—"}</p>
              <div className="flex items-center justify-between pl-5">
                <p className="text-xs text-[#6b7280]">
                  {new Date(est.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                </p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold text-[#A07840]">${est.total.toFixed(2)}</p>
                  <ChevronRight size={14} className="text-[#C9A96E]" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

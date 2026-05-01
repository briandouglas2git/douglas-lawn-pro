import Link from "next/link";
import { Plus, ChevronRight, ClipboardList } from "lucide-react";

const SAMPLE_ESTIMATES = [
  {
    id:           "est1",
    customerName: "John Miller",
    description:  "Spring cleanup + fertilization",
    total:        285.00,
    status:       "Sent",
    date:         "Apr 28, 2026",
  },
  {
    id:           "est2",
    customerName: "Sarah Thompson",
    description:  "Full lawn care package",
    total:        520.00,
    status:       "Draft",
    date:         "Apr 30, 2026",
  },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Draft:    { bg: "#F3F4F6", color: "#6b7280" },
  Sent:     { bg: "#FEF3C7", color: "#B45309" },
  Accepted: { bg: "#DCFCE7", color: "#16A34A" },
  Booked:   { bg: "#F5ECD7", color: "#A07840" },
  Declined: { bg: "#FEE2E2", color: "#DC2626" },
};

export default function EstimatesPage() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Estimates</h1>
        <Link
          href="/estimates/new"
          className="bg-[#C9A96E] text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md"
        >
          <Plus size={20} strokeWidth={2.5} />
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {SAMPLE_ESTIMATES.map((est) => {
          const badge = STATUS_COLORS[est.status] ?? STATUS_COLORS.Draft;
          return (
            <Link
              key={est.id}
              href={`/estimates/${est.id}`}
              className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm active:scale-95 transition-transform"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <ClipboardList size={15} className="text-[#C9A96E] shrink-0" />
                  <p className="font-semibold text-[#1a1a1a] text-sm">{est.customerName}</p>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {est.status}
                </span>
              </div>
              <p className="text-xs text-[#6b7280] mb-2 pl-5">{est.description}</p>
              <div className="flex items-center justify-between pl-5">
                <p className="text-xs text-[#6b7280]">{est.date}</p>
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

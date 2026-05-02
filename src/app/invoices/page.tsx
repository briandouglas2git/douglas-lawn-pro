"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, ChevronRight, FileText, DollarSign } from "lucide-react";
import { getInvoices, type Invoice } from "@/lib/invoices";

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: "#F3F4F6", color: "#6b7280", label: "Draft" },
  sent:  { bg: "#FEF3C7", color: "#B45309", label: "Sent"  },
  paid:  { bg: "#DCFCE7", color: "#16A34A", label: "Paid"  },
};

type Filter = "all" | "unpaid" | "paid";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<Filter>("all");

  useEffect(() => {
    getInvoices()
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "unpaid") return invoices.filter(i => i.status !== "paid");
    if (filter === "paid")   return invoices.filter(i => i.status === "paid");
    return invoices;
  }, [invoices, filter]);

  const unpaidTotal = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const paidTotal   = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Invoices</h1>
        <Link href="/invoices/new"
          className="bg-[#C9A96E] text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md">
          <Plus size={20} strokeWidth={2.5} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 border border-[#ede8df]">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign size={11} className="text-[#B45309]" />
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide">Unpaid</p>
          </div>
          <p className="text-lg font-bold text-[#B45309]">${unpaidTotal.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-[#ede8df]">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign size={11} className="text-[#16A34A]" />
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide">Paid</p>
          </div>
          <p className="text-lg font-bold text-[#16A34A]">${paidTotal.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {(["all", "unpaid", "paid"] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition-colors ${
              filter === f ? "bg-[#C9A96E] text-white" : "bg-white text-[#6b7280] border border-[#ede8df]"
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-[#ede8df] h-20 animate-pulse" />)}
        </div>
      )}

      {!loading && invoices.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-[#ede8df] shadow-sm text-center">
          <FileText size={32} className="text-[#C9A96E] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#1a1a1a] mb-1">No invoices yet</p>
          <p className="text-xs text-[#6b7280]">Invoices appear here when you complete jobs or create them manually.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map(inv => {
          const badge = STATUS_COLORS[inv.status];
          return (
            <Link key={inv.id} href={`/invoices/${inv.id}`}
              className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm active:scale-95 transition-transform">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="font-semibold text-[#1a1a1a] text-sm truncate">{inv.customerName}</p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: badge.bg, color: badge.color }}>
                  {badge.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#6b7280]">
                  {new Date(inv.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                </p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold text-[#A07840]">${inv.total.toFixed(2)}</p>
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

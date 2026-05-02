"use client";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Check, CalendarDays } from "lucide-react";
import { getCustomers, type Customer } from "@/lib/customers";
import { saveEstimate, calculateTotal, type LineItem } from "@/lib/estimates";

const SERVICE_SUGGESTIONS = [
  "Weekly Mowing", "Bi-Weekly Mowing", "Spring Cleanup", "Fall Cleanup",
  "Lawn Fertilization", "Hedge Trimming", "Aeration", "Overseeding",
  "Full Lawn Care Package", "Mulching", "Garden Bed Cleanup",
];

function NewEstimateForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const preselected  = searchParams.get("customer") ?? "";

  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [isPlan,     setIsPlan]     = useState(false);
  const [customerId, setCustomerId] = useState(preselected);
  const [items,      setItems]      = useState<LineItem[]>([{ description: "", qty: 1, price: 0 }]);
  const [notes,      setNotes]      = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [saving,     setSaving]     = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  useEffect(() => { getCustomers().then(setCustomers); }, []);

  const total = calculateTotal(items);
  const selectedCustomer = customers.find(c => c.id === customerId);

  function togglePlan(on: boolean) {
    setIsPlan(on);
    setItems(on
      ? [{ description: "Weekly Mowing (per cut)", qty: 23, price: 65 }]
      : [{ description: "", qty: 1, price: 0 }]
    );
    if (on) setNotes("Includes 23 weekly cuts. Auto-invoiced after each completed cut. Card on file required.");
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || items.every(i => !i.description) || !selectedCustomer) return;
    setSaving(true);
    try {
      await saveEstimate({
        customerId,
        customerName: selectedCustomer.name,
        description:  isPlan ? "23-Week Lawn Care Plan" : items.map(i => i.description).filter(Boolean).join(", "),
        items:        items.filter(i => i.description),
        notes,
        expiryDate,
        status:       "draft",
        isPlan,
        total,
      });
      setSubmitted(true);
      setTimeout(() => router.push("/estimates"), 1200);
    } catch {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <div className="w-16 h-16 rounded-full bg-[#F5ECD7] flex items-center justify-center">
          <Check size={32} color="#A07840" strokeWidth={2.5} />
        </div>
        <p className="text-lg font-bold text-[#1a1a1a]">{isPlan ? "Plan Estimate Created!" : "Estimate Created!"}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/estimates" className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <h1 className="text-xl font-bold text-[#1a1a1a]">New Estimate</h1>
      </div>

      {/* Plan toggle */}
      <div onClick={() => togglePlan(!isPlan)}
        className={`rounded-2xl p-4 border-2 flex items-center gap-3 cursor-pointer transition-colors ${
          isPlan ? "border-[#C9A96E] bg-[#F5ECD7]" : "border-[#ede8df] bg-white"
        }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPlan ? "bg-[#C9A96E]" : "bg-[#F5ECD7]"}`}>
          <CalendarDays size={20} color={isPlan ? "#fff" : "#A07840"} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#1a1a1a]">23-Week Lawn Care Plan</p>
          <p className="text-xs text-[#6b7280]">Auto-schedule weekly cuts · Auto-invoice each one</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          isPlan ? "bg-[#C9A96E] border-[#C9A96E]" : "border-gray-300"
        }`}>
          {isPlan && <Check size={11} color="#fff" strokeWidth={3} />}
        </div>
      </div>

      {/* Customer */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm">
        <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Customer *</label>
        <select value={customerId} onChange={e => setCustomerId(e.target.value)} required
          className="mt-2 w-full text-sm text-[#1a1a1a] outline-none bg-transparent">
          <option value="">Select a customer…</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {customers.length === 0 && (
          <Link href="/customers/new" className="text-xs text-[#C9A96E] font-semibold mt-2 inline-block">
            + Add a customer first
          </Link>
        )}
      </div>

      {/* Line items */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-3">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">
          {isPlan ? "Plan Pricing" : "Services & Pricing"}
        </p>

        {items.map((item, index) => (
          <div key={index} className="flex flex-col gap-2 pb-3 border-b border-[#ede8df] last:border-0 last:pb-0">
            <div className="flex gap-2 items-center">
              <input type="text" placeholder="e.g. Weekly Mowing" value={item.description}
                onChange={e => updateItem(index, "description", e.target.value)}
                list="service-suggestions"
                className="flex-1 text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
              {items.length > 1 && (
                <button type="button" onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}>
                  <Trash2 size={16} className="text-gray-300" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-[#6b7280]">{isPlan ? "Cuts" : "Qty"}</label>
                <input type="number" min={1} value={item.qty}
                  onChange={e => updateItem(index, "qty", Number(e.target.value))}
                  className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-[#6b7280]">$ / {isPlan ? "cut" : "unit"}</label>
                <input type="number" min={0} step={0.01} value={item.price}
                  onChange={e => updateItem(index, "price", Number(e.target.value))}
                  className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-[#6b7280]">Total</label>
                <p className="text-sm font-semibold text-[#A07840] px-3 py-2">${(item.qty * item.price).toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}

        <datalist id="service-suggestions">
          {SERVICE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
        </datalist>

        {!isPlan && (
          <button type="button" onClick={() => setItems(prev => [...prev, { description: "", qty: 1, price: 0 }])}
            className="flex items-center gap-1.5 text-sm text-[#C9A96E] font-semibold">
            <Plus size={16} /> Add Line Item
          </button>
        )}
      </div>

      <div className="bg-[#F5ECD7] rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#A07840]">{isPlan ? "Season Total" : "Estimate Total"}</p>
          {isPlan && <p className="text-xs text-[#A07840] opacity-70">Auto-invoiced per cut</p>}
        </div>
        <p className="text-xl font-bold text-[#A07840]">${total.toFixed(2)}</p>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-4">
        {!isPlan && (
          <div>
            <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Quote Valid Until</label>
            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
              className="mt-2 text-sm text-[#1a1a1a] outline-none bg-transparent" />
          </div>
        )}
        <div className={isPlan ? "" : "border-t border-[#ede8df] pt-4"}>
          <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Notes for Customer</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Describe scope of work, conditions, etc." rows={3}
            className="mt-2 w-full text-sm text-[#1a1a1a] outline-none bg-transparent resize-none placeholder:text-gray-300" />
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="bg-[#C9A96E] text-white rounded-2xl py-4 font-semibold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-40">
        {saving ? "Saving…" : isPlan ? "Create Plan Estimate" : "Save Estimate"}
      </button>
    </form>
  );
}

export default function NewEstimatePage() {
  return <Suspense><NewEstimateForm /></Suspense>;
}

"use client";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Check, CalendarDays, Layers } from "lucide-react";
import { getCustomers, type Customer } from "@/lib/customers";
import { saveEstimate, calculateTotal, makeOptionId, type LineItem, type EstimateOption } from "@/lib/estimates";
import { getSettings, type Settings } from "@/lib/settings";
import ServicePicker from "@/components/ServicePicker";

const TIER_LABELS = ["Good", "Better", "Best"];

function NewEstimateForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const preselected  = searchParams.get("customer") ?? "";

  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [settings,   setSettings]   = useState<Settings | null>(null);
  const [isPlan,     setIsPlan]     = useState(false);
  const [customerId, setCustomerId] = useState(preselected);
  const [tiered,     setTiered]     = useState(false);
  const [options,    setOptions]    = useState<EstimateOption[]>([
    { id: makeOptionId(), label: "Good", items: [{ description: "", qty: 1, price: 0 }] },
  ]);
  const [planItems,  setPlanItems]  = useState<LineItem[]>([{ description: "Weekly Mowing (per cut)", qty: 23, price: 65 }]);
  const [notes,      setNotes]      = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [saving,     setSaving]     = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  useEffect(() => { getCustomers().then(setCustomers); }, []);
  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      // Default plan items now reflect saved settings instead of hardcoded 23/$65
      setPlanItems([{
        description: "Weekly Mowing (per cut)",
        qty:         s.defaultPlanWeeks,
        price:       s.defaultCutPrice,
      }]);
    });
  }, []);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const planTotal       = calculateTotal(planItems);
  const optionsTotals   = options.map(o => calculateTotal(o.items));
  const headlineTotal   = isPlan ? planTotal : tiered ? Math.min(...optionsTotals.filter(t => t > 0), 0) : optionsTotals[0];

  function togglePlan(on: boolean) {
    setIsPlan(on);
    if (on) {
      setTiered(false);
      const weeks = settings?.defaultPlanWeeks ?? 23;
      setNotes(`Includes ${weeks} weekly cuts. Auto-invoiced after each completed cut. Card on file required.`);
    }
  }

  function addOption() {
    if (options.length >= 3) return;
    setOptions([...options, {
      id:    makeOptionId(),
      label: TIER_LABELS[options.length] ?? `Option ${options.length + 1}`,
      items: [{ description: "", qty: 1, price: 0 }],
    }]);
    setTiered(true);
  }

  function removeOption(optId: string) {
    const remaining = options.filter(o => o.id !== optId);
    setOptions(remaining);
    if (remaining.length <= 1) setTiered(false);
  }

  function updateOption(optId: string, updates: Partial<EstimateOption>) {
    setOptions(prev => prev.map(o => o.id === optId ? { ...o, ...updates } : o));
  }

  function updateItem(optId: string, index: number, field: keyof LineItem, value: string | number) {
    setOptions(prev => prev.map(o => o.id === optId
      ? { ...o, items: o.items.map((item, i) => i === index ? { ...item, [field]: value } : item) }
      : o
    ));
  }

  function addItem(optId: string) {
    setOptions(prev => prev.map(o => o.id === optId
      ? { ...o, items: [...o.items, { description: "", qty: 1, price: 0 }] }
      : o
    ));
  }

  function removeItem(optId: string, index: number) {
    setOptions(prev => prev.map(o => o.id === optId
      ? { ...o, items: o.items.filter((_, i) => i !== index) }
      : o
    ));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !selectedCustomer) return;
    setSaving(true);
    try {
      let payload;
      if (isPlan) {
        const weeks = planItems[0]?.qty ?? settings?.defaultPlanWeeks ?? 23;
        payload = {
          customerId,
          customerName: selectedCustomer.name,
          description:  `${weeks}-Week Lawn Care Plan`,
          items:        planItems,
          options:      null,
          selectedOptionId: null,
          notes,
          expiryDate,
          status:       "draft" as const,
          isPlan:       true,
          total:        planTotal,
        };
      } else if (tiered && options.length >= 2) {
        payload = {
          customerId,
          customerName: selectedCustomer.name,
          description:  `Estimate with ${options.length} options`,
          items:        [],
          options:      options.map(o => ({ ...o, items: o.items.filter(i => i.description) })),
          selectedOptionId: null,
          notes,
          expiryDate,
          status:       "draft" as const,
          isPlan:       false,
          total:        Math.max(...optionsTotals),
        };
      } else {
        const items = options[0].items.filter(i => i.description);
        payload = {
          customerId,
          customerName: selectedCustomer.name,
          description:  items.map(i => i.description).join(", "),
          items,
          options:      null,
          selectedOptionId: null,
          notes,
          expiryDate,
          status:       "draft" as const,
          isPlan:       false,
          total:        calculateTotal(items),
        };
      }
      await saveEstimate(payload);
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
        <p className="text-lg font-bold text-[#1a1a1a]">Estimate Created!</p>
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
          <p className="text-sm font-semibold text-[#1a1a1a]">
            {settings?.defaultPlanWeeks ?? 23}-Week Lawn Care Plan
          </p>
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

      {/* PLAN ITEMS — single set */}
      {isPlan && (
        <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-3">
          <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Plan Pricing</p>
          {planItems.map((item, index) => (
            <div key={index} className="flex flex-col gap-2 pb-3 border-b border-[#ede8df] last:border-0 last:pb-0">
              <input type="text" placeholder="e.g. Weekly Mowing" value={item.description}
                onChange={e => setPlanItems(prev => prev.map((it, i) => i === index ? { ...it, description: e.target.value } : it))}
                className="flex-1 text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-[#6b7280]">Cuts</label>
                  <input type="number" min={1} value={item.qty}
                    onChange={e => setPlanItems(prev => prev.map((it, i) => i === index ? { ...it, qty: Number(e.target.value) } : it))}
                    className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-[#6b7280]">$ / cut</label>
                  <input type="number" min={0} step={0.01} value={item.price}
                    onChange={e => setPlanItems(prev => prev.map((it, i) => i === index ? { ...it, price: Number(e.target.value) } : it))}
                    className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-[#6b7280]">Total</label>
                  <p className="text-sm font-semibold text-[#A07840] px-3 py-2">${(item.qty * item.price).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OPTION-BASED ESTIMATES */}
      {!isPlan && (
        <>
          {options.map((opt, optIdx) => (
            <div key={opt.id} className={`bg-white rounded-2xl p-4 border-2 shadow-sm flex flex-col gap-3 ${
              tiered ? "border-[#C9A96E]" : "border-[#ede8df]"
            }`}>
              <div className="flex items-center justify-between">
                {tiered ? (
                  <input type="text" value={opt.label}
                    onChange={e => updateOption(opt.id, { label: e.target.value })}
                    className="text-sm font-bold text-[#1a1a1a] bg-transparent outline-none border-b border-[#ede8df] focus:border-[#C9A96E] pb-0.5"
                  />
                ) : (
                  <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Services & Pricing</p>
                )}
                {tiered && options.length > 1 && (
                  <button type="button" onClick={() => removeOption(opt.id)} className="text-gray-300">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <ServicePicker onPick={s => {
                setOptions(prev => prev.map(o => o.id === opt.id
                  ? { ...o, items: [
                      ...o.items.filter(i => i.description),
                      { description: s.name, qty: s.defaultQty, price: s.defaultPrice }
                    ] }
                  : o
                ));
              }} />

              {opt.items.map((item, index) => (
                <div key={index} className="flex flex-col gap-2 pb-3 border-b border-[#ede8df] last:border-0 last:pb-0">
                  <div className="flex gap-2 items-center">
                    <input type="text" placeholder="Service description" value={item.description}
                      onChange={e => updateItem(opt.id, index, "description", e.target.value)}
                      className="flex-1 text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
                    {opt.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(opt.id, index)}>
                        <Trash2 size={16} className="text-gray-300" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <label className="text-[10px] text-[#6b7280]">Qty</label>
                      <input type="number" min={1} value={item.qty}
                        onChange={e => updateItem(opt.id, index, "qty", Number(e.target.value))}
                        className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-[#6b7280]">Price ($)</label>
                      <input type="number" min={0} step={0.01} value={item.price}
                        onChange={e => updateItem(opt.id, index, "price", Number(e.target.value))}
                        className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-[#6b7280]">Subtotal</label>
                      <p className="text-sm font-semibold text-[#A07840] px-3 py-2">${(item.qty * item.price).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between">
                <button type="button" onClick={() => addItem(opt.id)}
                  className="flex items-center gap-1.5 text-sm text-[#C9A96E] font-semibold">
                  <Plus size={16} /> Line Item
                </button>
                <p className="text-sm font-bold text-[#A07840]">
                  ${optionsTotals[optIdx].toFixed(2)}
                </p>
              </div>
            </div>
          ))}

          {/* Add another option button */}
          {options.length < 3 && (
            <button type="button" onClick={addOption}
              className="bg-[#F5ECD7] border-2 border-dashed border-[#C9A96E] text-[#A07840] rounded-2xl py-4 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Layers size={16} /> Add {options.length === 1 ? "Better/Best Option" : "Another Option"}
            </button>
          )}
        </>
      )}

      {/* Total */}
      <div className="bg-[#F5ECD7] rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#A07840]">
            {isPlan ? "Season Total" : tiered ? `${options.length} Options` : "Estimate Total"}
          </p>
          {isPlan && <p className="text-xs text-[#A07840] opacity-70">Auto-invoiced per cut</p>}
          {tiered && !isPlan && <p className="text-xs text-[#A07840] opacity-70">Customer picks one</p>}
        </div>
        <p className="text-xl font-bold text-[#A07840]">
          {tiered && !isPlan
            ? `$${Math.min(...optionsTotals).toFixed(0)}–$${Math.max(...optionsTotals).toFixed(0)}`
            : `$${headlineTotal.toFixed(2)}`}
        </p>
      </div>

      {/* Notes */}
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
        {saving ? "Saving…" : isPlan ? "Create Plan Estimate" : tiered ? `Save Estimate (${options.length} Options)` : "Save Estimate"}
      </button>
    </form>
  );
}

export default function NewEstimatePage() {
  return <Suspense><NewEstimateForm /></Suspense>;
}

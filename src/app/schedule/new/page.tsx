"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { saveJob } from "@/lib/jobs";
import { getCustomers, type Customer } from "@/lib/customers";

const SERVICE_TYPES = [
  "Weekly Mowing", "Bi-Weekly Mowing", "Lawn Fertilization",
  "Spring Cleanup", "Fall Cleanup", "Hedge Trimming",
  "Full Lawn Care Package", "Other",
];

function NewJobForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected  = searchParams.get("customer") ?? "";

  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(preselected);
  const [serviceType, setServiceType] = useState("");
  const [date,        setDate]        = useState("");
  const [time,        setTime]        = useState("");
  const [notes,       setNotes]       = useState("");
  const [saving,      setSaving]      = useState(false);
  const [submitted,   setSubmitted]   = useState(false);

  useEffect(() => { getCustomers().then(setCustomers); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !serviceType || !date) return;
    const c = customers.find(x => x.id === customerId);
    if (!c) return;
    setSaving(true);
    try {
      await saveJob({
        customerName:  c.name,
        customerId:    c.id,
        customerPhone: c.phone,
        address:       c.address,
        service:       serviceType,
        date,
        time,
        notes,
        status:        "scheduled",
        isPlan:        false,
      });
      setSubmitted(true);
      setTimeout(() => router.push("/schedule"), 1200);
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
        <p className="text-lg font-bold text-[#1a1a1a]">Job Scheduled!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-1">
        <Link href={preselected ? `/customers/${preselected}` : "/schedule"}
          className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <h1 className="text-xl font-bold text-[#1a1a1a]">Schedule a Job</h1>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-1">
        <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Customer *</label>
        <select value={customerId} onChange={e => setCustomerId(e.target.value)} required
          className="mt-1 w-full text-sm text-[#1a1a1a] outline-none bg-transparent">
          <option value="">Select a customer…</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {customers.length === 0 && (
          <Link href="/customers/new" className="text-xs text-[#C9A96E] font-semibold mt-1">
            + Add a customer first
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-1">
        <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Service Type *</label>
        <select value={serviceType} onChange={e => setServiceType(e.target.value)} required
          className="mt-1 w-full text-sm text-[#1a1a1a] outline-none bg-transparent">
          <option value="">Select a service…</option>
          {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Date *</label>
          <input type="date" value={date} required onChange={e => setDate(e.target.value)}
            className="mt-1 text-sm text-[#1a1a1a] outline-none bg-transparent" />
        </div>
        <div className="border-t border-[#ede8df]" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Time</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className="mt-1 text-sm text-[#1a1a1a] outline-none bg-transparent" />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-1">
        <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Anything to know for this job…" rows={3}
          className="mt-1 text-sm text-[#1a1a1a] outline-none bg-transparent resize-none placeholder:text-gray-300" />
      </div>

      <button type="submit" disabled={saving}
        className="bg-[#C9A96E] text-white rounded-2xl py-4 font-semibold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-40">
        {saving ? "Saving…" : "Schedule Job"}
      </button>
    </form>
  );
}

export default function NewJobPage() {
  return <Suspense><NewJobForm /></Suspense>;
}

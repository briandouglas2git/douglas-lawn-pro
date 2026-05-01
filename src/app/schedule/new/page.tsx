"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Suspense } from "react";

const CUSTOMERS: Record<string, string> = {
  "1": "John Miller",
  "2": "Sarah Thompson",
  "3": "Mike Arsenault",
};

const SERVICE_TYPES = [
  "Weekly Mowing",
  "Bi-Weekly Mowing",
  "Lawn Fertilization",
  "Spring Cleanup",
  "Fall Cleanup",
  "Hedge Trimming",
  "Full Lawn Care Package",
  "Other",
];

function NewJobForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomer = searchParams.get("customer") ?? "";

  const [customerId, setCustomerId] = useState(preselectedCustomer);
  const [serviceType, setServiceType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !serviceType || !date) return;
    // Will save to Supabase in a future phase
    setSubmitted(true);
    setTimeout(() => router.push("/schedule"), 1500);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <div className="w-16 h-16 rounded-full bg-[#F5ECD7] flex items-center justify-center">
          <Check size={32} color="#A07840" strokeWidth={2.5} />
        </div>
        <p className="text-lg font-bold text-[#1a1a1a]">Job Scheduled!</p>
        <p className="text-sm text-[#6b7280]">Redirecting to schedule…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-1">
        <Link
          href={preselectedCustomer ? `/customers/${preselectedCustomer}` : "/schedule"}
          className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <h1 className="text-xl font-bold text-[#1a1a1a]">Schedule a Job</h1>
      </div>

      {/* Customer */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-1">
        <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Customer *</label>
        <select
          value={customerId}
          onChange={e => setCustomerId(e.target.value)}
          required
          className="mt-1 w-full text-sm text-[#1a1a1a] outline-none bg-transparent"
        >
          <option value="">Select a customer…</option>
          {Object.entries(CUSTOMERS).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      {/* Service type */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-1">
        <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Service Type *</label>
        <select
          value={serviceType}
          onChange={e => setServiceType(e.target.value)}
          required
          className="mt-1 w-full text-sm text-[#1a1a1a] outline-none bg-transparent"
        >
          <option value="">Select a service…</option>
          {SERVICE_TYPES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Date & time */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Date *</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="mt-1 text-sm text-[#1a1a1a] outline-none bg-transparent"
          />
        </div>
        <div className="border-t border-[#ede8df]" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Time</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="mt-1 text-sm text-[#1a1a1a] outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-1">
        <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anything to know for this job…"
          rows={3}
          className="mt-1 text-sm text-[#1a1a1a] outline-none bg-transparent resize-none placeholder:text-gray-300"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="bg-[#C9A96E] text-white rounded-2xl py-4 font-semibold text-sm shadow-md active:scale-95 transition-transform"
      >
        Schedule Job
      </button>
    </form>
  );
}

export default function NewJobPage() {
  return (
    <Suspense>
      <NewJobForm />
    </Suspense>
  );
}

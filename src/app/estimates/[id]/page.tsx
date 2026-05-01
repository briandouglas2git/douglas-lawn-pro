"use client";
import { useState } from "react";
import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft, User, CalendarDays, CreditCard, Check,
  ChevronDown, ChevronUp, Send, Clock
} from "lucide-react";

const SAMPLE_ESTIMATES: Record<string, {
  customerName: string;
  customerId: string;
  customerPhone: string;
  description: string;
  items: { description: string; qty: number; price: number }[];
  notes: string;
  expiryDate: string;
  status: string;
}> = {
  "est1": {
    customerName:  "John Miller",
    customerId:    "1",
    customerPhone: "(519) 555-0101",
    description:   "Spring cleanup + fertilization",
    items: [
      { description: "Spring Cleanup",    qty: 1, price: 150 },
      { description: "Lawn Fertilization", qty: 1, price: 85  },
      { description: "Edge Trimming",     qty: 1, price: 50  },
    ],
    notes:      "Includes removal of all debris. Gate access required.",
    expiryDate: "May 15, 2026",
    status:     "Sent",
  },
  "est2": {
    customerName:  "Sarah Thompson",
    customerId:    "2",
    customerPhone: "(519) 555-0182",
    description:   "Full lawn care package",
    items: [
      { description: "Weekly Mowing (monthly)", qty: 4,  price: 65  },
      { description: "Fertilization",           qty: 1,  price: 85  },
      { description: "Hedge Trimming",          qty: 1,  price: 75  },
    ],
    notes:      "Monthly billing available. First cut includes full edge cleanup.",
    expiryDate: "May 20, 2026",
    status:     "Draft",
  },
};

const SERVICE_TYPES = [
  "Weekly Mowing", "Bi-Weekly Mowing", "Spring Cleanup", "Fall Cleanup",
  "Lawn Fertilization", "Hedge Trimming", "Full Lawn Care Package", "Other",
];

type BookingMode = null | "now" | "later";

export default function EstimateDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const est = SAMPLE_ESTIMATES[id];

  const [bookingMode, setBookingMode] = useState<BookingMode>(null);
  const [date,        setDate]        = useState("");
  const [time,        setTime]        = useState("");
  const [deposit,     setDeposit]     = useState("");
  const [booked,      setBooked]      = useState(false);
  const [sending,     setSending]     = useState(false);
  const [toast,       setToast]       = useState("");

  if (!est) {
    return <div className="p-4"><p className="text-[#6b7280]">Estimate not found.</p></div>;
  }

  const total = est.items.reduce((sum, i) => sum + i.qty * i.price, 0);

  async function sendEstimate() {
    setSending(true);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "estimate",
          customerName:  est.customerName,
          customerPhone: est.customerPhone,
          total,
        }),
      });
      const data = await res.json();
      setToast(data.preview ? `Preview: "${data.message}"` : "Estimate sent to customer!");
    } catch {
      setToast("Could not send.");
    } finally {
      setSending(false);
      setTimeout(() => setToast(""), 5000);
    }
  }

  function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setBooked(true);
  }

  if (booked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <div className="w-16 h-16 rounded-full bg-[#F5ECD7] flex items-center justify-center">
          <Check size={32} color="#A07840" strokeWidth={2.5} />
        </div>
        <p className="text-lg font-bold text-[#1a1a1a]">Job Booked!</p>
        <p className="text-sm text-[#6b7280] text-center">
          {bookingMode === "now"
            ? `Payment of $${Number(deposit || 0).toFixed(2)} collected. Job scheduled for ${date}.`
            : `Job scheduled for ${date}. Payment due on completion.`}
        </p>
        <div className="flex gap-3 mt-2">
          <Link href="/schedule" className="bg-[#C9A96E] text-white rounded-2xl px-5 py-3 text-sm font-semibold">
            View Schedule
          </Link>
          <Link href="/estimates" className="bg-white border border-[#ede8df] text-[#A07840] rounded-2xl px-5 py-3 text-sm font-semibold">
            Back to Estimates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/estimates" className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#1a1a1a]">{est.description}</h1>
          <span className="text-xs font-semibold text-[#B45309]">{est.status}</span>
        </div>
      </div>

      {/* Customer */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-2">Customer</p>
        <Link href={`/customers/${est.customerId}`} className="flex items-center gap-2 text-sm text-[#1a1a1a]">
          <User size={15} className="text-[#C9A96E]" /> {est.customerName}
        </Link>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-3">Scope of Work</p>
        <div className="flex flex-col gap-2">
          {est.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-[#1a1a1a]">{item.description} {item.qty > 1 ? `×${item.qty}` : ""}</span>
              <span className="font-semibold text-[#A07840]">${(item.qty * item.price).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[#ede8df] mt-3 pt-3 flex items-center justify-between">
          <span className="text-sm font-bold text-[#1a1a1a]">Total</span>
          <span className="text-lg font-bold text-[#A07840]">${total.toFixed(2)}</span>
        </div>
        {est.expiryDate && (
          <p className="text-xs text-[#6b7280] mt-2 flex items-center gap-1">
            <Clock size={11} /> Quote valid until {est.expiryDate}
          </p>
        )}
      </div>

      {/* Notes */}
      {est.notes && (
        <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
          <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-2">Notes</p>
          <p className="text-sm text-[#6b7280]">{est.notes}</p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="bg-[#F5ECD7] border border-[#C9A96E] rounded-2xl p-3 mb-4 text-sm text-[#A07840]">
          {toast}
        </div>
      )}

      {/* Send to customer */}
      <button
        onClick={sendEstimate}
        disabled={sending}
        className="w-full bg-white border border-[#C9A96E] text-[#A07840] rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 mb-3 active:scale-95 transition-transform disabled:opacity-60"
      >
        <Send size={16} />
        {sending ? "Sending…" : "Send Estimate to Customer"}
      </button>

      {/* ── BOOKING OPTIONS ─────────────────────── */}
      <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide text-center mb-3">
        Book This Job
      </p>

      {/* Book with payment now */}
      <div className="bg-white rounded-2xl border border-[#ede8df] shadow-sm mb-3 overflow-hidden">
        <button
          type="button"
          onClick={() => setBookingMode(bookingMode === "now" ? null : "now")}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F5ECD7] flex items-center justify-center">
              <CreditCard size={18} color="#A07840" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1a1a1a]">Book with Payment Now</p>
              <p className="text-xs text-[#6b7280]">Collect a deposit or full payment</p>
            </div>
          </div>
          {bookingMode === "now" ? <ChevronUp size={16} className="text-[#C9A96E]" /> : <ChevronDown size={16} className="text-gray-300" />}
        </button>

        {bookingMode === "now" && (
          <form onSubmit={handleBook} className="px-4 pb-4 flex flex-col gap-3 border-t border-[#ede8df] pt-4">
            <div>
              <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Job Date *</label>
              <input
                type="date" value={date} required
                onChange={e => setDate(e.target.value)}
                className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Time</label>
              <input
                type="time" value={time}
                onChange={e => setTime(e.target.value)}
                className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Amount Collected ($)</label>
              <input
                type="number" min={0} step={0.01}
                value={deposit} placeholder={total.toFixed(2)}
                onChange={e => setDeposit(e.target.value)}
                className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]"
              />
              <p className="text-[10px] text-[#6b7280] mt-1">Leave blank to use full estimate total</p>
            </div>
            <button
              type="submit"
              className="bg-[#A07840] text-white rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <CreditCard size={16} /> Confirm Payment & Book Job
            </button>
          </form>
        )}
      </div>

      {/* Book for later */}
      <div className="bg-white rounded-2xl border border-[#ede8df] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setBookingMode(bookingMode === "later" ? null : "later")}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F5ECD7] flex items-center justify-center">
              <CalendarDays size={18} color="#A07840" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1a1a1a]">Book for a Later Date</p>
              <p className="text-xs text-[#6b7280]">Schedule now, collect payment on completion</p>
            </div>
          </div>
          {bookingMode === "later" ? <ChevronUp size={16} className="text-[#C9A96E]" /> : <ChevronDown size={16} className="text-gray-300" />}
        </button>

        {bookingMode === "later" && (
          <form onSubmit={handleBook} className="px-4 pb-4 flex flex-col gap-3 border-t border-[#ede8df] pt-4">
            <div>
              <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Job Date *</label>
              <input
                type="date" value={date} required
                onChange={e => setDate(e.target.value)}
                className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Time</label>
              <input
                type="time" value={time}
                onChange={e => setTime(e.target.value)}
                className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]"
              />
            </div>
            <div className="bg-[#FAFAF7] rounded-xl p-3 text-xs text-[#6b7280]">
              Payment of <span className="font-semibold text-[#A07840]">${total.toFixed(2)}</span> will be collected on completion.
            </div>
            <button
              type="submit"
              className="bg-[#C9A96E] text-white rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <CalendarDays size={16} /> Schedule Job
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

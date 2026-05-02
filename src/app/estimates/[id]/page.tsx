"use client";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft, User, CalendarDays, CreditCard, Check,
  ChevronDown, ChevronUp, Send, Clock, Repeat, Lock, Trash2,
} from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
import { saveJob, saveJobs, type Job } from "@/lib/jobs";
import { getEstimate, updateEstimateStatus, deleteEstimate, type Estimate } from "@/lib/estimates";
import { getCustomer, type Customer } from "@/lib/customers";
import { useRouter } from "next/navigation";

function generateWeeklyDates(startDate: string, count: number): string[] {
  const dates: string[] = [];
  const d = new Date(startDate + "T12:00:00");
  for (let i = 0; i < count; i++) {
    dates.push(d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", year: "numeric" }));
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

type BookingMode = null | "now" | "later";

export default function EstimateDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = use(params);
  const router   = useRouter();

  const [est,           setEst]           = useState<Estimate | null>(null);
  const [customer,      setCustomer]      = useState<Customer | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [bookingMode,   setBookingMode]   = useState<BookingMode>(null);
  const [startDate,     setStartDate]     = useState("");
  const [time,          setTime]          = useState("");
  const [deposit,       setDeposit]       = useState("");
  const [signature,     setSignature]     = useState<string | null>(null);
  const [cardNumber,    setCardNumber]    = useState("");
  const [cardExpiry,    setCardExpiry]    = useState("");
  const [cardCvc,       setCardCvc]       = useState("");
  const [showAllDates,  setShowAllDates]  = useState(false);
  const [booked,        setBooked]        = useState(false);
  const [sending,       setSending]       = useState(false);
  const [toast,         setToast]         = useState("");

  const handleSig = useCallback((v: string | null) => setSignature(v), []);

  useEffect(() => {
    getEstimate(id).then(async e => {
      setEst(e);
      if (e?.customerId) {
        const c = await getCustomer(e.customerId);
        setCustomer(c);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-4"><div className="bg-white rounded-2xl h-32 animate-pulse" /></div>;
  if (!est)    return <div className="p-4"><p className="text-[#6b7280]">Estimate not found.</p></div>;

  const total       = est.total;
  const perCut      = est.isPlan ? est.items[0]?.price ?? 0 : 0;
  const totalCuts   = est.isPlan ? est.items[0]?.qty   ?? 0 : 0;
  const scheduledDates = est.isPlan && startDate ? generateWeeklyDates(startDate, totalCuts) : [];
  const previewDates   = showAllDates ? scheduledDates : scheduledDates.slice(0, 4);

  async function handleDelete() {
    if (!confirm("Delete this estimate?")) return;
    await deleteEstimate(id);
    router.push("/estimates");
  }

  async function sendEstimate() {
    if (!est || !customer?.phone) {
      setToast("Customer phone number missing.");
      setTimeout(() => setToast(""), 4000);
      return;
    }
    setSending(true);
    try {
      const res  = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "estimate", customerName: est.customerName, customerPhone: customer.phone, total }),
      });
      const data = await res.json();
      await updateEstimateStatus(id, "sent");
      setEst(prev => prev ? { ...prev, status: "sent" } : prev);
      setToast(data.preview ? `Preview: "${data.message}"` : "Estimate sent!");
    } catch { setToast("Could not send."); }
    finally { setSending(false); setTimeout(() => setToast(""), 5000); }
  }

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!est || !startDate) return;
    if (est.isPlan && (!signature || !cardNumber)) return;

    const customerInfo = {
      customerName:  est.customerName,
      customerId:    est.customerId,
      customerPhone: customer?.phone ?? "",
      address:       customer?.address ?? "",
    };

    if (est.isPlan) {
      const d = new Date(startDate + "T12:00:00");
      const planJobs: Omit<Job, "id">[] = Array.from({ length: totalCuts }, (_, i) => {
        const jobDate = new Date(d);
        jobDate.setDate(jobDate.getDate() + i * 7);
        return {
          ...customerInfo,
          service:       est.items[0].description,
          date:          jobDate.toISOString().split("T")[0],
          time:          time || "",
          notes:         est.notes,
          status:        "scheduled" as const,
          isPlan:        true,
          planCutNumber: i + 1,
          planTotalCuts: totalCuts,
          pricePerCut:   perCut,
        };
      });
      await saveJobs(planJobs);
    } else {
      await saveJob({
        ...customerInfo,
        service:  est.description,
        date:     startDate,
        time:     time || "",
        notes:    est.notes,
        status:   "scheduled" as const,
        isPlan:   false,
      });
    }

    await updateEstimateStatus(id, "booked");
    setBooked(true);
  }

  if (booked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F5ECD7] flex items-center justify-center">
          <Check size={32} color="#A07840" strokeWidth={2.5} />
        </div>
        <p className="text-lg font-bold text-[#1a1a1a]">{est.isPlan ? "Plan Activated!" : "Job Booked!"}</p>
        <p className="text-sm text-[#6b7280] max-w-xs">
          {est.isPlan
            ? `${totalCuts} weekly cuts scheduled starting ${startDate}. You'll be auto-invoiced $${perCut.toFixed(2)} after each completed cut.`
            : bookingMode === "now"
              ? `Payment of $${Number(deposit || total).toFixed(2)} collected. Scheduled for ${startDate}.`
              : `Scheduled for ${startDate}. Payment due on completion.`}
        </p>
        <div className="flex gap-3 mt-2">
          <Link href="/schedule" className="bg-[#C9A96E] text-white rounded-2xl px-5 py-3 text-sm font-semibold">
            View Schedule
          </Link>
          <Link href="/estimates" className="bg-white border border-[#ede8df] text-[#A07840] rounded-2xl px-5 py-3 text-sm font-semibold">
            Estimates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/estimates" className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#1a1a1a]">{est.description}</h1>
          {est.isPlan
            ? <span className="text-xs font-semibold text-[#A07840] flex items-center gap-1"><Repeat size={11} /> Seasonal Plan</span>
            : <span className="text-xs font-semibold text-[#B45309] capitalize">{est.status}</span>}
        </div>
        <button onClick={handleDelete} className="text-gray-300">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-2">Customer</p>
        <Link href={`/customers/${est.customerId}`} className="flex items-center gap-2 text-sm text-[#1a1a1a]">
          <User size={15} className="text-[#C9A96E]" /> {est.customerName}
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-3">
          {est.isPlan ? "Plan Details" : "Scope of Work"}
        </p>
        {est.isPlan ? (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between"><span className="text-[#6b7280]">Cuts per season</span><span className="font-semibold text-[#1a1a1a]">{totalCuts} weeks</span></div>
            <div className="flex justify-between"><span className="text-[#6b7280]">Price per cut</span><span className="font-semibold text-[#1a1a1a]">${perCut.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-[#6b7280]">Billing</span><span className="font-semibold text-[#1a1a1a]">Auto after each cut</span></div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {est.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-[#1a1a1a]">{item.description}{item.qty > 1 ? ` ×${item.qty}` : ""}</span>
                <span className="font-semibold text-[#A07840]">${(item.qty * item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-[#ede8df] mt-3 pt-3 flex items-center justify-between">
          <span className="text-sm font-bold text-[#1a1a1a]">{est.isPlan ? "Season Total" : "Total"}</span>
          <span className="text-lg font-bold text-[#A07840]">${total.toFixed(2)}</span>
        </div>
        {est.expiryDate && (
          <p className="text-xs text-[#6b7280] mt-2 flex items-center gap-1">
            <Clock size={11} /> Valid until {new Date(est.expiryDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {est.notes && (
        <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
          <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-2">Notes</p>
          <p className="text-sm text-[#6b7280]">{est.notes}</p>
        </div>
      )}

      {toast && (
        <div className="bg-[#F5ECD7] border border-[#C9A96E] rounded-2xl p-3 mb-4 text-sm text-[#A07840]">{toast}</div>
      )}

      <button onClick={sendEstimate} disabled={sending}
        className="w-full bg-white border border-[#C9A96E] text-[#A07840] rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 mb-3 active:scale-95 transition-transform disabled:opacity-60">
        <Send size={16} /> {sending ? "Sending…" : "Send Estimate to Customer"}
      </button>

      <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide text-center mb-3">
        {est.isPlan ? "Activate Plan" : "Book This Job"}
      </p>

      {est.isPlan ? (
        <form onSubmit={handleBook} className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm">
            <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">First Cut Date *</label>
            <input type="date" value={startDate} required onChange={e => setStartDate(e.target.value)}
              className="mt-2 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />

            {scheduledDates.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-2 flex items-center gap-1">
                  <CalendarDays size={11} /> {totalCuts} Scheduled Cuts
                </p>
                <div className="flex flex-col gap-1.5">
                  {previewDates.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#6b7280]">Cut {i + 1}</span>
                      <span className="font-medium text-[#1a1a1a]">{d}</span>
                      <span className="text-[#A07840] font-semibold">${perCut.toFixed(2)}</span>
                    </div>
                  ))}
                  {scheduledDates.length > 4 && (
                    <button type="button" onClick={() => setShowAllDates(v => !v)}
                      className="text-xs text-[#C9A96E] font-semibold mt-1 flex items-center gap-1 self-center">
                      {showAllDates ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show all {totalCuts} dates</>}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm">
            <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-1">Customer Signature *</p>
            <p className="text-xs text-[#6b7280] mb-3">
              By signing, customer authorizes Douglas Landscaping Co. to perform the services and charge the card on file after each completed cut.
            </p>
            <SignaturePad onChange={handleSig} />
            {!signature && <p className="text-xs text-red-400 mt-1">Signature required</p>}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm">
            <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Lock size={11} /> Card on File *
            </p>
            <p className="text-xs text-[#6b7280] mb-3">Charged ${perCut.toFixed(2)} automatically after each completed cut.</p>
            <div className="flex flex-col gap-2">
              <input type="text" placeholder="Card number" value={cardNumber} maxLength={19} required
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                  setCardNumber(v.replace(/(.{4})/g, "$1 ").trim());
                }}
                className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E] font-mono tracking-widest" />
              <div className="flex gap-2">
                <input type="text" placeholder="MM / YY" value={cardExpiry} maxLength={7} required
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setCardExpiry(v.length > 2 ? v.slice(0, 2) + " / " + v.slice(2) : v);
                  }}
                  className="flex-1 text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
                <input type="text" placeholder="CVC" value={cardCvc} maxLength={3} required
                  onChange={e => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  className="flex-1 text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
              </div>
              <p className="text-[10px] text-[#6b7280] flex items-center gap-1">
                <Lock size={9} /> Card stored securely via Stripe when connected.
              </p>
            </div>
          </div>

          <button type="submit" disabled={!signature || !cardNumber || !startDate}
            className="bg-[#C9A96E] text-white rounded-2xl py-4 font-semibold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2">
            <Repeat size={16} /> Activate {totalCuts}-Week Plan
          </button>
        </form>

      ) : (
        <>
          <div className="bg-white rounded-2xl border border-[#ede8df] shadow-sm mb-3 overflow-hidden">
            <button type="button" onClick={() => setBookingMode(bookingMode === "now" ? null : "now")}
              className="w-full flex items-center justify-between p-4 text-left">
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
                  <input type="date" value={startDate} required onChange={e => setStartDate(e.target.value)}
                    className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Time</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Amount Collected ($)</label>
                  <input type="number" min={0} step={0.01} value={deposit} placeholder={total.toFixed(2)}
                    onChange={e => setDeposit(e.target.value)}
                    className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-2 block">Customer Signature</label>
                  <SignaturePad onChange={handleSig} />
                </div>
                <button type="submit" className="bg-[#A07840] text-white rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <CreditCard size={16} /> Confirm Payment & Book
                </button>
              </form>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#ede8df] shadow-sm overflow-hidden">
            <button type="button" onClick={() => setBookingMode(bookingMode === "later" ? null : "later")}
              className="w-full flex items-center justify-between p-4 text-left">
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
                  <input type="date" value={startDate} required onChange={e => setStartDate(e.target.value)}
                    className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Time</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
                </div>
                <div className="bg-[#FAFAF7] rounded-xl p-3 text-xs text-[#6b7280]">
                  Payment of <span className="font-semibold text-[#A07840]">${total.toFixed(2)}</span> due on completion.
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-2 block">Customer Signature</label>
                  <SignaturePad onChange={handleSig} />
                </div>
                <button type="submit" className="bg-[#C9A96E] text-white rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <CalendarDays size={16} /> Schedule Job
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}

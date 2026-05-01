"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Navigation, MapPin, CheckCircle2, Phone, User, Wrench, Clock, Timer } from "lucide-react";
import { use } from "react";
import { getJob, updateJobStatus, type Job } from "@/lib/jobs";

const STATUS_LABELS = {
  scheduled:  { label: "Scheduled",  bg: "#F5ECD7", color: "#A07840" },
  en_route:   { label: "En Route",   bg: "#FEF3C7", color: "#B45309" },
  arrived:    { label: "Arrived",    bg: "#DCFCE7", color: "#16A34A" },
  completed:  { label: "Completed",  bg: "#F0FDF4", color: "#15803D" },
};

type Status = keyof typeof STATUS_LABELS;

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  return `${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
}

function LiveTimer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return <span className="font-mono tabular-nums">{fmt(elapsed)}</span>;
}

export default function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [job,          setJob]          = useState<Job | null>(null);
  const [status,       setStatus]       = useState<Status>("scheduled");
  const [sending,      setSending]      = useState(false);
  const [toast,        setToast]        = useState("");
  const [dispatchedAt, setDispatchedAt] = useState<number | null>(null);
  const [arrivedAt,    setArrivedAt]    = useState<number | null>(null);
  const [completedAt,  setCompletedAt]  = useState<number | null>(null);

  useEffect(() => {
    getJob(id).then(found => {
      setJob(found);
      if (found) setStatus(found.status as Status);
    });
  }, [id]);

  const travelDuration = arrivedAt && dispatchedAt ? Math.floor((arrivedAt - dispatchedAt) / 1000) : null;
  const jobDuration    = completedAt && arrivedAt  ? Math.floor((completedAt - arrivedAt) / 1000)   : null;

  if (!job) {
    return (
      <div className="p-4">
        <p className="text-[#6b7280]">Job not found.</p>
      </div>
    );
  }

  const initial = job;

  async function notify(type: "dispatch" | "arrive") {
    setSending(true);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, customerName: initial.customerName, customerPhone: initial.customerPhone }),
      });
      const data = await res.json();
      setToast(data.preview ? `Preview: "${data.message}"` : type === "dispatch" ? "Dispatch text sent!" : "Arrival text sent!");
    } catch {
      setToast("Could not send message.");
    } finally {
      setSending(false);
      setTimeout(() => setToast(""), 5000);
    }
  }

  async function handleDispatch() {
    setDispatchedAt(Date.now());
    setStatus("en_route");
    updateJobStatus(id, "en_route");
    await notify("dispatch");
  }

  async function handleArrive() {
    setArrivedAt(Date.now());
    setStatus("arrived");
    updateJobStatus(id, "arrived");
    await notify("arrive");
  }

  function handleComplete() {
    setCompletedAt(Date.now());
    setStatus("completed");
    updateJobStatus(id, "completed");
  }

  const badge = STATUS_LABELS[status];

  return (
    <div className="p-4">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/schedule" className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#1a1a1a]">{initial.service}</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Time tracker */}
      {dispatchedAt && (
        <div className="bg-white rounded-2xl border border-[#ede8df] shadow-sm mb-4 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide flex items-center gap-1.5">
              <Timer size={12} /> Time Tracker
            </p>
          </div>

          {/* Travel time row */}
          <div className="px-4 py-3 flex items-center justify-between border-t border-[#ede8df]">
            <div className="flex items-center gap-2">
              <Navigation size={14} className="text-[#B45309]" />
              <span className="text-sm text-[#6b7280]">Drive time</span>
            </div>
            <span className="text-sm font-semibold text-[#B45309]">
              {travelDuration !== null
                ? fmt(travelDuration)
                : <LiveTimer startedAt={dispatchedAt} />}
            </span>
          </div>

          {/* Job time row — only shows after arrival */}
          {arrivedAt && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-[#ede8df]">
              <div className="flex items-center gap-2">
                <Wrench size={14} className="text-[#16A34A]" />
                <span className="text-sm text-[#6b7280]">Job time</span>
              </div>
              <span className="text-sm font-semibold text-[#16A34A]">
                {jobDuration !== null
                  ? fmt(jobDuration)
                  : <LiveTimer startedAt={arrivedAt} />}
              </span>
            </div>
          )}

          {/* Total — only shows when complete */}
          {jobDuration !== null && travelDuration !== null && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-[#ede8df] bg-[#FAFAF7]">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#A07840]" />
                <span className="text-sm font-semibold text-[#A07840]">Total</span>
              </div>
              <span className="text-sm font-bold text-[#A07840]">
                {fmt(travelDuration + jobDuration)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Customer */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-3">Customer</p>
        <div className="flex flex-col gap-2.5">
          <Link href={`/customers/${initial.customerId}`} className="flex items-center gap-3 text-sm text-[#1a1a1a]">
            <User size={16} className="text-[#C9A96E]" /> {initial.customerName}
          </Link>
          <a href={`tel:${initial.customerPhone}`} className="flex items-center gap-3 text-sm text-[#1a1a1a]">
            <Phone size={16} className="text-[#C9A96E]" /> {initial.customerPhone}
          </a>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(initial.address)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-[#1a1a1a]"
          >
            <MapPin size={16} className="text-[#C9A96E]" /> {initial.address}
          </a>
        </div>
      </div>

      {/* Job details */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-3">Job Details</p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3 text-sm text-[#1a1a1a]">
            <Wrench size={16} className="text-[#C9A96E]" /> {initial.service}
          </div>
          <div className="flex items-center gap-3 text-sm text-[#1a1a1a]">
            <Clock size={16} className="text-[#C9A96E]" /> {initial.date} at {initial.time}
          </div>
        </div>
        {initial.notes && (
          <p className="mt-3 text-sm text-[#6b7280] border-t border-[#ede8df] pt-3">{initial.notes}</p>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="bg-[#F5ECD7] border border-[#C9A96E] rounded-2xl p-3 mb-4 text-sm text-[#A07840]">
          {toast}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        {status === "scheduled" && (
          <button
            onClick={handleDispatch} disabled={sending}
            className="bg-[#C9A96E] text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform disabled:opacity-60"
          >
            <Navigation size={18} />
            {sending ? "Sending…" : "Dispatch — Text Customer"}
          </button>
        )}

        {status === "en_route" && (
          <button
            onClick={handleArrive} disabled={sending}
            className="bg-[#A07840] text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform disabled:opacity-60"
          >
            <MapPin size={18} />
            {sending ? "Sending…" : "Arrived — Text Customer"}
          </button>
        )}

        {status === "arrived" && (
          <button
            onClick={handleComplete}
            className="bg-[#16A34A] text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
          >
            <CheckCircle2 size={18} />
            Mark as Completed
          </button>
        )}

        {status === "completed" && (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl py-4 flex items-center justify-center gap-2 text-[#15803D] font-semibold text-sm">
            <CheckCircle2 size={18} /> Job Completed
          </div>
        )}

        <Link
          href={`/invoices/new?customer=${initial.customerId}`}
          className="bg-white border border-[#ede8df] text-[#A07840] rounded-2xl py-4 font-semibold text-sm flex items-center justify-center shadow-sm active:scale-95 transition-transform"
        >
          Create Invoice for This Job
        </Link>
      </div>
    </div>
  );
}

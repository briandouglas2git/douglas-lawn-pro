"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft, Navigation, MapPin, CheckCircle2, Phone, User, Wrench, Clock, Timer, FileText, Camera,
} from "lucide-react";
import { getJob, updateJobStatus, setJobInvoice, type Job } from "@/lib/jobs";
import { saveInvoice } from "@/lib/invoices";
import JobPhotoSlot from "@/components/JobPhotoSlot";

const STATUS_LABELS = {
  scheduled: { label: "Scheduled", bg: "#F5ECD7", color: "#A07840" },
  en_route:  { label: "En Route",  bg: "#FEF3C7", color: "#B45309" },
  arrived:   { label: "Arrived",   bg: "#DCFCE7", color: "#16A34A" },
  completed: { label: "Completed", bg: "#F0FDF4", color: "#15803D" },
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
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - startedAt) / 1000));
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return <span className="font-mono tabular-nums">{fmt(elapsed)}</span>;
}

export default function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [job,     setJob]     = useState<Job | null>(null);
  const [status,  setStatus]  = useState<Status>("scheduled");
  const [sending, setSending] = useState(false);
  const [toast,   setToast]   = useState("");

  useEffect(() => {
    getJob(id).then(found => {
      setJob(found);
      if (found) setStatus(found.status as Status);
    });
  }, [id]);

  if (!job) {
    return <div className="p-4"><div className="bg-white rounded-2xl h-32 animate-pulse" /></div>;
  }

  const dispatchedAt = job.dispatchedAt ? new Date(job.dispatchedAt).getTime() : null;
  const arrivedAt    = job.arrivedAt    ? new Date(job.arrivedAt).getTime()    : null;
  const completedAt  = job.completedAt  ? new Date(job.completedAt).getTime()  : null;

  const travelDuration = arrivedAt && dispatchedAt ? Math.floor((arrivedAt - dispatchedAt) / 1000) : null;
  const jobDuration    = completedAt && arrivedAt  ? Math.floor((completedAt - arrivedAt) / 1000)   : null;

  async function notify(type: "dispatch" | "arrive") {
    if (!job?.customerPhone) {
      setToast("No phone number on file for this customer.");
      setTimeout(() => setToast(""), 4000);
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, customerName: job.customerName, customerPhone: job.customerPhone }),
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
    setStatus("en_route");
    await updateJobStatus(id, "en_route");
    setJob(prev => prev ? { ...prev, status: "en_route", dispatchedAt: new Date().toISOString() } : prev);
    await notify("dispatch");
  }

  async function handleArrive() {
    setStatus("arrived");
    await updateJobStatus(id, "arrived");
    setJob(prev => prev ? { ...prev, status: "arrived", arrivedAt: new Date().toISOString() } : prev);
    await notify("arrive");
  }

  async function handleComplete() {
    if (!job) return;
    setStatus("completed");
    await updateJobStatus(id, "completed");
    setJob(prev => prev ? { ...prev, status: "completed", completedAt: new Date().toISOString() } : prev);

    // Decide invoice line items + total based on job type
    let lineItems: { description: string; qty: number; price: number }[] | null = null;
    let total = 0;

    if (job.isPlan && job.pricePerCut) {
      lineItems = [{
        description: `${job.service} (Cut ${job.planCutNumber} of ${job.planTotalCuts})`,
        qty:         1,
        price:       job.pricePerCut,
      }];
      total = job.pricePerCut;
    } else if (!job.isPlan && job.serviceItems && job.serviceItems.length > 0) {
      lineItems = job.serviceItems;
      total = job.total ?? job.serviceItems.reduce((s, i) => s + i.qty * i.price, 0);
    }

    if (lineItems && total > 0) {
      try {
        const inv = await saveInvoice({
          jobId:        job.id,
          customerId:   job.customerId,
          customerName: job.customerName,
          lineItems,
          total,
          status:       "sent",
          sentAt:       new Date().toISOString(),
          paidAt:       null,
        });
        await setJobInvoice(job.id, inv.id);

        await fetch("/api/invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName:  job.customerName,
            customerPhone: job.customerPhone,
            service:       job.service,
            amount:        total,
            cutNumber:     job.planCutNumber,
            totalCuts:     job.planTotalCuts,
            afterPhotoUrl: job.afterPhotoUrl,
          }),
        });
        setToast(`Auto-invoiced $${total.toFixed(2)} to ${job.customerName}`);
      } catch {
        setToast("Job completed but invoice failed to send");
      }
      setTimeout(() => setToast(""), 5000);
    }
  }

  const badge = STATUS_LABELS[status];

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/schedule" className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#1a1a1a]">{job.service}</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>
            {badge.label}
            {job.isPlan && job.planCutNumber && ` · Cut ${job.planCutNumber} of ${job.planTotalCuts}`}
          </span>
        </div>
      </div>

      {dispatchedAt && (
        <div className="bg-white rounded-2xl border border-[#ede8df] shadow-sm mb-4 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide flex items-center gap-1.5">
              <Timer size={12} /> Time Tracker
            </p>
          </div>

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

          {jobDuration !== null && travelDuration !== null && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-[#ede8df] bg-[#FAFAF7]">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#A07840]" />
                <span className="text-sm font-semibold text-[#A07840]">Total</span>
              </div>
              <span className="text-sm font-bold text-[#A07840]">{fmt(travelDuration + jobDuration)}</span>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-3">Customer</p>
        <div className="flex flex-col gap-2.5">
          <Link href={`/customers/${job.customerId}`} className="flex items-center gap-3 text-sm text-[#1a1a1a]">
            <User size={16} className="text-[#C9A96E]" /> {job.customerName}
          </Link>
          {job.customerPhone && (
            <a href={`tel:${job.customerPhone}`} className="flex items-center gap-3 text-sm text-[#1a1a1a]">
              <Phone size={16} className="text-[#C9A96E]" /> {job.customerPhone}
            </a>
          )}
          {job.address && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm text-[#1a1a1a]">
              <MapPin size={16} className="text-[#C9A96E]" /> {job.address}
            </a>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-3">Job Details</p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3 text-sm text-[#1a1a1a]">
            <Wrench size={16} className="text-[#C9A96E]" /> {job.service}
          </div>
          <div className="flex items-center gap-3 text-sm text-[#1a1a1a]">
            <Clock size={16} className="text-[#C9A96E]" /> {job.date}{job.time && ` at ${job.time}`}
          </div>
        </div>
        {job.notes && (
          <p className="mt-3 text-sm text-[#6b7280] border-t border-[#ede8df] pt-3">{job.notes}</p>
        )}
      </div>

      {/* Job Photos — required to complete */}
      {(status === "arrived" || status === "completed") && (
        <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
          <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <Camera size={12} /> Job Photos
            {status === "arrived" && (!job.beforePhotoUrl || !job.afterPhotoUrl) && (
              <span className="text-red-500 normal-case ml-1">required</span>
            )}
          </p>
          <p className="text-xs text-[#6b7280] mb-3">
            {status === "completed"
              ? "Photos for this job."
              : "Add a before and after photo to mark this job complete."}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <JobPhotoSlot jobId={job.id} kind="before" url={job.beforePhotoUrl ?? null}
              disabled={status === "completed"}
              onChange={url => setJob(prev => prev ? { ...prev, beforePhotoUrl: url } : prev)} />
            <JobPhotoSlot jobId={job.id} kind="after"  url={job.afterPhotoUrl ?? null}
              disabled={status === "completed"}
              onChange={url => setJob(prev => prev ? { ...prev, afterPhotoUrl: url } : prev)} />
          </div>
        </div>
      )}

      {toast && (
        <div className="bg-[#F5ECD7] border border-[#C9A96E] rounded-2xl p-3 mb-4 text-sm text-[#A07840]">{toast}</div>
      )}

      <div className="flex flex-col gap-3">
        {status === "scheduled" && (
          <button onClick={handleDispatch} disabled={sending}
            className="bg-[#C9A96E] text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform disabled:opacity-60">
            <Navigation size={18} />
            {sending ? "Sending…" : "Dispatch — Text Customer"}
          </button>
        )}

        {status === "en_route" && (
          <button onClick={handleArrive} disabled={sending}
            className="bg-[#A07840] text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform disabled:opacity-60">
            <MapPin size={18} />
            {sending ? "Sending…" : "Arrived — Text Customer"}
          </button>
        )}

        {status === "arrived" && (() => {
          const hasBoth = !!job.beforePhotoUrl && !!job.afterPhotoUrl;
          const missing = !job.beforePhotoUrl && !job.afterPhotoUrl
            ? "Add before & after photos to complete"
            : !job.beforePhotoUrl
              ? "Add a before photo to complete"
              : "Add an after photo to complete";
          return (
            <button onClick={handleComplete} disabled={!hasBoth}
              className={`rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 shadow-md transition-transform ${
                hasBoth
                  ? "bg-[#16A34A] text-white active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}>
              <CheckCircle2 size={18} />
              {hasBoth ? "Mark as Completed" : missing}
            </button>
          );
        })()}

        {status === "completed" && (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl py-4 flex items-center justify-center gap-2 text-[#15803D] font-semibold text-sm">
            <CheckCircle2 size={18} /> Job Completed
          </div>
        )}

        {job.invoiceId ? (
          <Link href={`/invoices/${job.invoiceId}`}
            className="bg-white border border-[#ede8df] text-[#A07840] rounded-2xl py-4 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">
            <FileText size={14} /> View Invoice
          </Link>
        ) : status === "completed" && !job.isPlan ? (
          <Link href={`/invoices/new?customer=${job.customerId}`}
            className="bg-white border border-[#ede8df] text-[#A07840] rounded-2xl py-4 font-semibold text-sm flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            Create Invoice for This Job
          </Link>
        ) : null}
      </div>
    </div>
  );
}

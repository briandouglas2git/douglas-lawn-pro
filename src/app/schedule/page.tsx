"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { getJobs, type Job } from "@/lib/jobs";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: "#F5ECD7", color: "#A07840" },
  en_route:  { bg: "#FEF3C7", color: "#B45309" },
  arrived:   { bg: "#DCFCE7", color: "#16A34A" },
  completed: { bg: "#F0FDF4", color: "#15803D" },
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  en_route:  "En Route",
  arrived:   "Arrived",
  completed: "Completed",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
}

export default function SchedulePage() {
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJobs()
      .then(setJobs)
      .finally(() => setLoading(false));
  }, []);

  const upcoming  = jobs.filter(j => j.status !== "completed").sort((a, b) => a.date.localeCompare(b.date));
  const completed = jobs.filter(j => j.status === "completed").sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Schedule</h1>
        <Link href="/schedule/new"
          className="bg-[#C9A96E] text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md">
          <Plus size={20} strokeWidth={2.5} />
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-[#ede8df] h-20 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-[#ede8df] shadow-sm text-center">
          <CalendarDays size={32} className="text-[#C9A96E] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#1a1a1a] mb-1">No jobs yet</p>
          <p className="text-xs text-[#6b7280]">Book a job from an estimate or tap + to schedule one.</p>
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">Upcoming</p>
          <div className="flex flex-col gap-2">
            {upcoming.map(job => {
              const badge = STATUS_COLORS[job.status] ?? STATUS_COLORS.scheduled;
              return (
                <Link key={job.id} href={`/schedule/${job.id}`}
                  className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm active:scale-95 transition-transform">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-[#1a1a1a] text-sm">{job.customerName}</p>
                      <p className="text-xs text-[#6b7280]">
                        {job.service}
                        {job.isPlan && job.planCutNumber ? ` · Cut ${job.planCutNumber} of ${job.planTotalCuts}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: badge.bg, color: badge.color }}>
                      {STATUS_LABELS[job.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#6b7280]">
                    {job.address
                      ? <div className="flex items-center gap-1"><MapPin size={11} />{job.address}</div>
                      : <div />}
                    <div className="flex items-center gap-1">
                      <CalendarDays size={11} />
                      {formatDate(job.date)}{job.time ? ` · ${job.time}` : ""}
                    </div>
                  </div>
                  <div className="flex justify-end mt-1">
                    <ChevronRight size={16} className="text-[#C9A96E]" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!loading && completed.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">Completed</p>
          <div className="flex flex-col gap-2">
            {completed.map(job => (
              <Link key={job.id} href={`/schedule/${job.id}`}
                className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm opacity-60 active:scale-95 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#1a1a1a] text-sm">{job.customerName}</p>
                    <p className="text-xs text-[#6b7280]">{job.service} · {formatDate(job.date)}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D]">Done</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

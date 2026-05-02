"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, CalendarDays, ChevronRight, MapPin, Clock } from "lucide-react";
import { getJobs, type Job } from "@/lib/jobs";

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  scheduled: { bg: "#F5ECD7", color: "#A07840", label: "Scheduled" },
  en_route:  { bg: "#FEF3C7", color: "#B45309", label: "En Route"  },
  arrived:   { bg: "#DCFCE7", color: "#16A34A", label: "Arrived"   },
  completed: { bg: "#F0FDF4", color: "#15803D", label: "Done"      },
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function dateOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

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

  const groups = useMemo(() => {
    const today    = todayStr();
    const tomorrow = dateOffset(1);
    const weekEnd  = dateOffset(7);

    const upcoming = jobs.filter(j => j.status !== "completed").sort((a, b) => a.date.localeCompare(b.date));

    return {
      overdue:  upcoming.filter(j => j.date <  today),
      today:    upcoming.filter(j => j.date === today),
      tomorrow: upcoming.filter(j => j.date === tomorrow),
      thisWeek: upcoming.filter(j => j.date >  tomorrow && j.date <= weekEnd),
      later:    upcoming.filter(j => j.date >  weekEnd),
      done:     jobs.filter(j => j.status === "completed").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    };
  }, [jobs]);

  function JobCard({ job }: { job: Job }) {
    const badge = STATUS_COLORS[job.status] ?? STATUS_COLORS.scheduled;
    return (
      <Link href={`/schedule/${job.id}`}
        className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm active:scale-95 transition-transform">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-semibold text-[#1a1a1a] text-sm truncate">{job.customerName}</p>
            <p className="text-xs text-[#6b7280] truncate">
              {job.service}
              {job.isPlan && job.planCutNumber ? ` · Cut ${job.planCutNumber} of ${job.planTotalCuts}` : ""}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-[#6b7280]">
          <div className="flex items-center gap-1 min-w-0">
            {job.address ? <><MapPin size={11} className="shrink-0" /><span className="truncate">{job.address}</span></> : null}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {job.time && <><Clock size={11} />{job.time}</>}
          </div>
        </div>
        <div className="flex justify-end mt-1">
          <ChevronRight size={16} className="text-[#C9A96E]" />
        </div>
      </Link>
    );
  }

  function Section({ title, jobs, accent }: { title: string; jobs: Job[]; accent?: string }) {
    if (jobs.length === 0) return null;
    return (
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: accent ?? "#6b7280" }}>
          {title} <span className="opacity-60">({jobs.length})</span>
        </p>
        <div className="flex flex-col gap-2">
          {jobs.map(j => <JobCard key={j.id} job={j} />)}
        </div>
      </div>
    );
  }

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
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-[#ede8df] h-20 animate-pulse" />)}
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-[#ede8df] shadow-sm text-center">
          <CalendarDays size={32} className="text-[#C9A96E] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#1a1a1a] mb-1">No jobs yet</p>
          <p className="text-xs text-[#6b7280] mb-4">Book a job from an estimate or tap + to schedule one.</p>
          <Link href="/schedule/new" className="inline-flex items-center gap-1.5 bg-[#C9A96E] text-white rounded-xl px-4 py-2 text-sm font-semibold">
            <Plus size={14} /> Schedule a Job
          </Link>
        </div>
      )}

      {!loading && (
        <>
          <Section title="Overdue"   jobs={groups.overdue}  accent="#DC2626" />
          <Section title="Today"     jobs={groups.today}    accent="#A07840" />
          <Section title="Tomorrow"  jobs={groups.tomorrow} />
          <Section title="This Week" jobs={groups.thisWeek} />
          <Section title="Later"     jobs={groups.later} />

          {groups.done.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">Recently Completed</p>
              <div className="flex flex-col gap-2">
                {groups.done.map(j => (
                  <Link key={j.id} href={`/schedule/${j.id}`}
                    className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm opacity-60 active:scale-95 transition-transform">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[#1a1a1a] text-sm">{j.customerName}</p>
                        <p className="text-xs text-[#6b7280]">{j.service} · {formatDate(j.date)}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D]">Done</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

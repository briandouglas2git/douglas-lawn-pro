import Link from "next/link";
import { Plus, CalendarDays, ChevronRight, MapPin } from "lucide-react";

const SAMPLE_JOBS = [
  {
    id:           "job1",
    customerName: "John Miller",
    service:      "Weekly Mowing",
    address:      "12 Elm St, Paris ON",
    date:         "May 2, 2026",
    time:         "9:00 AM",
    status:       "Scheduled",
  },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Scheduled:  { bg: "#F5ECD7", color: "#A07840" },
  "En Route": { bg: "#FEF3C7", color: "#B45309" },
  Arrived:    { bg: "#DCFCE7", color: "#16A34A" },
  Completed:  { bg: "#F0FDF4", color: "#15803D" },
};

export default function SchedulePage() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Schedule</h1>
        <Link
          href="/schedule/new"
          className="bg-[#C9A96E] text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md"
        >
          <Plus size={20} strokeWidth={2.5} />
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {SAMPLE_JOBS.map((job) => {
          const badge = STATUS_COLORS[job.status] ?? STATUS_COLORS["Scheduled"];
          return (
            <Link
              key={job.id}
              href={`/schedule/${job.id}`}
              className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm active:scale-95 transition-transform"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-[#1a1a1a] text-sm">{job.customerName}</p>
                  <p className="text-xs text-[#6b7280]">{job.service}</p>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {job.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#6b7280]">
                <div className="flex items-center gap-1">
                  <MapPin size={11} />
                  {job.address}
                </div>
                <div className="flex items-center gap-1">
                  <CalendarDays size={11} />
                  {job.date} · {job.time}
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <ChevronRight size={16} className="text-[#C9A96E]" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

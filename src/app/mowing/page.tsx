"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Sprout, Calendar, Check, Loader2, User } from "lucide-react";
import { getMowingCustomers, type Customer, type WeekDay } from "@/lib/customers";
import { saveJobs, getJobs, type Job } from "@/lib/jobs";

const DAYS: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES: Record<WeekDay, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

// Map JS getDay() (0=Sun, 1=Mon, ...) to our WeekDay codes
const JS_DAY_TO_CODE: Record<number, WeekDay> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

function findNextDate(weekDay: WeekDay, fromDate: Date): string {
  const targetJsDay = DAYS.indexOf(weekDay) + 1; // Mon=1, Sun=7 — but JS Sun=0
  const target = targetJsDay === 7 ? 0 : targetJsDay;
  const d = new Date(fromDate);
  d.setHours(12, 0, 0, 0);
  const cur = d.getDay();
  let offset = (target - cur + 7) % 7;
  if (offset === 0) offset = 7; // next week, not today
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

export default function MowingPage() {
  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [jobs,       setJobs]       = useState<Job[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [booking,    setBooking]    = useState<WeekDay | null>(null);
  const [toast,      setToast]      = useState("");

  async function load() {
    setLoading(true);
    const [cs, js] = await Promise.all([getMowingCustomers(), getJobs()]);
    setCustomers(cs);
    setJobs(js);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const byDay = useMemo(() => {
    const m = new Map<WeekDay, Customer[]>();
    for (const day of DAYS) m.set(day, []);
    for (const c of customers) {
      if (c.mowingDay) m.get(c.mowingDay)?.push(c);
    }
    return m;
  }, [customers]);

  // What's already scheduled? Map customerId -> date (within next 8 days)
  const upcomingByCustomer = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const limit = new Date(); limit.setDate(limit.getDate() + 14);
    const limitStr = limit.toISOString().split("T")[0];
    const m = new Map<string, Job[]>();
    for (const j of jobs) {
      if (j.status === "completed") continue;
      if (j.date < today || j.date > limitStr) continue;
      if (!m.has(j.customerId)) m.set(j.customerId, []);
      m.get(j.customerId)!.push(j);
    }
    return m;
  }, [jobs]);

  const totalCustomers = customers.length;
  const weeklyRevenue  = customers
    .filter(c => c.mowingFrequency === "weekly")
    .reduce((sum, c) => sum + (c.mowingPrice ?? 0), 0);

  async function bookDay(day: WeekDay) {
    const dayCustomers = byDay.get(day) ?? [];
    if (dayCustomers.length === 0) return;
    setBooking(day);
    try {
      const date = findNextDate(day, new Date());
      const newJobs = dayCustomers
        // skip if a job for this customer is already in the next 14 days
        .filter(c => !(upcomingByCustomer.get(c.id) ?? []).some(j => j.date === date))
        .map(c => ({
          customerName:  c.name,
          customerId:    c.id,
          customerPhone: c.phone,
          address:       c.address,
          service:       "Weekly Mowing",
          date,
          time:          "",
          notes:         c.notes,
          status:        "scheduled" as const,
          isPlan:        false,
          total:         c.mowingPrice ?? 0,
          serviceItems:  [{ description: "Weekly Mowing", qty: 1, price: c.mowingPrice ?? 0 }],
        }));
      if (newJobs.length === 0) {
        setToast(`${DAY_NAMES[day]} already booked for next week.`);
      } else {
        await saveJobs(newJobs);
        setToast(`Booked ${newJobs.length} job${newJobs.length > 1 ? "s" : ""} for ${DAY_NAMES[day]} ${date}`);
        await load();
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Booking failed.");
    } finally {
      setBooking(null);
      setTimeout(() => setToast(""), 5000);
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/" className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1a1a1a] flex items-center gap-1.5">
            <Sprout size={18} className="text-[#16A34A]" /> Mowing Roster
          </h1>
          <p className="text-xs text-[#6b7280]">Your recurring lawn mowing customers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-xl p-3 border border-[#ede8df]">
          <p className="text-xs text-[#6b7280]">Mowing customers</p>
          <p className="text-xl font-bold text-[#A07840]">{totalCustomers}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-[#ede8df]">
          <p className="text-xs text-[#6b7280]">Weekly revenue</p>
          <p className="text-xl font-bold text-[#A07840]">${weeklyRevenue.toFixed(0)}</p>
        </div>
      </div>

      {toast && (
        <div className="bg-[#F5ECD7] border border-[#C9A96E] rounded-2xl p-3 mb-4 text-sm text-[#A07840]">{toast}</div>
      )}

      {loading && <div className="bg-white rounded-2xl border border-[#ede8df] h-32 animate-pulse" />}

      {!loading && totalCustomers === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-[#ede8df] shadow-sm text-center">
          <Sprout size={32} className="text-[#16A34A] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#1a1a1a] mb-1">No mowing customers yet</p>
          <p className="text-xs text-[#6b7280] mb-4">When you add a customer, mark them as weekly or bi-weekly mowing to add them here.</p>
          <Link href="/customers/new"
            className="inline-flex items-center gap-1.5 bg-[#C9A96E] text-white rounded-xl px-4 py-2 text-sm font-semibold">
            <Plus size={14} /> Add Customer
          </Link>
        </div>
      )}

      {!loading && totalCustomers > 0 && (
        <div className="flex flex-col gap-3">
          {DAYS.map(day => {
            const list = byDay.get(day) ?? [];
            if (list.length === 0) return null;
            const dayTotal = list.reduce((s, c) => s + (c.mowingPrice ?? 0), 0);
            return (
              <div key={day} className="bg-white rounded-2xl border border-[#ede8df] shadow-sm overflow-hidden">
                <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#1a1a1a]">{DAY_NAMES[day]}</p>
                    <p className="text-xs text-[#6b7280]">{list.length} customer{list.length > 1 ? "s" : ""} · ${dayTotal.toFixed(0)}</p>
                  </div>
                  <button onClick={() => bookDay(day)} disabled={booking === day}
                    className="bg-[#16A34A] text-white rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-transform disabled:opacity-60">
                    {booking === day ? <Loader2 size={12} className="animate-spin" /> : <Calendar size={12} />}
                    Book Next {day}
                  </button>
                </div>
                <div className="border-t border-[#ede8df] flex flex-col">
                  {list.map(c => {
                    const upcoming = upcomingByCustomer.get(c.id) ?? [];
                    const hasUpcoming = upcoming.length > 0;
                    return (
                      <Link key={c.id} href={`/customers/${c.id}`}
                        className="px-4 py-3 flex items-center gap-3 border-b border-[#ede8df] last:border-0 active:bg-[#FAFAF7]">
                        <div className="w-8 h-8 rounded-full bg-[#F5ECD7] flex items-center justify-center shrink-0">
                          <User size={14} color="#A07840" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1a1a1a] truncate">{c.name}</p>
                          <p className="text-[10px] text-[#6b7280] truncate">
                            {c.mowingFrequency === "weekly" ? "Weekly" : "Bi-weekly"}
                            {c.address && ` · ${c.address}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-[#A07840]">${(c.mowingPrice ?? 0).toFixed(0)}</p>
                          {hasUpcoming && (
                            <p className="text-[9px] text-[#16A34A] font-semibold flex items-center gap-0.5">
                              <Check size={9} /> Booked
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Show customers with no day assigned */}
          {customers.filter(c => !c.mowingDay).length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-yellow-300 shadow-sm">
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-2">⚠️ No mow day assigned</p>
              {customers.filter(c => !c.mowingDay).map(c => (
                <Link key={c.id} href={`/customers/${c.id}`}
                  className="block py-2 text-sm text-[#1a1a1a] border-b border-yellow-100 last:border-0">
                  {c.name} → tap to set a day
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

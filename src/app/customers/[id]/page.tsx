"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, FileText, CalendarDays, ClipboardList, Trash2 } from "lucide-react";
import { getCustomer, deleteCustomer, type Customer } from "@/lib/customers";
import { getJobsForCustomer, type Job } from "@/lib/jobs";
import { getInvoicesForCustomer, type Invoice } from "@/lib/invoices";
import { useRouter } from "next/navigation";

export default function CustomerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = use(params);
  const router   = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [jobs,     setJobs]     = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      getCustomer(id),
      getJobsForCustomer(id),
      getInvoicesForCustomer(id),
    ]).then(([c, j, i]) => {
      setCustomer(c);
      setJobs(j);
      setInvoices(i);
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this customer? Their job and invoice history will remain.")) return;
    await deleteCustomer(id);
    router.push("/customers");
  }

  if (loading) {
    return <div className="p-4"><div className="bg-white rounded-2xl h-32 animate-pulse" /></div>;
  }

  if (!customer) {
    return <div className="p-4"><p className="text-[#6b7280]">Customer not found.</p></div>;
  }

  const upcomingJobs  = jobs.filter(j => j.status !== "completed");
  const completedJobs = jobs.filter(j => j.status === "completed");
  const unpaidTotal   = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const lifetimeTotal = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/customers" className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <h1 className="text-xl font-bold text-[#1a1a1a] flex-1">{customer.name}</h1>
        <button onClick={handleDelete} className="text-gray-300">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-xl p-3 border border-[#ede8df] text-center">
          <p className="text-lg font-bold text-[#A07840]">{jobs.length}</p>
          <p className="text-[10px] text-[#6b7280]">Jobs</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-[#ede8df] text-center">
          <p className="text-lg font-bold text-[#A07840]">${unpaidTotal.toFixed(0)}</p>
          <p className="text-[10px] text-[#6b7280]">Unpaid</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-[#ede8df] text-center">
          <p className="text-lg font-bold text-[#A07840]">${lifetimeTotal.toFixed(0)}</p>
          <p className="text-[10px] text-[#6b7280]">Lifetime</p>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-3">Contact</p>
        <div className="flex flex-col gap-3">
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="flex items-center gap-3 text-sm text-[#1a1a1a]">
              <Phone size={16} className="text-[#C9A96E]" /> {customer.phone}
            </a>
          )}
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="flex items-center gap-3 text-sm text-[#1a1a1a]">
              <Mail size={16} className="text-[#C9A96E]" /> {customer.email}
            </a>
          )}
          {customer.address && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(customer.address)}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm text-[#1a1a1a]">
              <MapPin size={16} className="text-[#C9A96E]" /> {customer.address}
            </a>
          )}
        </div>
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
          <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-2">Notes</p>
          <p className="text-sm text-[#1a1a1a]">{customer.notes}</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Link href={`/estimates/new?customer=${id}`}
          className="bg-white border border-[#ede8df] text-[#A07840] rounded-2xl p-3 flex flex-col items-center gap-1.5">
          <ClipboardList size={18} />
          <span className="text-[11px] font-semibold">Estimate</span>
        </Link>
        <Link href={`/schedule/new?customer=${id}`}
          className="bg-white border border-[#ede8df] text-[#A07840] rounded-2xl p-3 flex flex-col items-center gap-1.5">
          <CalendarDays size={18} />
          <span className="text-[11px] font-semibold">Schedule</span>
        </Link>
        <Link href={`/invoices/new?customer=${id}`}
          className="bg-white border border-[#ede8df] text-[#A07840] rounded-2xl p-3 flex flex-col items-center gap-1.5">
          <FileText size={18} />
          <span className="text-[11px] font-semibold">Invoice</span>
        </Link>
      </div>

      {/* Upcoming jobs */}
      {upcomingJobs.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">Upcoming Jobs</p>
          <div className="flex flex-col gap-2">
            {upcomingJobs.map(j => (
              <Link key={j.id} href={`/schedule/${j.id}`}
                className="bg-white rounded-xl p-3 border border-[#ede8df] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1a1a1a]">{j.service}</p>
                  <p className="text-xs text-[#6b7280]">{j.date} {j.time && `· ${j.time}`}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F5ECD7] text-[#A07840]">
                  {j.status === "scheduled" ? "Scheduled" : j.status === "en_route" ? "En Route" : "Arrived"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent invoices */}
      {invoices.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">Recent Invoices</p>
          <div className="flex flex-col gap-2">
            {invoices.slice(0, 5).map(i => (
              <Link key={i.id} href={`/invoices/${i.id}`}
                className="bg-white rounded-xl p-3 border border-[#ede8df] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1a1a1a]">${i.total.toFixed(2)}</p>
                  <p className="text-xs text-[#6b7280]">{new Date(i.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  i.status === "paid" ? "bg-[#DCFCE7] text-[#16A34A]" :
                  i.status === "sent" ? "bg-[#FEF3C7] text-[#B45309]" :
                                         "bg-[#F3F4F6] text-[#6b7280]"
                }`}>
                  {i.status[0].toUpperCase() + i.status.slice(1)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Job history */}
      {completedJobs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">Job History</p>
          <div className="flex flex-col gap-2">
            {completedJobs.slice(0, 10).map(j => (
              <Link key={j.id} href={`/schedule/${j.id}`}
                className="bg-white rounded-xl p-3 border border-[#ede8df] opacity-70">
                <p className="text-sm font-semibold text-[#1a1a1a]">{j.service}</p>
                <p className="text-xs text-[#6b7280]">{j.date}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {jobs.length === 0 && invoices.length === 0 && (
        <div className="bg-white rounded-2xl p-6 border border-[#ede8df] shadow-sm text-center">
          <p className="text-sm text-[#6b7280]">No jobs or invoices yet</p>
        </div>
      )}
    </div>
  );
}

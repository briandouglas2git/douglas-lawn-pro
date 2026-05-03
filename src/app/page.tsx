"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, CalendarDays, FileText, ClipboardList, Settings as SettingsIcon, MessageSquare } from "lucide-react";
import { getJobs } from "@/lib/jobs";
import { getCustomers } from "@/lib/customers";
import { getInvoices } from "@/lib/invoices";
import { getSettings, type Settings } from "@/lib/settings";

const cards = [
  { href: "/customers", label: "Customers",  sub: "View & manage",         Icon: Users,         bg: "#F5ECD7", color: "#A07840" },
  { href: "/schedule",  label: "Schedule",   sub: "Jobs & appointments",    Icon: CalendarDays,  bg: "#F5ECD7", color: "#A07840" },
  { href: "/invoices",  label: "Invoices",   sub: "Send & track",           Icon: FileText,      bg: "#FDF6EC", color: "#C9A96E" },
  { href: "/estimates", label: "Estimates",  sub: "Quotes for future work", Icon: ClipboardList, bg: "#FDF6EC", color: "#C9A96E" },
  { href: "/messages",  label: "Messages",   sub: "Edit & send texts",      Icon: MessageSquare, bg: "#F5ECD7", color: "#A07840" },
  { href: "/services",  label: "Services",   sub: "Your price book",        Icon: FileText,      bg: "#FDF6EC", color: "#C9A96E" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const [todayJobs,  setTodayJobs]  = useState<number | null>(null);
  const [unpaid,     setUnpaid]     = useState<number | null>(null);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [settings,   setSettings]   = useState<Settings | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    Promise.all([getJobs(), getCustomers(), getInvoices(), getSettings()])
      .then(([jobs, customers, invoices, s]) => {
        setTodayJobs(jobs.filter(j => j.date === today && j.status !== "completed").length);
        setUnpaid(invoices.filter(i => i.status !== "paid").reduce((sum, i) => sum + i.total, 0));
        setCustomerCount(customers.length);
        setSettings(s);
      });
  }, []);

  return (
    <div className="p-4">
      <div className="bg-white rounded-2xl p-5 mb-5 border border-[#ede8df] shadow-sm relative">
        <Link href="/settings" className="absolute top-4 right-4 text-[#C9A96E]">
          <SettingsIcon size={18} />
        </Link>
        <p className="text-[#C9A96E] text-sm font-semibold">{greeting()}{settings?.ownerName && `, ${settings.ownerName}`}</p>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mt-0.5">{settings?.companyName ?? "Douglas Landscaping Co."}</h1>
        <p className="text-[#6b7280] text-sm mt-1">{settings?.baseAddress ?? "Paris, Ontario"}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Today's Jobs", value: todayJobs },
          { label: "Unpaid",       value: unpaid !== null ? `$${unpaid.toFixed(0)}` : null },
          { label: "Customers",    value: customerCount },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-3 text-center border border-[#ede8df] shadow-sm">
            <p className="text-xl font-bold text-[#A07840]">{value ?? "—"}</p>
            <p className="text-[10px] text-[#6b7280] mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ href, label, sub, Icon, bg, color }) => (
          <Link key={href} href={href}
            className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-3 active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
              <Icon size={20} color={color} strokeWidth={2} />
            </div>
            <div>
              <p className="font-semibold text-[#1a1a1a] text-sm">{label}</p>
              <p className="text-xs text-[#6b7280]">{sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

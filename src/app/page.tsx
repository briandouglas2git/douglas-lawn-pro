import Link from "next/link";
import { Users, CalendarDays, FileText, ClipboardList } from "lucide-react";

const cards = [
  { href: "/customers", label: "Customers",  sub: "View & manage",         Icon: Users,         bg: "#F5ECD7", color: "#A07840" },
  { href: "/schedule",  label: "Schedule",   sub: "Jobs & appointments",    Icon: CalendarDays,  bg: "#F5ECD7", color: "#A07840" },
  { href: "/invoices",  label: "Invoices",   sub: "Send & track",           Icon: FileText,      bg: "#FDF6EC", color: "#C9A96E" },
  { href: "/estimates", label: "Estimates",  sub: "Quotes for future work", Icon: ClipboardList, bg: "#FDF6EC", color: "#C9A96E" },
];

export default function Dashboard() {
  return (
    <div className="p-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 mb-5 border border-[#ede8df] shadow-sm">
        <p className="text-[#C9A96E] text-sm font-semibold">Good morning</p>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mt-0.5">Douglas Landscaping Co.</h1>
        <p className="text-[#6b7280] text-sm mt-1">Paris, Ontario</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Today's Jobs", value: "—" },
          { label: "Unpaid",       value: "—" },
          { label: "Customers",    value: "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-3 text-center border border-[#ede8df] shadow-sm">
            <p className="text-xl font-bold text-[#A07840]">{value}</p>
            <p className="text-[10px] text-[#6b7280] mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ href, label, sub, Icon, bg, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-3 active:scale-95 transition-transform"
          >
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

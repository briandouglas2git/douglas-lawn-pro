import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, Plus, FileText, CalendarDays } from "lucide-react";

const SAMPLE: Record<string, { name: string; phone: string; email: string; address: string; notes: string }> = {
  "1": { name: "John Miller",    phone: "(519) 555-0101", email: "john@example.com",  address: "12 Elm St, Paris ON",      notes: "Gate code: 1234. Dogs in backyard." },
  "2": { name: "Sarah Thompson", phone: "(519) 555-0182", email: "sarah@example.com", address: "45 Oak Ave, Brantford ON", notes: "" },
  "3": { name: "Mike Arsenault", phone: "(519) 555-0234", email: "mike@example.com",  address: "7 Maple Dr, Paris ON",     notes: "Prefers text over calls." },
};

export default async function CustomerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = SAMPLE[id];

  if (!customer) {
    return (
      <div className="p-4">
        <p className="text-[#6b7280]">Customer not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/customers" className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <h1 className="text-xl font-bold text-[#1a1a1a]">{customer.name}</h1>
      </div>

      {/* Contact card */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-3">Contact</p>
        <div className="flex flex-col gap-3">
          <a href={`tel:${customer.phone}`} className="flex items-center gap-3 text-sm text-[#1a1a1a]">
            <Phone size={16} className="text-[#C9A96E]" />
            {customer.phone}
          </a>
          <a href={`mailto:${customer.email}`} className="flex items-center gap-3 text-sm text-[#1a1a1a]">
            <Mail size={16} className="text-[#C9A96E]" />
            {customer.email}
          </a>
          <div className="flex items-center gap-3 text-sm text-[#1a1a1a]">
            <MapPin size={16} className="text-[#C9A96E]" />
            {customer.address}
          </div>
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
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link
          href={`/invoices/new?customer=${id}`}
          className="bg-[#C9A96E] text-white rounded-2xl p-4 flex flex-col gap-2"
        >
          <FileText size={20} />
          <span className="text-sm font-semibold">New Invoice</span>
        </Link>
        <Link
          href={`/schedule/new?customer=${id}`}
          className="bg-[#A07840] text-white rounded-2xl p-4 flex flex-col gap-2"
        >
          <CalendarDays size={20} />
          <span className="text-sm font-semibold">Schedule Job</span>
        </Link>
      </div>

      {/* Job history */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Job History</p>
          <button className="text-[#A07840] text-xs font-semibold flex items-center gap-1">
            <Plus size={12} /> Add Job
          </button>
        </div>
        <p className="text-sm text-[#6b7280] text-center py-4">No jobs yet</p>
      </div>
    </div>
  );
}

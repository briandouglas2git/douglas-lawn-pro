import Link from "next/link";
import { Plus, Search, ChevronRight, User } from "lucide-react";

const SAMPLE_CUSTOMERS = [
  { id: "1", name: "John Miller",    phone: "(519) 555-0101", address: "12 Elm St, Paris ON"      },
  { id: "2", name: "Sarah Thompson", phone: "(519) 555-0182", address: "45 Oak Ave, Brantford ON" },
  { id: "3", name: "Mike Arsenault", phone: "(519) 555-0234", address: "7 Maple Dr, Paris ON"     },
];

export default function CustomersPage() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Customers</h1>
        <Link
          href="/customers/new"
          className="bg-[#C9A96E] text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md"
        >
          <Plus size={20} strokeWidth={2.5} />
        </Link>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A96E]" />
        <input
          type="text"
          placeholder="Search customers…"
          className="w-full bg-white border border-[#ede8df] rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[#C9A96E] transition-colors"
        />
      </div>

      <div className="flex flex-col gap-2">
        {SAMPLE_CUSTOMERS.map((c) => (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-[#ede8df] shadow-sm active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-[#F5ECD7] flex items-center justify-center shrink-0">
              <User size={18} color="#A07840" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1a1a1a] text-sm">{c.name}</p>
              <p className="text-xs text-[#6b7280] truncate">{c.address}</p>
            </div>
            <ChevronRight size={16} className="text-[#C9A96E] shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

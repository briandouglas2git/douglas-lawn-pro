"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, ChevronRight, User, Users } from "lucide-react";
import { getCustomers, type Customer } from "@/lib/customers";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [query,     setQuery]     = useState("");

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query) return customers;
    const q = query.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }, [customers, query]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Customers</h1>
        <Link href="/customers/new"
          className="bg-[#C9A96E] text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md">
          <Plus size={20} strokeWidth={2.5} />
        </Link>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A96E]" />
        <input
          type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, address, or phone…"
          className="w-full bg-white border border-[#ede8df] rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[#C9A96E]"
        />
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-[#ede8df] h-16 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && customers.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-[#ede8df] shadow-sm text-center">
          <Users size={32} className="text-[#C9A96E] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#1a1a1a] mb-1">No customers yet</p>
          <p className="text-xs text-[#6b7280] mb-4">Add your first customer to get started.</p>
          <Link href="/customers/new"
            className="inline-flex items-center gap-1.5 bg-[#C9A96E] text-white rounded-xl px-4 py-2 text-sm font-semibold">
            <Plus size={14} /> Add Customer
          </Link>
        </div>
      )}

      {!loading && customers.length > 0 && filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-6 border border-[#ede8df] shadow-sm text-center">
          <p className="text-sm text-[#6b7280]">No customers match &quot;{query}&quot;</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map(c => (
          <Link key={c.id} href={`/customers/${c.id}`}
            className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-[#ede8df] shadow-sm active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-full bg-[#F5ECD7] flex items-center justify-center shrink-0">
              <User size={18} color="#A07840" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1a1a1a] text-sm">{c.name}</p>
              <p className="text-xs text-[#6b7280] truncate">{c.address || c.phone || "—"}</p>
            </div>
            <ChevronRight size={16} className="text-[#C9A96E] shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

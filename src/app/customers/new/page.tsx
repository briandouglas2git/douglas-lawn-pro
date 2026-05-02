"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { saveCustomer } from "@/lib/customers";

export default function NewCustomerPage() {
  const router = useRouter();
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [email,   setEmail]   = useState("");
  const [address, setAddress] = useState("");
  const [notes,   setNotes]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const c = await saveCustomer({ name, phone, email, address, notes });
      setSubmitted(true);
      setTimeout(() => router.push(`/customers/${c.id}`), 1000);
    } catch {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <div className="w-16 h-16 rounded-full bg-[#F5ECD7] flex items-center justify-center">
          <Check size={32} color="#A07840" strokeWidth={2.5} />
        </div>
        <p className="text-lg font-bold text-[#1a1a1a]">Customer Added!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/customers" className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <h1 className="text-xl font-bold text-[#1a1a1a]">New Customer</h1>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-3">
        <div>
          <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Name *</label>
          <input type="text" value={name} required onChange={e => setName(e.target.value)}
            placeholder="Jane Smith"
            className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="(519) 555-0000"
            className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Service Address</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)}
            placeholder="123 Main St, Paris ON"
            className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Gate code, dog in yard, preferences, etc."
            rows={3}
            className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E] resize-none placeholder:text-gray-300" />
        </div>
      </div>

      <button type="submit" disabled={saving || !name.trim()}
        className="bg-[#C9A96E] text-white rounded-2xl py-4 font-semibold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-40">
        {saving ? "Saving…" : "Save Customer"}
      </button>
    </form>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Wrench, Check } from "lucide-react";
import { getServices, saveService, deleteService, type Service } from "@/lib/services";

const SUGGESTED = [
  { name: "Weekly Mowing",       defaultPrice: 65, defaultQty: 1 },
  { name: "Bi-Weekly Mowing",    defaultPrice: 75, defaultQty: 1 },
  { name: "Spring Cleanup",      defaultPrice: 150, defaultQty: 1 },
  { name: "Fall Cleanup",        defaultPrice: 180, defaultQty: 1 },
  { name: "Lawn Fertilization",  defaultPrice: 85, defaultQty: 1 },
  { name: "Hedge Trimming",      defaultPrice: 75, defaultQty: 1 },
  { name: "Aeration",            defaultPrice: 120, defaultQty: 1 },
  { name: "Overseeding",         defaultPrice: 95, defaultQty: 1 },
  { name: "Mulching (per yard)", defaultPrice: 80, defaultQty: 1 },
  { name: "Edge Trimming",       defaultPrice: 50, defaultQty: 1 },
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [adding,   setAdding]   = useState(false);
  const [name,  setName]  = useState("");
  const [price, setPrice] = useState("");

  async function load() {
    setLoading(true);
    const all = await getServices();
    setServices(all);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await saveService({ name: name.trim(), defaultPrice: Number(price) || 0, defaultQty: 1 });
    setName(""); setPrice(""); setAdding(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this service?")) return;
    await deleteService(id);
    load();
  }

  async function importSuggested() {
    for (const s of SUGGESTED) {
      try { await saveService(s); } catch { /* skip duplicates */ }
    }
    load();
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/settings" className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1a1a1a]">Service Price Book</h1>
          <p className="text-xs text-[#6b7280]">Tap-to-insert when creating estimates & invoices</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="bg-[#C9A96E] text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md">
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl p-4 border-2 border-[#C9A96E] shadow-sm mb-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">New Service</p>
          <input type="text" value={name} required onChange={e => setName(e.target.value)}
            placeholder="Service name (e.g. Weekly Mowing)" autoFocus
            className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
          <input type="number" min={0} step={0.01} value={price} onChange={e => setPrice(e.target.value)}
            placeholder="Default price ($)"
            className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
          <div className="flex gap-2">
            <button type="button" onClick={() => { setAdding(false); setName(""); setPrice(""); }}
              className="flex-1 bg-white border border-[#ede8df] text-[#6b7280] rounded-xl py-2.5 font-semibold text-sm">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim()}
              className="flex-2 bg-[#C9A96E] text-white rounded-xl py-2.5 font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-1">
              <Check size={14} /> Save
            </button>
          </div>
        </form>
      )}

      {loading && <div className="bg-white rounded-2xl border border-[#ede8df] h-32 animate-pulse" />}

      {!loading && services.length === 0 && !adding && (
        <div className="bg-white rounded-2xl p-8 border border-[#ede8df] shadow-sm text-center">
          <Wrench size={32} className="text-[#C9A96E] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#1a1a1a] mb-1">No services yet</p>
          <p className="text-xs text-[#6b7280] mb-4">Save your common services with prices so you can tap-to-insert them later.</p>
          <button onClick={importSuggested}
            className="bg-[#C9A96E] text-white rounded-xl px-4 py-2 text-sm font-semibold mb-2">
            Add 10 suggested services
          </button>
          <p className="text-[10px] text-[#6b7280]">Or tap + to add your own</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {services.map(s => (
          <div key={s.id}
            className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border border-[#ede8df] shadow-sm">
            <div className="w-9 h-9 rounded-full bg-[#F5ECD7] flex items-center justify-center shrink-0">
              <Wrench size={15} color="#A07840" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1a1a1a] text-sm truncate">{s.name}</p>
              <p className="text-xs text-[#A07840] font-semibold">${s.defaultPrice.toFixed(2)}</p>
            </div>
            <button onClick={() => handleDelete(s.id)} className="text-gray-300 active:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

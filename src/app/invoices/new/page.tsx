"use client";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";
import { getCustomers, type Customer } from "@/lib/customers";
import { saveInvoice } from "@/lib/invoices";
import { calculateTotal, type LineItem } from "@/lib/estimates";

function NewInvoiceForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const preselected  = searchParams.get("customer") ?? "";

  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(preselected);
  const [items,      setItems]      = useState<LineItem[]>([{ description: "", qty: 1, price: 0 }]);
  const [saving,     setSaving]     = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  useEffect(() => { getCustomers().then(setCustomers); }, []);

  const total            = calculateTotal(items);
  const selectedCustomer = customers.find(c => c.id === customerId);

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || items.every(i => !i.description) || !selectedCustomer) return;
    setSaving(true);
    try {
      const inv = await saveInvoice({
        jobId:        "",
        customerId,
        customerName: selectedCustomer.name,
        lineItems:    items.filter(i => i.description),
        total,
        status:       "draft",
        sentAt:       null,
        paidAt:       null,
      });
      setSubmitted(true);
      setTimeout(() => router.push(`/invoices/${inv.id}`), 1000);
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
        <p className="text-lg font-bold text-[#1a1a1a]">Invoice Created!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-1">
        <Link href={preselected ? `/customers/${preselected}` : "/invoices"}
          className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <h1 className="text-xl font-bold text-[#1a1a1a]">New Invoice</h1>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm">
        <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Customer *</label>
        <select value={customerId} onChange={e => setCustomerId(e.target.value)} required
          className="mt-2 w-full text-sm text-[#1a1a1a] outline-none bg-transparent">
          <option value="">Select a customer…</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-3">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Line Items</p>

        {items.map((item, index) => (
          <div key={index} className="flex flex-col gap-2 pb-3 border-b border-[#ede8df] last:border-0 last:pb-0">
            <div className="flex gap-2 items-center">
              <input type="text" placeholder="Service description" value={item.description}
                onChange={e => updateItem(index, "description", e.target.value)}
                className="flex-1 text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
              {items.length > 1 && (
                <button type="button" onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}>
                  <Trash2 size={16} className="text-gray-300" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-[#6b7280]">Qty</label>
                <input type="number" min={1} value={item.qty}
                  onChange={e => updateItem(index, "qty", Number(e.target.value))}
                  className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-[#6b7280]">Price ($)</label>
                <input type="number" min={0} step={0.01} value={item.price}
                  onChange={e => updateItem(index, "price", Number(e.target.value))}
                  className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E]" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-[#6b7280]">Subtotal</label>
                <p className="text-sm font-semibold text-[#A07840] px-3 py-2">${(item.qty * item.price).toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={() => setItems(prev => [...prev, { description: "", qty: 1, price: 0 }])}
          className="flex items-center gap-1.5 text-sm text-[#C9A96E] font-semibold">
          <Plus size={16} /> Add Line Item
        </button>
      </div>

      <div className="bg-[#F5ECD7] rounded-2xl p-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#A07840]">Total</p>
        <p className="text-xl font-bold text-[#A07840]">${total.toFixed(2)}</p>
      </div>

      <button type="submit" disabled={saving}
        className="bg-[#C9A96E] text-white rounded-2xl py-4 font-semibold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-40">
        {saving ? "Saving…" : "Create Invoice"}
      </button>
    </form>
  );
}

export default function NewInvoicePage() {
  return <Suspense><NewInvoiceForm /></Suspense>;
}

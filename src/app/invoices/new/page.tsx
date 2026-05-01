"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";

const CUSTOMERS: Record<string, string> = {
  "1": "John Miller",
  "2": "Sarah Thompson",
  "3": "Mike Arsenault",
};

interface LineItem {
  description: string;
  qty: number;
  price: number;
}

function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("customer") ?? "";

  const [customerId, setCustomerId]   = useState(preselected);
  const [items, setItems]             = useState<LineItem[]>([{ description: "", qty: 1, price: 0 }]);
  const [notes, setNotes]             = useState("");
  const [submitted, setSubmitted]     = useState(false);

  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function addItem() {
    setItems(prev => [...prev, { description: "", qty: 1, price: 0 }]);
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || items.every(i => !i.description)) return;
    // Will save to Supabase and send via Twilio/Resend in a future phase
    setSubmitted(true);
    setTimeout(() => router.push("/invoices"), 1500);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <div className="w-16 h-16 rounded-full bg-[#F5ECD7] flex items-center justify-center">
          <Check size={32} color="#A07840" strokeWidth={2.5} />
        </div>
        <p className="text-lg font-bold text-[#1a1a1a]">Invoice Created!</p>
        <p className="text-sm text-[#6b7280]">Redirecting…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <Link
          href={preselected ? `/customers/${preselected}` : "/invoices"}
          className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <h1 className="text-xl font-bold text-[#1a1a1a]">New Invoice</h1>
      </div>

      {/* Customer */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm">
        <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Customer *</label>
        <select
          value={customerId}
          onChange={e => setCustomerId(e.target.value)}
          required
          className="mt-2 w-full text-sm text-[#1a1a1a] outline-none bg-transparent"
        >
          <option value="">Select a customer…</option>
          {Object.entries(CUSTOMERS).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-3">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Line Items</p>

        {items.map((item, index) => (
          <div key={index} className="flex flex-col gap-2 pb-3 border-b border-[#ede8df] last:border-0 last:pb-0">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Service description"
                value={item.description}
                onChange={e => updateItem(index, "description", e.target.value)}
                className="flex-1 text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E] transition-colors"
              />
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(index)}>
                  <Trash2 size={16} className="text-gray-300" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-[#6b7280]">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={e => updateItem(index, "qty", Number(e.target.value))}
                  className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E] transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-[#6b7280]">Price ($)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.price}
                  onChange={e => updateItem(index, "price", Number(e.target.value))}
                  className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2 outline-none focus:border-[#C9A96E] transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-[#6b7280]">Subtotal</label>
                <p className="text-sm font-semibold text-[#A07840] px-3 py-2">
                  ${(item.qty * item.price).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-sm text-[#C9A96E] font-semibold mt-1"
        >
          <Plus size={16} /> Add Line Item
        </button>
      </div>

      {/* Total */}
      <div className="bg-[#F5ECD7] rounded-2xl p-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#A07840]">Total</p>
        <p className="text-xl font-bold text-[#A07840]">${total.toFixed(2)}</p>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm">
        <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Payment instructions, thank-you note, etc."
          rows={3}
          className="mt-2 w-full text-sm text-[#1a1a1a] outline-none bg-transparent resize-none placeholder:text-gray-300"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="bg-[#C9A96E] text-white rounded-2xl py-4 font-semibold text-sm shadow-md active:scale-95 transition-transform"
      >
        Create Invoice
      </button>
    </form>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense>
      <NewInvoiceForm />
    </Suspense>
  );
}

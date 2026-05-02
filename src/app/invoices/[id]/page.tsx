"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Send, Check, FileText } from "lucide-react";
import { getInvoice, markInvoiceSent, markInvoicePaid, type Invoice } from "@/lib/invoices";
import { getCustomer, type Customer } from "@/lib/customers";

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: "#F3F4F6", color: "#6b7280", label: "Draft" },
  sent:  { bg: "#FEF3C7", color: "#B45309", label: "Sent"  },
  paid:  { bg: "#DCFCE7", color: "#16A34A", label: "Paid"  },
};

export default function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [invoice,  setInvoice]  = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [busy,     setBusy]     = useState(false);
  const [toast,    setToast]    = useState("");

  useEffect(() => {
    getInvoice(id).then(async inv => {
      setInvoice(inv);
      if (inv?.customerId) {
        const c = await getCustomer(inv.customerId);
        setCustomer(c);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-4"><div className="bg-white rounded-2xl h-48 animate-pulse" /></div>;
  if (!invoice) return <div className="p-4"><p className="text-[#6b7280]">Invoice not found.</p></div>;

  async function send() {
    if (!invoice || !customer?.phone) {
      setToast("Customer phone number missing.");
      setTimeout(() => setToast(""), 4000);
      return;
    }
    setBusy(true);
    try {
      const res  = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "estimate", customerName: invoice.customerName, customerPhone: customer.phone, total: invoice.total }),
      });
      const data = await res.json();
      await markInvoiceSent(id);
      setInvoice(prev => prev ? { ...prev, status: "sent" } : prev);
      setToast(data.preview ? `Preview: "${data.message}"` : "Invoice sent!");
    } catch { setToast("Could not send."); }
    finally { setBusy(false); setTimeout(() => setToast(""), 5000); }
  }

  async function markPaid() {
    setBusy(true);
    await markInvoicePaid(id);
    setInvoice(prev => prev ? { ...prev, status: "paid", paidAt: new Date().toISOString() } : prev);
    setBusy(false);
    setToast("Marked as paid!");
    setTimeout(() => setToast(""), 4000);
  }

  const badge = STATUS_COLORS[invoice.status];

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#1a1a1a]">Invoice</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-2">Customer</p>
        <Link href={`/customers/${invoice.customerId}`} className="flex items-center gap-2 text-sm text-[#1a1a1a]">
          <User size={15} className="text-[#C9A96E]" /> {invoice.customerName}
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-4">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-3">Line Items</p>
        <div className="flex flex-col gap-2">
          {invoice.lineItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-[#1a1a1a]">{item.description}{item.qty > 1 ? ` ×${item.qty}` : ""}</span>
              <span className="font-semibold text-[#A07840]">${(item.qty * item.price).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[#ede8df] mt-3 pt-3 flex items-center justify-between">
          <span className="text-sm font-bold text-[#1a1a1a]">Total</span>
          <span className="text-lg font-bold text-[#A07840]">${invoice.total.toFixed(2)}</span>
        </div>
        <p className="text-xs text-[#6b7280] mt-2">
          Created {new Date(invoice.createdAt).toLocaleDateString()}
          {invoice.sentAt && ` · Sent ${new Date(invoice.sentAt).toLocaleDateString()}`}
          {invoice.paidAt && ` · Paid ${new Date(invoice.paidAt).toLocaleDateString()}`}
        </p>
      </div>

      {toast && (
        <div className="bg-[#F5ECD7] border border-[#C9A96E] rounded-2xl p-3 mb-4 text-sm text-[#A07840]">{toast}</div>
      )}

      <div className="flex flex-col gap-3">
        {invoice.status !== "paid" && (
          <button onClick={send} disabled={busy}
            className="bg-white border border-[#C9A96E] text-[#A07840] rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60">
            <Send size={16} /> {busy ? "Sending…" : invoice.status === "sent" ? "Resend Invoice" : "Send to Customer"}
          </button>
        )}
        {invoice.status !== "paid" ? (
          <button onClick={markPaid} disabled={busy}
            className="bg-[#16A34A] text-white rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60">
            <Check size={16} /> Mark as Paid
          </button>
        ) : (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl py-4 flex items-center justify-center gap-2 text-[#15803D] font-semibold text-sm">
            <Check size={18} /> Paid {invoice.paidAt && `· ${new Date(invoice.paidAt).toLocaleDateString()}`}
          </div>
        )}
        {invoice.jobId && (
          <Link href={`/schedule/${invoice.jobId}`}
            className="bg-white border border-[#ede8df] text-[#A07840] rounded-2xl py-3 text-center text-sm font-semibold flex items-center justify-center gap-2">
            <FileText size={14} /> View Linked Job
          </Link>
        )}
      </div>
    </div>
  );
}

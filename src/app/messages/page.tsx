"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Send, Check, Edit3, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { getTemplates, updateTemplate, renderTemplate, PLACEHOLDERS, type MessageTemplate, type TriggerType } from "@/lib/templates";
import { getCustomers, type Customer } from "@/lib/customers";
import { getSettings } from "@/lib/settings";

const TRIGGER_LABELS: Record<TriggerType, string> = {
  manual:       "Send manually",
  on_dispatch:  "Auto when I tap Dispatch",
  on_arrive:    "Auto when I tap Arrived",
  on_complete:  "Auto when job completes",
};

export default function MessagesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companyName, setCompanyName] = useState("Douglas Landscaping Co.");
  const [loading,   setLoading]   = useState(true);

  // Quick-send state
  const [pickedCustomer, setPickedCustomer] = useState("");
  const [pickedTemplate, setPickedTemplate] = useState("");
  const [editedBody,     setEditedBody]     = useState("");
  const [sending,        setSending]        = useState(false);
  const [sendResult,     setSendResult]     = useState("");

  // Edit state per template
  const [expanded, setExpanded] = useState<string | null>(null);
  const [edits,    setEdits]    = useState<Record<string, Partial<MessageTemplate>>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [tpl, cs, s] = await Promise.all([getTemplates(), getCustomers(), getSettings()]);
    setTemplates(tpl);
    setCustomers(cs);
    setCompanyName(s.companyName);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Keep editedBody in sync with picked template
  useEffect(() => {
    const t = templates.find(x => x.key === pickedTemplate);
    if (t) setEditedBody(t.body);
  }, [pickedTemplate, templates]);

  const customer = customers.find(c => c.id === pickedCustomer);

  function previewBody(body: string) {
    return renderTemplate(body, {
      name:    customer?.name ?? "{name}",
      company: companyName,
      service: "Weekly Mowing",
      amount:  "65.00",
      date:    "Tomorrow",
      time:    "9:00 AM",
    });
  }

  async function handleSend() {
    if (!customer?.phone) {
      setSendResult("Customer has no phone number on file.");
      setTimeout(() => setSendResult(""), 5000);
      return;
    }
    setSending(true);
    setSendResult("");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName:  customer.name,
          customerPhone: customer.phone,
          companyName,
          body:          previewBody(editedBody),
        }),
      });
      const data = await res.json();
      setSendResult(data.preview ? `Preview: "${data.message}"` : data.error ? `Error: ${data.error}` : "Message sent!");
    } catch {
      setSendResult("Could not send.");
    } finally {
      setSending(false);
      setTimeout(() => setSendResult(""), 6000);
    }
  }

  async function saveTemplate(key: string) {
    setSavingKey(key);
    try {
      await updateTemplate(key, edits[key] ?? {});
      const fresh = await getTemplates();
      setTemplates(fresh);
      setEdits(prev => { const n = { ...prev }; delete n[key]; return n; });
    } finally {
      setSavingKey(null);
    }
  }

  function patch(key: string, updates: Partial<MessageTemplate>) {
    setEdits(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  }

  function effective(t: MessageTemplate): MessageTemplate {
    return { ...t, ...(edits[t.key] ?? {}) };
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/" className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1a1a1a]">Messages</h1>
          <p className="text-xs text-[#6b7280]">Edit templates & send manual texts</p>
        </div>
      </div>

      {loading && <div className="bg-white rounded-2xl border border-[#ede8df] h-32 animate-pulse" />}

      {!loading && (
        <>
          {/* Quick send */}
          <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm mb-5">
            <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Send size={11} /> Send a Message
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide">To</label>
                <select value={pickedCustomer} onChange={e => setPickedCustomer(e.target.value)}
                  className="mt-1 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]">
                  <option value="">Pick a customer…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide">Template</label>
                <select value={pickedTemplate} onChange={e => setPickedTemplate(e.target.value)}
                  className="mt-1 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]">
                  <option value="">Pick a template or write custom…</option>
                  {templates.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide">Message (edit before sending)</label>
                <textarea value={editedBody} onChange={e => setEditedBody(e.target.value)}
                  rows={4} placeholder="Type a message, or pick a template above…"
                  className="mt-1 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E] resize-none placeholder:text-gray-300" />
                {editedBody && customer && (
                  <p className="text-[10px] text-[#6b7280] mt-1">
                    <strong>Preview:</strong> {previewBody(editedBody)}
                  </p>
                )}
              </div>

              {sendResult && (
                <div className="bg-[#F5ECD7] border border-[#C9A96E] rounded-xl p-3 text-xs text-[#A07840]">{sendResult}</div>
              )}

              <button onClick={handleSend} disabled={sending || !pickedCustomer || !editedBody}
                className="bg-[#C9A96E] text-white rounded-2xl py-3 font-semibold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2">
                {sending ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send Text</>}
              </button>
            </div>
          </div>

          {/* Template editor */}
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Edit3 size={11} /> Templates
          </p>
          <p className="text-[10px] text-[#6b7280] mb-3">
            Use {`{name}`}, {`{company}`}, {`{service}`}, {`{amount}`}, {`{date}`}, {`{time}`} as placeholders.
          </p>

          <div className="flex flex-col gap-2">
            {templates.map(t => {
              const eff = effective(t);
              const isOpen = expanded === t.key;
              const isDirty = !!edits[t.key];
              return (
                <div key={t.key} className="bg-white rounded-2xl border border-[#ede8df] shadow-sm overflow-hidden">
                  <button type="button"
                    onClick={() => setExpanded(isOpen ? null : t.key)}
                    className="w-full flex items-center justify-between p-4 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${eff.enabled ? "bg-[#16A34A]" : "bg-gray-300"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1a1a1a] truncate">{eff.label}</p>
                        <p className="text-[10px] text-[#6b7280]">{TRIGGER_LABELS[eff.trigger]}</p>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-[#C9A96E]" /> : <ChevronDown size={16} className="text-gray-300" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#ede8df] p-4 flex flex-col gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide">Message body</label>
                        <textarea value={eff.body}
                          onChange={e => patch(t.key, { body: e.target.value })}
                          rows={4}
                          className="mt-1 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E] resize-none" />
                        <p className="text-[10px] text-[#6b7280] mt-1">
                          Placeholders: {PLACEHOLDERS.map(p => `{${p}}`).join(", ")}
                        </p>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide">When to send</label>
                        <select value={eff.trigger}
                          onChange={e => patch(t.key, { trigger: e.target.value as TriggerType })}
                          className="mt-1 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]">
                          {Object.entries(TRIGGER_LABELS).map(([k, label]) =>
                            <option key={k} value={k}>{label}</option>
                          )}
                        </select>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-[#1a1a1a]">
                        <input type="checkbox" checked={eff.enabled}
                          onChange={e => patch(t.key, { enabled: e.target.checked })}
                          className="w-4 h-4 accent-[#C9A96E]" />
                        Enabled
                      </label>

                      <button type="button" onClick={() => saveTemplate(t.key)} disabled={!isDirty || savingKey === t.key}
                        className="bg-[#C9A96E] text-white rounded-xl py-2.5 font-semibold text-sm flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition-transform">
                        {savingKey === t.key ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save Changes</>}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Settings as SettingsIcon } from "lucide-react";
import { getSettings, updateSettings, type Settings } from "@/lib/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return <div className="p-4"><div className="bg-white rounded-2xl h-32 animate-pulse" /></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/" className="w-8 h-8 rounded-full bg-white border border-[#ede8df] shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-[#A07840]" />
        </Link>
        <div className="flex items-center gap-2">
          <SettingsIcon size={18} className="text-[#C9A96E]" />
          <h1 className="text-xl font-bold text-[#1a1a1a]">Settings</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-3">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Company Info</p>
        <div>
          <label className="text-xs text-[#6b7280] block mb-1">Company name</label>
          <input type="text" value={settings.companyName}
            onChange={e => setSettings({ ...settings, companyName: e.target.value })}
            className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
        </div>
        <div>
          <label className="text-xs text-[#6b7280] block mb-1">Your name (for greetings & messages)</label>
          <input type="text" value={settings.ownerName}
            onChange={e => setSettings({ ...settings, ownerName: e.target.value })}
            className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
        </div>
        <div>
          <label className="text-xs text-[#6b7280] block mb-1">Base location</label>
          <input type="text" value={settings.baseAddress}
            onChange={e => setSettings({ ...settings, baseAddress: e.target.value })}
            className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex flex-col gap-3">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Pricing Defaults</p>
        <div>
          <label className="text-xs text-[#6b7280] block mb-1">Default mowing price ($/cut)</label>
          <input type="number" min={0} step={0.01} value={settings.defaultCutPrice}
            onChange={e => setSettings({ ...settings, defaultCutPrice: Number(e.target.value) })}
            className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
        </div>
        <div>
          <label className="text-xs text-[#6b7280] block mb-1">Default plan length (weeks)</label>
          <input type="number" min={1} value={settings.defaultPlanWeeks}
            onChange={e => setSettings({ ...settings, defaultPlanWeeks: Number(e.target.value) })}
            className="w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-2">Integrations</p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#6b7280]">Twilio (SMS)</span>
            <span className="text-xs font-semibold text-gray-300">Not connected</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6b7280]">Stripe (Payments)</span>
            <span className="text-xs font-semibold text-gray-300">Not connected</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6b7280]">Resend (Email)</span>
            <span className="text-xs font-semibold text-gray-300">Not connected</span>
          </div>
        </div>
        <p className="text-xs text-[#6b7280] mt-3">
          Until these are connected, customer texts will show a preview only.
        </p>
      </div>

      <button type="submit" disabled={saving}
        className="bg-[#C9A96E] text-white rounded-2xl py-4 font-semibold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2">
        {saved ? <><Check size={16} /> Saved</> : saving ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}

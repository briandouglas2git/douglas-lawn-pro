"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Settings as SettingsIcon, Wrench, ChevronRight, LogOut, Calendar, Copy, RefreshCw } from "lucide-react";
import { getSettings, updateSettings, ensureCalendarToken, type Settings } from "@/lib/settings";
import { supabase } from "@/lib/supabase";

interface Health { twilio: boolean; resend: boolean; stripe: boolean; }

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [health,   setHealth]   = useState<Health | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const [calendarUrl, setCalendarUrl] = useState("");
  const [copied,      setCopied]      = useState(false);

  useEffect(() => {
    ensureCalendarToken().then(token => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setCalendarUrl(`${origin}/api/calendar?token=${token}`);
    }).catch(() => {});
  }, []);

  async function regenerateToken() {
    if (!confirm("Regenerate? Your old calendar subscription will stop working — you'll need to re-add it in Google Calendar.")) return;
    const token = crypto.randomUUID().replace(/-/g, "");
    await updateSettings({ calendarToken: token });
    setCalendarUrl(`${window.location.origin}/api/calendar?token=${token}`);
  }

  function copyUrl() {
    navigator.clipboard.writeText(calendarUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
    fetch("/api/health").then(r => r.json()).then(setHealth).catch(() => {});
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

      {/* Calendar sync */}
      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={14} className="text-[#C9A96E]" />
          <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Calendar Sync</p>
        </div>
        <p className="text-xs text-[#6b7280] mb-3">
          Subscribe to this URL in Google Calendar (or Apple Calendar) and your scheduled jobs appear there automatically. Updates every few hours.
        </p>
        <div className="flex gap-2">
          <input type="text" value={calendarUrl} readOnly
            className="flex-1 text-[10px] text-[#1a1a1a] border border-[#ede8df] rounded-xl px-2 py-2 outline-none font-mono truncate" />
          <button type="button" onClick={copyUrl}
            className="bg-[#C9A96E] text-white rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1">
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
        <details className="mt-3">
          <summary className="text-xs font-semibold text-[#A07840] cursor-pointer">How to add to Google Calendar</summary>
          <ol className="text-xs text-[#6b7280] mt-2 list-decimal pl-5 space-y-1">
            <li>Copy the URL above</li>
            <li>Open <strong>Google Calendar</strong> on a computer (not the phone app)</li>
            <li>On the left sidebar, click the <strong>+</strong> next to <strong>Other calendars</strong></li>
            <li>Choose <strong>From URL</strong></li>
            <li>Paste the URL → <strong>Add calendar</strong></li>
            <li>Done — appears in Google Calendar on every device</li>
          </ol>
        </details>
        <button type="button" onClick={regenerateToken}
          className="text-xs text-[#6b7280] mt-2 flex items-center gap-1">
          <RefreshCw size={11} /> Regenerate URL (if it leaks)
        </button>
      </div>

      <Link href="/services"
        className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#F5ECD7] flex items-center justify-center">
          <Wrench size={18} color="#A07840" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#1a1a1a]">Service Price Book</p>
          <p className="text-xs text-[#6b7280]">Manage your saved services & default prices</p>
        </div>
        <ChevronRight size={16} className="text-[#C9A96E]" />
      </Link>

      <div className="bg-white rounded-2xl p-4 border border-[#ede8df] shadow-sm">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide mb-2">Integrations</p>
        <div className="flex flex-col gap-2 text-sm">
          {[
            { label: "Twilio (SMS)",       on: health?.twilio },
            { label: "Stripe (Payments)",  on: health?.stripe },
            { label: "Resend (Email)",     on: health?.resend },
          ].map(({ label, on }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[#6b7280]">{label}</span>
              <span className={`text-xs font-semibold flex items-center gap-1 ${
                on ? "text-[#16A34A]" : "text-gray-300"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${on ? "bg-[#16A34A]" : "bg-gray-300"}`} />
                {on ? "Connected" : "Not connected"}
              </span>
            </div>
          ))}
        </div>
        {!health?.twilio && (
          <p className="text-xs text-[#6b7280] mt-3">
            Until Twilio is connected, customer texts will show a preview only.
          </p>
        )}
      </div>

      <button type="submit" disabled={saving}
        className="bg-[#C9A96E] text-white rounded-2xl py-4 font-semibold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2">
        {saved ? <><Check size={16} /> Saved</> : saving ? "Saving…" : "Save Settings"}
      </button>

      <button type="button" onClick={signOut}
        className="bg-white border border-[#ede8df] text-[#6b7280] rounded-2xl py-3 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
        <LogOut size={14} /> Sign Out
      </button>
    </form>
  );
}

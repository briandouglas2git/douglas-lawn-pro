"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [busy,     setBusy]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAF7]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl border border-[#ede8df] shadow-sm p-6 flex flex-col gap-4">
        <div className="text-center mb-2">
          <div className="w-14 h-14 rounded-2xl bg-[#F5ECD7] flex items-center justify-center mx-auto mb-3">
            <LogIn size={24} color="#A07840" />
          </div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">Douglas Landscaping Co.</h1>
          <p className="text-xs text-[#6b7280] mt-1">Sign in to manage your business</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Email</label>
          <input type="email" value={email} required onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Password</label>
          <input type="password" value={password} required onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1.5 w-full text-sm text-[#1a1a1a] border border-[#ede8df] rounded-xl px-3 py-2.5 outline-none focus:border-[#C9A96E]" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-xl p-3 text-xs">{error}</div>
        )}

        <button type="submit" disabled={busy}
          className="bg-[#C9A96E] text-white rounded-2xl py-3 font-semibold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2">
          {busy ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}

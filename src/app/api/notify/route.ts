import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

function render(body: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (out, [k, v]) => out.replaceAll(`{${k}}`, String(v)),
    body
  );
}

// Map legacy notification types to template keys
const TYPE_TO_KEY: Record<string, string> = {
  dispatch: "dispatch",
  arrive:   "arrive",
  estimate: "estimate",
  reminder: "reminder_day_before",
};

const FALLBACK: Record<string, string> = {
  dispatch: "Hi {name}! Brian from {company} is on his way to your property. See you soon! 🌿",
  arrive:   "Hi {name}! Brian from {company} has arrived. Thanks for your business! 🌿",
  estimate: "Hi {name}! Brian from {company} sent you an estimate for ${amount}. Reply or call to confirm.",
  reminder: "Hi {name}! Just a reminder that Brian from {company} will be at your property on {date}. Reply STOP to opt out.",
};

export async function POST(req: NextRequest) {
  const { type, customerName, customerPhone, date, total, body: customBody, companyName } = await req.json();

  if (!customerPhone) {
    return NextResponse.json({ error: "Missing customer phone" }, { status: 400 });
  }

  // Pull the template body from DB (anon key, public RLS — safe)
  let body = customBody as string | undefined;
  if (!body && type) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      try {
        const supabase = createClient(url, key);
        const templateKey = TYPE_TO_KEY[type] ?? type;
        const { data } = await supabase
          .from("message_templates")
          .select("body, enabled")
          .eq("key", templateKey)
          .single();
        if (data?.enabled) body = data.body as string;
      } catch { /* fall through to fallback */ }
    }
    if (!body) body = FALLBACK[type] ?? "";
  }

  if (!body) {
    return NextResponse.json({ error: "No template body" }, { status: 400 });
  }

  const message = render(body, {
    name:    customerName ?? "",
    company: companyName ?? "Douglas Landscaping Co.",
    date:    date ?? "",
    amount:  total != null ? Number(total).toFixed(2) : "",
    service: "",
    time:    "",
  });

  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    return NextResponse.json({ preview: true, message });
  }

  const to = toE164(customerPhone);
  if (!to) {
    return NextResponse.json({ error: `Invalid phone number: ${customerPhone}` }, { status: 400 });
  }

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(sid, token);
    const result = await client.messages.create({ body: message, from, to });
    return NextResponse.json({ success: true, sid: result.sid });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send SMS";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

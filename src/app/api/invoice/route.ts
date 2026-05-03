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

const FALLBACK_BODY =
  "Hi {name}! Your {service} is complete. Your invoice of ${amount} has been applied to your card on file. Thank you! — {company} 🌿";

export async function POST(req: NextRequest) {
  const { customerName, customerPhone, service, amount, cutNumber, totalCuts, afterPhotoUrl, companyName } = await req.json();

  if (!customerName || !customerPhone || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Try to load the template from DB
  let body = FALLBACK_BODY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const { data } = await supabase
        .from("message_templates")
        .select("body, enabled")
        .eq("key", "complete_invoice")
        .single();
      if (data?.enabled) body = data.body as string;
    } catch { /* use fallback */ }
  }

  const cutSuffix = cutNumber && totalCuts ? ` (Cut ${cutNumber} of ${totalCuts})` : "";
  let message = render(body, {
    name:    customerName,
    company: companyName ?? "Douglas Landscaping Co.",
    service: `${service}${cutSuffix}`,
    amount:  Number(amount).toFixed(2),
    date:    "",
    time:    "",
  });

  if (afterPhotoUrl) message += `\n\nAfter photo: ${afterPhotoUrl}`;

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

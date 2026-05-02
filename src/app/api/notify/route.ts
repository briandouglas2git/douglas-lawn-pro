import { NextRequest, NextResponse } from "next/server";

function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

const MESSAGES = {
  dispatch: (name: string) =>
    `Hi ${name}! Brian from Douglas Landscaping Co. is on his way to your property. See you soon! 🌿`,
  arrive: (name: string) =>
    `Hi ${name}! Brian from Douglas Landscaping Co. has arrived at your property. Thanks for your business! 🌿`,
  reminder: (name: string, date: string) =>
    `Hi ${name}! Just a reminder that Brian from Douglas Landscaping Co. will be at your property on ${date}. Reply STOP to opt out.`,
  estimate: (name: string, total: number) =>
    `Hi ${name}! Brian from Douglas Landscaping Co. sent you an estimate for $${total.toFixed(2)}. Reply to this message or call to confirm. 🌿`,
};

export async function POST(req: NextRequest) {
  const { type, customerName, customerPhone, date, total } = await req.json();

  if (!type || !customerName || !customerPhone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  function buildMessage() {
    if (type === "reminder") return MESSAGES.reminder(customerName, date ?? "");
    if (type === "estimate") return MESSAGES.estimate(customerName, total ?? 0);
    return MESSAGES[type as "dispatch" | "arrive"]?.(customerName);
  }

  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    return NextResponse.json({ preview: true, message: buildMessage() });
  }

  const to = toE164(customerPhone);
  if (!to) {
    return NextResponse.json({ error: `Invalid phone number: ${customerPhone}` }, { status: 400 });
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(sid, token);
  const body = buildMessage();

  if (!body) {
    return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
  }

  try {
    const message = await client.messages.create({ body, from, to });
    return NextResponse.json({ success: true, sid: message.sid });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send SMS";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

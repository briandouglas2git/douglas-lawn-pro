import { NextRequest, NextResponse } from "next/server";

function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

export async function POST(req: NextRequest) {
  const { customerName, customerPhone, service, amount, cutNumber, totalCuts, afterPhotoUrl } = await req.json();

  if (!customerName || !customerPhone || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const cutSuffix = cutNumber && totalCuts ? ` (Cut ${cutNumber} of ${totalCuts})` : "";
  let message =
    `Hi ${customerName}! Your ${service}${cutSuffix} is complete. ` +
    `Your invoice of $${Number(amount).toFixed(2)} has been applied to your card on file. ` +
    `Thank you! — Douglas Landscaping Co. 🌿`;

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

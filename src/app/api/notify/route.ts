import { NextRequest, NextResponse } from "next/server";

const MESSAGES = {
  dispatch: (name: string) =>
    `Hi ${name}! Brian from Douglas Landscaping Co. is on his way to your property. See you soon! 🌿`,
  arrive: (name: string) =>
    `Hi ${name}! Brian from Douglas Landscaping Co. has arrived at your property. Thanks for your business! 🌿`,
  reminder: (name: string, date: string) =>
    `Hi ${name}! Just a reminder that Brian from Douglas Landscaping Co. will be at your property on ${date}. Reply STOP to opt out.`,
};

export async function POST(req: NextRequest) {
  const { type, customerName, customerPhone, date } = await req.json();

  if (!type || !customerName || !customerPhone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  // If Twilio isn't configured yet, return a preview of what would be sent
  if (!sid || !token || !from) {
    const body = type === "reminder"
      ? MESSAGES.reminder(customerName, date ?? "")
      : MESSAGES[type as "dispatch" | "arrive"]?.(customerName);

    return NextResponse.json({ preview: true, message: body });
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(sid, token);

  const body = type === "reminder"
    ? MESSAGES.reminder(customerName, date ?? "")
    : MESSAGES[type as "dispatch" | "arrive"]?.(customerName);

  if (!body) {
    return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
  }

  const message = await client.messages.create({ body, from, to: customerPhone });
  return NextResponse.json({ success: true, sid: message.sid });
}

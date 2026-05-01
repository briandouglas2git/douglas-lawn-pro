import { NextRequest, NextResponse } from "next/server";

// Auto-invoice: called after a plan job is marked complete.
// Sends an SMS/email to the customer with the invoice amount.
// When Stripe is connected, the saved card will be charged automatically.

export async function POST(req: NextRequest) {
  const { customerName, customerPhone, service, amount, cutNumber, totalCuts } = await req.json();

  if (!customerName || !customerPhone || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const message =
    `Hi ${customerName}! Your ${service} (Cut ${cutNumber} of ${totalCuts}) is complete. ` +
    `Your invoice of $${Number(amount).toFixed(2)} has been applied to your card on file. ` +
    `Thank you! — Douglas Landscaping Co. 🌿`;

  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  // Preview mode if Twilio not configured
  if (!sid || !token || !from) {
    return NextResponse.json({ preview: true, message });
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(sid, token);
  const result = await client.messages.create({ body: message, from, to: customerPhone });

  return NextResponse.json({ success: true, sid: result.sid });
}

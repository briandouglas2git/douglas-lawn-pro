import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
    resend: !!process.env.RESEND_API_KEY,
    stripe: !!process.env.STRIPE_SECRET_KEY,
  });
}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
    resend: !!process.env.RESEND_API_KEY,
    resend_from: process.env.RESEND_FROM_EMAIL ?? null,
    stripe: !!process.env.STRIPE_SECRET_KEY,
  });
}

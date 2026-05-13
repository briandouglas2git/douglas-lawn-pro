import { NextRequest, NextResponse } from "next/server";

interface LineItem { description: string; qty: number; price: number; }

function buildHtml(opts: {
  customerName: string;
  companyName: string;
  service: string;
  total: number;
  lineItems: LineItem[];
  afterPhotoUrl?: string;
}) {
  const items = opts.lineItems.map(i =>
    `<tr>
      <td style="padding:8px 0;color:#1a1a1a;">${i.description}${i.qty > 1 ? ` × ${i.qty}` : ""}</td>
      <td style="padding:8px 0;color:#A07840;text-align:right;font-weight:600;">$${(i.qty * i.price).toFixed(2)}</td>
    </tr>`
  ).join("");

  return `
<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#FAFAF7;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #ede8df;border-radius:16px;padding:24px;">
    <div style="text-align:center;border-bottom:2px solid #C9A96E;padding-bottom:16px;margin-bottom:20px;">
      <h1 style="margin:0;color:#1a1a1a;font-size:22px;">${opts.companyName}</h1>
      <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">Invoice for service completed</p>
    </div>

    <p style="color:#1a1a1a;font-size:15px;">Hi ${opts.customerName},</p>
    <p style="color:#1a1a1a;font-size:15px;line-height:1.5;">
      Your <strong>${opts.service}</strong> has been completed. Here's your invoice:
    </p>

    <table style="width:100%;border-collapse:collapse;margin:20px 0;border-top:1px solid #ede8df;border-bottom:1px solid #ede8df;">
      ${items}
      <tr style="border-top:1px solid #ede8df;">
        <td style="padding:12px 0;color:#1a1a1a;font-weight:700;">Total</td>
        <td style="padding:12px 0;color:#A07840;font-weight:700;font-size:18px;text-align:right;">$${opts.total.toFixed(2)}</td>
      </tr>
    </table>

    ${opts.afterPhotoUrl ? `
      <div style="margin:20px 0;">
        <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">Photo of completed work:</p>
        <img src="${opts.afterPhotoUrl}" alt="After photo" style="width:100%;max-width:400px;border-radius:12px;border:1px solid #ede8df;" />
      </div>
    ` : ""}

    <p style="color:#6b7280;font-size:13px;line-height:1.5;margin-top:24px;">
      Thank you for choosing ${opts.companyName}. If you have any questions about this invoice, just reply to this email.
    </p>

    <p style="color:#A07840;font-size:13px;margin-top:16px;">— ${opts.companyName} 🌿</p>
  </div>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const {
    customerName, customerEmail, companyName, service, amount, lineItems, afterPhotoUrl,
  } = await req.json();

  if (!customerEmail) {
    return NextResponse.json({ error: "No customer email" }, { status: 400 });
  }

  const apiKey   = process.env.RESEND_API_KEY;
  const fromAddr = process.env.RESEND_FROM_EMAIL || "Douglas Landscaping <onboarding@resend.dev>";

  if (!apiKey) {
    return NextResponse.json({ preview: true, message: "Resend not configured — invoice would have been emailed." });
  }

  const html = buildHtml({
    customerName,
    companyName: companyName || "Douglas Landscaping Co.",
    service,
    total: Number(amount),
    lineItems: lineItems ?? [],
    afterPhotoUrl,
  });

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from:    fromAddr,
      to:      customerEmail,
      subject: `Invoice from ${companyName || "Douglas Landscaping Co."} — $${Number(amount).toFixed(2)}`,
      html,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

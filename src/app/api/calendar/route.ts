import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Escape a single iCal text field (per RFC 5545)
function ical(s: string): string {
  return (s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function utcStamp(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) + "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) + "Z"
  );
}

// Convert local Toronto date+time to UTC for iCal DTSTART/DTEND
function localToUtc(date: string, time: string): { start: string; end: string; allDay: boolean } {
  if (!time) {
    // All-day event
    return {
      start: date.replace(/-/g, ""),
      end:   date.replace(/-/g, ""),
      allDay: true,
    };
  }
  // Build a Date assuming it's already in America/Toronto. JS doesn't natively
  // construct Dates in a foreign timezone, so we use the trick of formatting
  // an Intl-aware string. For one-person ops this approximation is fine.
  const [h, m] = time.split(":").map(Number);
  const [y, mo, d] = date.split("-").map(Number);
  // Treat the input as Toronto-local; produce UTC by subtracting Toronto offset
  // for that date. EDT = -4h, EST = -5h. We'll use a quick check.
  const local = new Date(Date.UTC(y, mo - 1, d, h, m));
  // Determine offset for Toronto on this date
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    timeZoneName: "shortOffset",
  });
  const parts = fmt.formatToParts(local);
  const off   = parts.find(p => p.type === "timeZoneName")?.value ?? "GMT-5";
  // off looks like "GMT-4" or "GMT-5"
  const offHours = Number(off.replace("GMT", "")) || -5;
  const startUtc = new Date(local.getTime() - offHours * 3600 * 1000);
  const endUtc   = new Date(startUtc.getTime() + 60 * 60 * 1000); // default 1h duration
  return {
    start: utcStamp(startUtc),
    end:   utcStamp(endUtc),
    allDay: false,
  };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Missing token", { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return new Response("Server not configured", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verify token
  const { data: settings } = await supabase
    .from("settings")
    .select("calendar_token, company_name")
    .eq("id", 1)
    .single();
  if (!settings || settings.calendar_token !== token) {
    return new Response("Invalid token", { status: 403 });
  }

  // Fetch all jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, customer_name, customer_phone, address, service, date, time, notes, status")
    .order("date", { ascending: true });

  const companyName = (settings.company_name as string) ?? "Douglas Landscaping";
  const now = utcStamp(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Douglas Landscaping//Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${ical(companyName + " Schedule")}`,
    "X-WR-TIMEZONE:America/Toronto",
  ];

  for (const job of jobs ?? []) {
    const t = localToUtc(job.date as string, (job.time as string) ?? "");
    const summary = `${job.customer_name} – ${job.service}`;
    const desc = [
      `Customer: ${job.customer_name}`,
      job.customer_phone ? `Phone: ${job.customer_phone}` : "",
      `Status: ${job.status}`,
      job.notes ? `Notes: ${job.notes}` : "",
    ].filter(Boolean).join("\n");

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:job-${job.id}@douglaslandscaping`);
    lines.push(`DTSTAMP:${now}`);

    if (t.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${t.start}`);
      lines.push(`DTEND;VALUE=DATE:${t.end}`);
    } else {
      lines.push(`DTSTART:${t.start}`);
      lines.push(`DTEND:${t.end}`);
    }

    lines.push(`SUMMARY:${ical(summary)}`);
    if (desc)         lines.push(`DESCRIPTION:${ical(desc)}`);
    if (job.address)  lines.push(`LOCATION:${ical(job.address as string)}`);
    if (job.status === "completed") lines.push("STATUS:CONFIRMED");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  const body = lines.join("\r\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type":  "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

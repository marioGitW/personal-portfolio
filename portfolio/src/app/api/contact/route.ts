import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/contact";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { getResend } from "@/lib/resend";

// Every POST sends a real email, so this is the route worth limiting hardest.
const LIMIT = 5;
const WINDOW_SECONDS = 60 * 60;

export async function POST(request: Request) {
  const limit = await rateLimit(request, "contact", LIMIT, WINDOW_SECONDS);
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfter);
  }

  const body = await request.json().catch(() => null);
  const result = contactFormSchema.safeParse(body);

  if (!result.success) {
    // A flat field -> message map; the raw Zod issues stay server-side.
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fields[key] ??= issue.message;
    }
    return NextResponse.json({ error: "Invalid submission", fields }, { status: 400 });
  }

  const resend = getResend();
  const contactEmail = process.env.CONTACT_EMAIL;
  if (!resend || !contactEmail) {
    console.error("Contact form unconfigured: need RESEND_API_KEY and CONTACT_EMAIL");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { name, email, message } = result.data;

  const { error } = await resend.emails.send({
    from: "Portfolio <onboarding@resend.dev>",
    to: contactEmail,
    replyTo: email,
    subject: `New message from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });

  if (error) {
    console.error("Failed to send contact email", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

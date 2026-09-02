import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/contact";
import { resend } from "@/lib/resend";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = contactFormSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid submission", issues: result.error.issues },
      { status: 400 },
    );
  }

  const contactEmail = process.env.CONTACT_EMAIL;
  if (!contactEmail) {
    console.error("CONTACT_EMAIL is not configured");
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

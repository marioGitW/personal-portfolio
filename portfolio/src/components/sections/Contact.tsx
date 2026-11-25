"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, Loader2, Mail, MessageSquare, Send, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HudFrame, HudLabel } from "@/components/ui/hud-frame";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useHudReveal } from "@/hooks/useHudReveal";
import { contactFormResolver, type ContactFormValues } from "@/lib/contact";

type SubmitStatus = "idle" | "success" | "error";
type FieldName = keyof ContactFormValues;

export function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  useHudReveal(sectionRef);

  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [focusedField, setFocusedField] = useState<FieldName | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({ resolver: contactFormResolver });

  const onSubmit = async (values: ContactFormValues) => {
    setStatus("idle");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  };

  const fieldIconClass = (field: FieldName) =>
    `pointer-events-none absolute top-3.5 right-3 size-4 ${
      focusedField === field ? "field-icon-active" : "text-muted"
    }`;

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      ref={sectionRef}
      className="section-shell"
    >
      <div className="mx-auto max-w-2xl text-center">
        <SectionHeading
          titleId="contact-title"
          eyebrow="Contact"
          title="Get In Touch"
          accent="— Ask Me Anything!"
          description="Ready to collaborate or have a project in mind? I'm always open to new opportunities and interesting conversations."
        />
      </div>

      <HudFrame
        as="form"
        size="lg"
        reveal
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto mt-10 max-w-2xl px-6 py-8 sm:px-10 sm:py-10"
      >
        {/* The section's own eyebrow says it already. */}
        <div
          data-hud-item
          aria-hidden="true"
          className="relative flex items-center justify-between"
        >
          <HudLabel>Contact</HudLabel>
        </div>

        <div className="relative mt-8 flex flex-col gap-6">
          <label data-hud-item className="block">
            <span className="text-sm text-muted">Name</span>
            <span className="hud-field mt-1 block">
              <input
                type="text"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                className="block w-full py-2 pr-9 pl-3 text-foreground"
                {...register("name", {
                  onBlur: () => setFocusedField((current) => (current === "name" ? null : current)),
                })}
                onFocus={() => setFocusedField("name")}
              />
              <span aria-hidden="true" className="hud-field-corner hud-field-corner-tr" />
              <span aria-hidden="true" className="hud-field-corner hud-field-corner-bl" />
              <User className={fieldIconClass("name")} />
            </span>
            {errors.name && (
              <span
                id="name-error"
                role="alert"
                className="mt-1 block text-xs text-red-800 dark:text-red-300"
              >
                {errors.name.message}
              </span>
            )}
          </label>

          <label data-hud-item className="block">
            <span className="text-sm text-muted">Email</span>
            <span className="hud-field mt-1 block">
              <input
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="block w-full py-2 pr-9 pl-3 text-foreground"
                {...register("email", {
                  onBlur: () =>
                    setFocusedField((current) => (current === "email" ? null : current)),
                })}
                onFocus={() => setFocusedField("email")}
              />
              <span aria-hidden="true" className="hud-field-corner hud-field-corner-tr" />
              <span aria-hidden="true" className="hud-field-corner hud-field-corner-bl" />
              <Mail className={fieldIconClass("email")} />
            </span>
            {errors.email && (
              <span
                id="email-error"
                role="alert"
                className="mt-1 block text-xs text-red-800 dark:text-red-300"
              >
                {errors.email.message}
              </span>
            )}
          </label>

          <label data-hud-item className="block">
            <span className="text-sm text-muted">Message</span>
            <span className="hud-field mt-1 block">
              <textarea
                rows={4}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "message-error" : undefined}
                className="block w-full resize-none py-2 pr-9 pl-3 text-foreground"
                {...register("message", {
                  onBlur: () =>
                    setFocusedField((current) => (current === "message" ? null : current)),
                })}
                onFocus={() => setFocusedField("message")}
              />
              <span aria-hidden="true" className="hud-field-corner hud-field-corner-tr" />
              <span aria-hidden="true" className="hud-field-corner hud-field-corner-bl" />
              <MessageSquare className={fieldIconClass("message")} />
            </span>
            {errors.message && (
              <span
                id="message-error"
                role="alert"
                className="mt-1 block text-xs text-red-800 dark:text-red-300"
              >
                {errors.message.message}
              </span>
            )}
          </label>
        </div>

        <div data-hud-item className="mt-8">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full gap-2 py-3.25 font-semibold tracking-wide uppercase disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending
              </>
            ) : (
              <>
                Send Message
                <Send className="size-4" />
              </>
            )}
          </Button>
        </div>

        {/* Wrapper rather than aria-live on each <p>: a live region has to be
            in the DOM before its content changes to be announced. */}
        <div aria-live="polite">
          {status === "success" && (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="size-4" />
              Message sent — I&apos;ll get back to you soon.
            </p>
          )}

          {status === "error" && (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-red-800 dark:text-red-300">
              <AlertCircle className="size-4" />
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      </HudFrame>
    </section>
  );
}

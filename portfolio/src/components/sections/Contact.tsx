"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, Loader2, Mail, MessageSquare, Send, User } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { contactFormResolver, type ContactFormValues } from "@/lib/contact";

type SubmitStatus = "idle" | "success" | "error";
type FieldName = keyof ContactFormValues;

export function Contact() {
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
    `pointer-events-none absolute right-0 top-8 size-4 transition-colors ${
      focusedField === field ? "field-icon-active" : "text-muted"
    }`;

  return (
    <section id="contact" aria-labelledby="contact-title" className="section-shell">
      <div className="mx-auto max-w-2xl text-center">
        <SectionHeading
          titleId="contact-title"
          eyebrow="Contact"
          title="Get In Touch"
          accent="— Ask Me Anything!"
          description="Ready to collaborate or have a project in mind? I'm always open to new opportunities and interesting conversations."
        />
      </div>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto mt-10 max-w-2xl rounded-2xl surface-card p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-6">
          <label className="relative block">
            <span className="text-sm text-muted">Name</span>
            <input
              type="text"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              className="mt-1 w-full border-b border-border bg-surface py-2 pr-8 text-foreground outline-none transition focus:border-link"
              {...register("name", {
                onBlur: () => setFocusedField((current) => (current === "name" ? null : current)),
              })}
              onFocus={() => setFocusedField("name")}
            />
            <User className={fieldIconClass("name")} />
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

          <label className="relative block">
            <span className="text-sm text-muted">Email</span>
            <input
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="mt-1 w-full border-b border-border bg-surface py-2 pr-8 text-foreground outline-none transition focus:border-link"
              {...register("email", {
                onBlur: () => setFocusedField((current) => (current === "email" ? null : current)),
              })}
              onFocus={() => setFocusedField("email")}
            />
            <Mail className={fieldIconClass("email")} />
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

          <label className="relative block">
            <span className="text-sm text-muted">Message</span>
            <textarea
              rows={4}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "message-error" : undefined}
              className="mt-1 w-full resize-none border-b border-border bg-surface py-2 pr-8 text-foreground outline-none transition focus:border-link"
              {...register("message", {
                onBlur: () =>
                  setFocusedField((current) => (current === "message" ? null : current)),
              })}
              onFocus={() => setFocusedField("message")}
            />
            <MessageSquare className={fieldIconClass("message")} />
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-transparent bg-accent px-5 py-3 text-sm font-semibold tracking-wide text-accent-foreground uppercase transition duration-200 enabled:hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-2">
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
          </span>
        </button>

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
      </form>
    </section>
  );
}

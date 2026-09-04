"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, Loader2, Mail, MessageSquare, Send, User } from "lucide-react";
import gsap from "gsap";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { contactFormResolver, type ContactFormValues } from "@/lib/contact";
import { prefersReducedMotion, registerGsapPlugins } from "@/lib/animations";

type SubmitStatus = "idle" | "success" | "error";
type FieldName = keyof ContactFormValues;

export function Contact() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [focusedField, setFocusedField] = useState<FieldName | null>(null);
  const beamRef = useRef<HTMLSpanElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({ resolver: contactFormResolver });

  useEffect(() => {
    const beam = beamRef.current;
    if (!beam) return;

    if (prefersReducedMotion()) {
      return;
    }

    registerGsapPlugins();

    const beamTween = gsap.to(beam, {
      "--border-angle": "360deg",
      duration: 4,
      ease: "none",
      repeat: -1,
    });

    return () => {
      beamTween.kill();
    };
  }, []);

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
      focusedField === field ? "field-icon-active" : "text-slate-400"
    }`;

  return (
    <section id="contact" className="section-shell">
      <div className="mx-auto max-w-2xl text-center">
        <SectionHeading
          eyebrow="Contact"
          title="Get In Touch"
          accent="— Ask Me Anything!"
          description="Ready to collaborate or have a project in mind? I'm always open to new opportunities and interesting conversations."
        />
      </div>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto mt-10 max-w-2xl rounded-2xl surface-card p-6 shadow-lg shadow-indigo-500/10 sm:p-8"
      >
        <div className="flex flex-col gap-6">
          <label className="relative block">
            <span className="text-sm text-slate-500 dark:text-slate-400">Name</span>
            <input
              type="text"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              className="mt-1 w-full border-b border-slate-300 bg-transparent py-2 pr-8 text-foreground outline-none transition focus:border-indigo-500 dark:border-slate-700"
              {...register("name", {
                onBlur: () => setFocusedField((current) => (current === "name" ? null : current)),
              })}
              onFocus={() => setFocusedField("name")}
            />
            <User className={fieldIconClass("name")} />
            {errors.name && (
              <span className="mt-1 block text-xs text-red-800 dark:text-red-700">
                {errors.name.message}
              </span>
            )}
          </label>

          <label className="relative block">
            <span className="text-sm text-slate-500 dark:text-slate-400">Email</span>
            <input
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className="mt-1 w-full border-b border-slate-300 bg-transparent py-2 pr-8 text-foreground outline-none transition focus:border-indigo-500 dark:border-slate-700"
              {...register("email", {
                onBlur: () => setFocusedField((current) => (current === "email" ? null : current)),
              })}
              onFocus={() => setFocusedField("email")}
            />
            <Mail className={fieldIconClass("email")} />
            {errors.email && (
              <span className="mt-1 block text-xs text-red-800 dark:text-red-700">
                {errors.email.message}
              </span>
            )}
          </label>

          <label className="relative block">
            <span className="text-sm text-slate-500 dark:text-slate-400">Message</span>
            <textarea
              rows={4}
              aria-invalid={Boolean(errors.message)}
              className="mt-1 w-full resize-none border-b border-slate-300 bg-transparent py-2 pr-8 text-foreground outline-none transition focus:border-indigo-500 dark:border-slate-700"
              {...register("message", {
                onBlur: () =>
                  setFocusedField((current) => (current === "message" ? null : current)),
              })}
              onFocus={() => setFocusedField("message")}
            />
            <MessageSquare className={fieldIconClass("message")} />
            {errors.message && (
              <span className="mt-1 block text-xs text-red-800 dark:text-red-700">
                {errors.message.message}
              </span>
            )}
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="contact-submit border-beam-panel relative mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-foreground/20 px-5 py-3 text-sm font-semibold tracking-wide text-foreground uppercase transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span ref={beamRef} aria-hidden="true" className="border-beam" />
          <span className="relative z-10 inline-flex items-center gap-2">
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

        {status === "success" && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-500">
            <CheckCircle2 className="size-4" />
            Message sent — I&apos;ll get back to you soon.
          </p>
        )}

        {status === "error" && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-red-500">
            <AlertCircle className="size-4" />
            Something went wrong. Please try again.
          </p>
        )}
      </form>
    </section>
  );
}

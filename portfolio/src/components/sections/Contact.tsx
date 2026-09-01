"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, Loader2, Mail, MessageSquare, Send, User } from "lucide-react";
import { contactFormResolver, type ContactFormValues } from "@/lib/contact";

type SubmitStatus = "idle" | "success" | "error";

export function Contact() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
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

  return (
    <section id="contact" className="mx-auto w-full max-w-[1400px] px-4 py-28 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-heading text-xs tracking-[0.2em] text-slate-500 uppercase">Contact</p>
        <h2 className="mt-3">
          Get In Touch <span className="text-accent-gradient">— Ask Me Anything!</span>
        </h2>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          Ready to collaborate or have a project in mind? I&apos;m always open to new
          opportunities and interesting conversations.
        </p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto mt-10 max-w-2xl rounded-2xl border border-slate-200 bg-background p-6 shadow-lg shadow-indigo-500/10 sm:p-8 dark:border-slate-800"
      >
        <div className="flex flex-col gap-6">
          <label className="group relative block">
            <span className="text-sm text-slate-500 dark:text-slate-400">Name</span>
            <input
              type="text"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              className="mt-1 w-full border-b border-slate-300 bg-transparent py-2 pr-8 text-foreground outline-none transition focus:border-indigo-500 dark:border-slate-700"
              {...register("name")}
            />
            <User className="pointer-events-none absolute right-0 bottom-2.5 size-4 text-slate-400" />
            {errors.name && (
              <span className="mt-1 block text-xs text-red-500">{errors.name.message}</span>
            )}
          </label>

          <label className="group relative block">
            <span className="text-sm text-slate-500 dark:text-slate-400">Email</span>
            <input
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className="mt-1 w-full border-b border-slate-300 bg-transparent py-2 pr-8 text-foreground outline-none transition focus:border-indigo-500 dark:border-slate-700"
              {...register("email")}
            />
            <Mail className="pointer-events-none absolute right-0 bottom-2.5 size-4 text-slate-400" />
            {errors.email && (
              <span className="mt-1 block text-xs text-red-500">{errors.email.message}</span>
            )}
          </label>

          <label className="group relative block">
            <span className="text-sm text-slate-500 dark:text-slate-400">Message</span>
            <textarea
              rows={4}
              aria-invalid={Boolean(errors.message)}
              className="mt-1 w-full resize-none border-b border-slate-300 bg-transparent py-2 pr-8 text-foreground outline-none transition focus:border-indigo-500 dark:border-slate-700"
              {...register("message")}
            />
            <MessageSquare className="pointer-events-none absolute right-0 bottom-2.5 size-4 text-slate-400" />
            {errors.message && (
              <span className="mt-1 block text-xs text-red-500">{errors.message.message}</span>
            )}
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-indigo-500 px-5 py-3 text-sm font-semibold tracking-wide text-foreground uppercase transition hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
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

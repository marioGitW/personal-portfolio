import { z } from "zod";
import type { FieldErrors, Resolver } from "react-hook-form";

// Upper bounds sit far above any real submission; they exist so a huge payload
// can't be posted straight through to Resend.
export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100, "Name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email")
    .max(254, "Email is too long")
    .email("Enter a valid email address"),
  message: z
    .string()
    .trim()
    .min(10, "Message should be at least 10 characters")
    .max(5000, "Message is too long"),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const contactFormResolver: Resolver<ContactFormValues> = async (values) => {
  const result = contactFormSchema.safeParse(values);

  if (result.success) {
    return { values: result.data, errors: {} };
  }

  const errors = result.error.issues.reduce<FieldErrors<ContactFormValues>>((acc, issue) => {
    const key = issue.path[0] as keyof ContactFormValues;
    if (!acc[key]) {
      acc[key] = { type: issue.code, message: issue.message };
    }
    return acc;
  }, {});

  return { values: {}, errors };
};

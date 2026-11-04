"use client";

import { useEffect, useRef } from "react";
import { Download, X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

// The `download` attribute is ignored on cross-origin hrefs, and the PDF is
// served from the Sanity CDN, so the browser would open it in a tab instead of
// saving it. `?dl=` is how Sanity is asked for a Content-Disposition attachment.
function downloadHref(url: string, filename: string | null): string {
  return `${url}?dl=${encodeURIComponent(filename ?? "resume.pdf")}`;
}

type ResumeModalProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  /** CMS-resolved PDF URL. The caller only renders this modal once it has one. */
  url: string;
  filename: string | null;
};

export function ResumeModal({ open, onClose, triggerRef, url, filename }: ResumeModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const trigger = triggerRef.current;
    closeButtonRef.current?.focus();
    lockScroll();

    return () => {
      unlockScroll();
      trigger?.focus();
    };
  }, [open, triggerRef]);

  useFocusTrap(open, dialogRef, onClose);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm [animation:resume-modal-backdrop_0.25s_ease-out]"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Resume preview"
        onClick={(event) => event.stopPropagation()}
        className="relative flex h-[min(94vh,64rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl surface-card [animation:resume-modal-pop_0.25s_ease-out]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <h2 className="font-heading text-sm font-semibold tracking-tight">Resume</h2>
          <div className="flex items-center gap-2">
            <a
              href={downloadHref(url, filename)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition hover:border-foreground"
            >
              <Download className="size-3.5" />
              Download
            </a>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close resume preview"
              className="inline-flex size-8 items-center justify-center rounded-full border border-border transition hover:border-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-surface">
          <iframe
            src={url}
            title="Resume PDF"
            className="h-full min-h-[60rem] w-full sm:min-h-full"
          />
        </div>
      </div>
    </div>
  );
}

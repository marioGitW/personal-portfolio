"use client";

import { useEffect, useRef } from "react";
import { Download, X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

const RESUME_PATH = "/Spasovski_Mario_CV.pdf";

type ResumeModalProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};

export function ResumeModal({ open, onClose, triggerRef }: ResumeModalProps) {
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm [animation:resume-modal-backdrop_0.25s_ease-out]"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Resume preview"
        onClick={(event) => event.stopPropagation()}
        className="relative flex h-[min(94vh,64rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl surface-card shadow-2xl shadow-indigo-500/20 [animation:resume-modal-pop_0.25s_ease-out]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <h2 className="font-heading text-sm font-semibold tracking-tight">Resume</h2>
          <div className="flex items-center gap-2">
            <a
              href={RESUME_PATH}
              download
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium transition hover:border-indigo-500 dark:border-slate-700"
            >
              <Download className="size-3.5" />
              Download
            </a>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close resume preview"
              className="inline-flex size-8 items-center justify-center rounded-full border border-slate-300 transition hover:border-indigo-500 dark:border-slate-700"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-100 dark:bg-slate-900">
          <iframe
            src={RESUME_PATH}
            title="Resume PDF"
            className="h-full min-h-[60rem] w-full sm:min-h-full"
          />
        </div>
      </div>
    </div>
  );
}

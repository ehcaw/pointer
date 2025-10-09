"use client";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";

interface SupportModalProps {
  isSupportOpen: boolean;
  setIsSupportOpen: (open: boolean) => void;
  onModalOpen?: () => void;
}

const SupportModal = ({
  isSupportOpen,
  setIsSupportOpen,
  onModalOpen,
}: SupportModalProps) => {
  useEffect(() => {
    if (isSupportOpen && onModalOpen) {
      onModalOpen();
    }
  }, [isSupportOpen, onModalOpen]);

  return (
    <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="px-6 pt-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Support
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Get help and support for the Pointer application.
            </DialogDescription>
          </DialogHeader>

          <section className="mt-4 space-y-2 text-sm">
            <p>
              <span className="font-medium">Documentation:</span>{" "}
              <a
                href="https://docs.pointer.ink"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
              >
                docs.pointer.ink
              </a>
            </p>
            <p className="text-muted-foreground">
              If you want to report a bug, provide feedback, or request
              features, fill out this form.
            </p>
          </section>
        </div>

        <div className="mt-6 h-px w-full bg-border" />

        <section className="px-6 py-5 space-y-4">
          <header className="space-y-1">
            <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Feedback Form
            </h3>
            <p className="text-xs text-muted-foreground">
              Share an issue, idea, or request. We review every submission.
            </p>
          </header>

          <div
            id="pointer-survey-container"
            className="relative w-full rounded-md border border-border/70 bg-card/60 p-4 backdrop-blur-sm"
          >
            {/* PostHog injects survey here */}
            <div className="absolute inset-x-0 -bottom-5 h-5 pointer-events-none" />
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Your email (if asked) is used only for follow‑up. No marketing.
          </p>
        </section>

        <div className="mt-2 px-6 pb-4">
          <div className="h-px w-full bg-border" />
          {/* Extra spacer ensures PostHog branding (injected inside container) has breathing room */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupportModal;

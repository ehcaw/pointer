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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Support</DialogTitle>
          <DialogDescription>
            Get help and support for the Pointer application.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-6">
            <p className="text-sm">
              <strong>Documentation:</strong>{" "}
              <a
                href="https://docs.pointer.ink"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                docs.pointer.ink
              </a>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-6">
              If you want to report a bug, provide feedback, or request
              features, fill out this form!
            </p>
            <div id="pointer-survey-container" className="min-h-[300px] w-full">
              {/* Survey will be injected here by PostHog */}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupportModal;

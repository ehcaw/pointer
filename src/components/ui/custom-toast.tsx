"use client";
import { toast } from "sonner";

export const customToast = (text: string) => {
  return toast(text, {
    action: {
      label: "Dismiss",
      onClick: () => {},
    },
    actionButtonStyle: {
      backgroundColor: "transparent",
      color: "hsl(var(--muted-foreground))",
      border: "1px solid hsl(var(--border))",
    },
  });
};

export const customErrorToast = (text: string) => {
  return toast.error(text, {
    action: {
      label: "Dismiss",
      onClick: () => {},
    },
    actionButtonStyle: {
      backgroundColor: "transparent",
      color: "hsl(var(--muted-foreground))",
      border: "1px solid hsl(var(--border))",
    },
  });
};

export const customSuccessToast = (text: string) => {
  return toast.success(text, {
    action: {
      label: "Dismiss",
      onClick: () => {},
    },
    actionButtonStyle: {
      backgroundColor: "transparent",
      color: "hsl(var(--muted-foreground))",
      border: "1px solid hsl(var(--border))",
    },
  });
};

export const customInfoToast = (text: string) => {
  return toast.info(text, {
    action: {
      label: "Dismiss",
      onClick: () => {},
    },
    actionButtonStyle: {
      backgroundColor: "transparent",
      color: "hsl(var(--muted-foreground))",
      border: "1px solid hsl(var(--border))",
    },
  });
};

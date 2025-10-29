"use client";
import { toast } from "sonner";

export const customToast = (text: string) => {
  return toast(text, {
    action: {
      label: "Dismiss",
      onClick: () => {},
    },
  });
};

export const customErrorToast = (text: string) => {
  return toast.error(text, {
    action: {
      label: "Dismiss",
      onClick: () => {},
    },
  });
};

export const customSuccessToast = (text: string) => {
  return toast.success(text, {
    action: {
      label: "Dismiss",
      onClick: () => {},
    },
  });
};

export const customInfoToast = (text: string) => {
  return toast.info(text, {
    action: {
      label: "Dismiss",
      onClick: () => {},
    },
  });
};

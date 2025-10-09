"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

interface PostHogContextProviderProps {
  children: React.ReactNode;
}

export function PostHogContextProvider({
  children,
}: PostHogContextProviderProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: "/relay-zybeaskldfjkalsdjf-pointer",
        ui_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        person_profiles: "never", // Anonymous usage only
        capture_pageview: false,
        autocapture: false,
        disable_session_recording: true,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development") {
            posthog.debug();
          }
        },
      });
    }
  }, []);

  // No user identification - keep surveys anonymous

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

import type { NextConfig } from "next";

// const isProd = process.env.NODE_ENV === "production";

// const internalHost = process.env.TAURI_DEV_HOST || "localhost";

const nextConfig: NextConfig = {
  // output: "export",
  // // Note: This feature is required to use the Next.js Image component in SSG mode.
  // // See https://nextjs.org/docs/messages/export-image-api for different workarounds.
  // images: {
  //   unoptimized: true,
  // },
  // // Configure assetPrefix or else the server won't properly resolve your assets.
  // assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
  //
  async rewrites() {
    return [
      {
        source: "/relay-zybeaskldfjkalsdjf-pointer/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/relay-zybeaskldfjkalsdjf-pointer/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;

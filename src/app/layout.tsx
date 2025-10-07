import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/providers/auth/ConvexClientProvider";
import { CommandMenuProvider } from "@/providers/CommandMenuProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "pointer",
  description: "take notes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      signInFallbackRedirectUrl={"/main"}
      signUpFallbackRedirectUrl={"/main"}
      signInUrl="/"
      signUpUrl="/sign-up"
    >
      {/* Remove className="light" from here */}
      <html lang="en" suppressHydrationWarning={true}>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.add('light');
                }
              } catch (e) {}
            `,
            }}
          />
          <meta
            name="google-site-verification"
            content="fKXbpJa8x6USGALa2_OO8L4rwYc8UDSPOa5Tib7LLok"
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider defaultTheme="system" storageKey="theme">
            <ConvexClientProvider>
              <CommandMenuProvider>{children}</CommandMenuProvider>
              <Toaster position="top-right" />
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

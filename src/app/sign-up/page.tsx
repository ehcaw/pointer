"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import { Libre_Baskerville } from "next/font/google";

const libreBaskerville = Libre_Baskerville({
  weight: "400",
  subsets: ["latin"],
});

export default function SignUpPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/main");
    }
  }, [isSignedIn, isLoaded, router]);

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Don't render sign up if already signed in (prevents flash)
  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${libreBaskerville.className}`}>
      {/* Left Panel - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-stone-50 to-amber-50 px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <Image
              src="/images/pointerlogo-575-transparent.svg"
              alt="Pen icon"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
            <h1 className="text-2xl font-bold text-stone-800">Pointer</h1>
          </div>

          {/* Welcome Text */}
          <div className="space-y-2 text-center mb-8">
            <h2 className="text-3xl font-bold text-stone-900">Join Pointer</h2>
            <p className="text-stone-600">
              Start your journey of organized thoughts and seamless note-taking.
            </p>
          </div>

          {/* Clerk Sign Up Component */}
          <div className="flex justify-center">
            <SignUp
              routing="hash"
              signInUrl="/"
              forceRedirectUrl="/main"
              fallbackRedirectUrl="/main"
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-xl border border-stone-200 bg-white/95 backdrop-blur-sm",
                  headerTitle: "text-stone-900 font-bold",
                  headerSubtitle: "text-stone-600",
                  socialButtonsBlockButton:
                    "border border-stone-200 hover:bg-stone-50 transition-colors",
                  socialButtonsBlockButtonText: "text-stone-700 font-medium",
                  formFieldInput:
                    "border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent rounded-lg",
                  formButtonPrimary:
                    "bg-stone-900 hover:bg-stone-800 text-white font-medium py-3 rounded-lg transition-all duration-200",
                  footerActionLink:
                    "text-amber-600 hover:text-amber-700 font-medium",
                  identityPreviewText: "text-stone-700",
                  formFieldLabel: "text-stone-700 font-medium",
                  dividerLine: "bg-stone-200",
                  dividerText: "text-stone-500",
                },
              }}
            />
          </div>

          {/* Footer Links */}
          <div className="flex justify-center space-x-6 text-sm text-stone-500 pt-8">
            <a
              href="/terms-of-service"
              className="hover:text-stone-700 transition-colors"
            >
              Terms
            </a>
            <a
              href="/privacy-policy"
              className="hover:text-stone-700 transition-colors"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>

      {/* Right Panel - Classical Artwork */}
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
        {/* Classical painting as background */}
        <div className="absolute inset-0">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg/1200px-%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg"
            alt="The School of Athens"
            className="w-full h-full object-cover opacity-85"
            width={1200}
            height={800}
            unoptimized={true}
          />
          {/* Subtle overlay to soften the image */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-transparent to-stone-50/30"></div>
        </div>

        {/* Floating elegant elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Subtle decorative pen in corner */}
          <svg
            className="absolute top-8 right-8 text-amber-700/20 transform rotate-12"
            width="60"
            height="60"
            viewBox="0 0 200 200"
            fill="currentColor"
          >
            <path d="M50 180 L50 60 Q50 40 70 40 L90 40 Q100 40 105 50 L140 120 Q145 130 145 140 L145 160 Q145 170 135 170 L125 170 Q115 170 110 160 L80 100 Q75 90 70 100 L70 180 Z" />
            <circle cx="155" cy="45" r="8" />
            <path
              d="M70 185 Q80 190 90 185 Q100 180 110 185 Q120 190 130 185"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>

          {/* Elegant quote overlay */}
          <div className="absolute bottom-12 left-8 right-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-stone-200/50 max-w-md">
              <blockquote className="text-stone-700 font-serif italic text-lg leading-relaxed">
                &quot;A journey of a thousand miles begins with a single
                step.&quot;
              </blockquote>
              <cite className="text-stone-500 text-sm mt-2 block font-medium">
                — Lao Tzu
              </cite>
            </div>
          </div>

          {/* Subtle floating papers */}
          <div className="absolute top-1/3 right-12 transform rotate-6 opacity-30">
            <div className="w-20 h-24 bg-white/60 rounded-lg shadow-lg border border-stone-200/50">
              <div className="p-2 space-y-1">
                <div className="h-1 bg-stone-300/50 rounded"></div>
                <div className="h-1 bg-stone-300/30 rounded w-3/4"></div>
                <div className="h-1 bg-stone-300/30 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          {/* Academic flourish */}
          <div className="absolute top-1/4 left-8 opacity-25">
            <svg
              width="80"
              height="80"
              viewBox="0 0 100 100"
              className="text-amber-600"
            >
              <path
                d="M20 20 Q50 10 80 20 Q70 50 50 50 Q30 50 20 20"
                fill="currentColor"
                opacity="0.6"
              />
              <circle cx="60" cy="70" r="6" fill="currentColor" opacity="0.4" />
              <path
                d="M10 80 Q30 70 50 80 Q70 90 90 80"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                opacity="0.5"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

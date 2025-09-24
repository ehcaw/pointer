import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Libre_Baskerville } from "next/font/google";

const libreBaskerville = Libre_Baskerville({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Privacy Policy - Pointer",
  description: "Privacy Policy for Pointer application",
};

export default function PrivacyPolicy() {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 ${libreBaskerville.className}`}
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/images/pointerlogo-575-transparent.svg"
                alt="Pointer logo"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
              <span className="text-xl font-bold text-stone-800">Pointer</span>
            </Link>
            <Link
              href="/"
              className="text-stone-600 hover:text-stone-800 transition-colors font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        {/* Background classical elements */}
        <div className="absolute inset-0">
          {/* Subtle decorative elements */}
          <svg
            className="absolute top-20 right-20 text-amber-700/10 transform rotate-12"
            width="120"
            height="120"
            viewBox="0 0 200 200"
            fill="currentColor"
          >
            <path d="M50 180 L50 60 Q50 40 70 40 L90 40 Q100 40 105 50 L140 120 Q145 130 145 140 L145 160 Q145 170 135 170 L125 170 Q115 170 110 160 L80 100 Q75 90 70 100 L70 180 Z" />
            <circle cx="155" cy="45" r="8" />
          </svg>

          <div className="absolute top-1/3 left-10 opacity-15">
            <svg
              width="100"
              height="100"
              viewBox="0 0 100 100"
              className="text-amber-600"
            >
              <path
                d="M20 20 Q50 10 80 20 Q70 50 50 50 Q30 50 20 20"
                fill="currentColor"
                opacity="0.6"
              />
              <circle cx="60" cy="70" r="8" fill="currentColor" opacity="0.4" />
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

        {/* Main Content */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-stone-200 p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-stone-900 mb-4">
                Privacy Policy
              </h1>
              <p className="text-stone-600 text-lg">
                Your privacy matters to us. Here&quot;s how we protect your
                information.
              </p>
              <div className="mt-4 inline-block px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-stone-600 text-sm">
                  <strong>Last updated:</strong>{" "}
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-stone max-w-none prose-headings:text-stone-900 prose-p:text-stone-700 prose-li:text-stone-700">
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  1. Introduction
                </h2>
                <p className="text-stone-700 mb-4 leading-relaxed">
                  Welcome to Pointer (&quot;we,&quot; &quot;our,&quot; or
                  &quot;us&quot;). We are committed to protecting your privacy
                  and personal information. This Privacy Policy explains how we
                  collect, use, disclose, and safeguard your information when
                  you use our whiteboard application.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  2. Information We Collect
                </h2>

                <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-stone-800 mb-3">
                    2.1 Account Information
                  </h3>
                  <p className="text-stone-700 mb-4">
                    When you create an account, we collect:
                  </p>
                  <ul className="list-disc list-inside text-stone-700 space-y-2">
                    <li>Email address</li>
                    <li>Name (if provided)</li>
                    <li>Profile picture (if uploaded)</li>
                    <li>Authentication credentials</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-stone-800 mb-3">
                    2.2 Notes & Whiteboard Content
                  </h3>
                  <p className="text-stone-700 mb-4">
                    We store the notes you write and the content you create on
                    your whiteboards, including:
                  </p>
                  <ul className="list-disc list-inside text-stone-700 space-y-2">
                    <li>Drawings, sketches, and annotations</li>
                    <li>Text content</li>
                    <li>Whiteboard configurations and settings</li>
                    <li>Timestamps of creation and modification</li>
                  </ul>
                </div>

                {/*<div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-stone-800 mb-3">
                    2.3 Usage Information
                  </h3>
                  <p className="text-stone-700 mb-4">
                    We automatically collect certain information about your
                    usage:
                  </p>
                  <ul className="list-disc list-inside text-stone-700 space-y-2">
                    <li>IP address</li>
                    <li>Browser type and version</li>
                    <li>Device information</li>
                    <li>Usage patterns and preferences</li>
                  </ul>
                </div>*/}
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  3. How We Use Your Information
                </h2>
                <div className="bg-white border border-stone-200 rounded-lg p-6">
                  <p className="text-stone-700 mb-4">
                    We use your information to:
                  </p>
                  <ul className="list-disc list-inside text-stone-700 space-y-2">
                    <li>Provide and maintain our whiteboard service</li>
                    <li>
                      Save and sync your whiteboard content across devices
                    </li>
                    <li>Authenticate your account and ensure security</li>
                    <li>Improve our service and user experience</li>
                    <li>Communicate with you about service updates</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  4. Information Sharing and Disclosure
                </h2>
                <p className="text-stone-700 mb-4 leading-relaxed">
                  We do not sell, trade, or rent your personal information to
                  third parties. We may share your information only in the
                  following circumstances:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                    <h4 className="font-semibold text-stone-800 mb-2">
                      With your consent
                    </h4>
                    <p className="text-stone-700 text-sm">
                      When you explicitly agree to share information
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-stone-800 mb-2">
                      Service providers
                    </h4>
                    <p className="text-stone-700 text-sm">
                      With trusted third-party services that help us operate our
                      platform
                    </p>
                  </div>
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                    <h4 className="font-semibold text-stone-800 mb-2">
                      Legal compliance
                    </h4>
                    <p className="text-stone-700 text-sm">
                      When required by law or to protect our rights
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-stone-800 mb-2">
                      Business transfer
                    </h4>
                    <p className="text-stone-700 text-sm">
                      In connection with a merger, sale, or transfer of assets
                    </p>
                  </div>
                </div>
              </section>

              {/*<section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  5. Data Security
                </h2>
                <div className="bg-gradient-to-r from-stone-50 to-amber-50 border border-stone-200 rounded-lg p-6">
                  <p className="text-stone-700 mb-4 leading-relaxed">
                    We implement appropriate technical and organizational
                    security measures to protect your personal information
                    against unauthorized access, alteration, disclosure, or
                    destruction. This includes:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="list-disc list-inside text-stone-700 space-y-2">
                      <li>Encryption of data in transit and at rest</li>
                      <li>Regular security assessments</li>
                    </ul>
                    <ul className="list-disc list-inside text-stone-700 space-y-2">
                      <li>Access controls and authentication</li>
                      <li>Secure hosting infrastructure</li>
                    </ul>
                  </div>
                </div>
              </section>*/}

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  5. Your Rights
                </h2>
                <div className="bg-white border border-stone-200 rounded-lg p-6">
                  <p className="text-stone-700 mb-4">You have the right to:</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="list-disc list-inside text-stone-700 space-y-2">
                      <li>Access your personal information</li>
                      <li>Correct inaccurate or incomplete information</li>
                      <li>Delete your account and associated data</li>
                    </ul>
                    <ul className="list-disc list-inside text-stone-700 space-y-2">
                      <li>Export your whiteboard content</li>
                      <li>Opt out of non-essential communications</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  7. Contact Us
                </h2>
                <div className="bg-gradient-to-r from-amber-50 to-stone-50 border border-stone-200 rounded-lg p-6">
                  <p className="text-stone-700 mb-4">
                    If you have any questions about this Privacy Policy, please
                    contact us at:
                  </p>
                  <div className="bg-white/80 border border-stone-300 rounded-lg p-4">
                    <p className="text-stone-700">
                      <strong>Email:</strong> ryannguyenc@gmail.com
                      <br />
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-stone-200/50">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-stone-500 text-sm">
              © 2024 Pointer. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link
                href="/terms"
                className="text-stone-500 hover:text-stone-700 text-sm transition-colors font-medium"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="text-amber-600 hover:text-amber-700 text-sm transition-colors font-medium"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

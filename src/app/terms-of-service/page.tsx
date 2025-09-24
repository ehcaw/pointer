import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Libre_Baskerville } from "next/font/google";

const libreBaskerville = Libre_Baskerville({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Terms of Service - Pointer",
  description: "Terms of Service for Pointer application",
};

export default function TermsOfService() {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-amber-50 to-stone-50 ${libreBaskerville.className}`}
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
          {/* Subtle decorative quill */}
          <svg
            className="absolute top-32 left-20 text-amber-700/10 transform -rotate-12"
            width="100"
            height="100"
            viewBox="0 0 200 200"
            fill="currentColor"
          >
            <path d="M50 180 L50 60 Q50 40 70 40 L90 40 Q100 40 105 50 L140 120 Q145 130 145 140 L145 160 Q145 170 135 170 L125 170 Q115 170 110 160 L80 100 Q75 90 70 100 L70 180 Z" />
            <circle cx="155" cy="45" r="8" />
          </svg>

          {/* Decorative scroll */}
          <div className="absolute bottom-40 right-16 opacity-10">
            <svg
              width="120"
              height="80"
              viewBox="0 0 120 80"
              className="text-stone-600"
            >
              <path
                d="M10 10 Q60 5 110 10 Q105 40 60 40 Q15 40 10 10"
                fill="currentColor"
              />
              <path
                d="M20 50 L100 50 M20 60 L100 60 M20 70 L80 70"
                stroke="currentColor"
                strokeWidth="2"
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
                Terms of Service
              </h1>
              <p className="text-stone-600 text-lg">
                The terms that govern your use of Pointer.
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
                  1. Acceptance of Terms
                </h2>
                <div className="bg-gradient-to-r from-amber-50 to-stone-50 border border-stone-200 rounded-lg p-6">
                  <p className="text-stone-700 leading-relaxed">
                    By accessing and using Pointer(&quot;Service,&quot;
                    &quot;we, &quot;us,&quot; or &quot;our&quot;), you accept
                    and agree to be bound by the terms and provision of this
                    agreement. If you do not agree to abide by the above, please
                    do not use this service.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  2. Description of Service
                </h2>
                <div className="bg-white border border-stone-200 rounded-lg p-6">
                  <p className="text-stone-700 leading-relaxed">
                    Pointer is a digital note-taking application that allows
                    users to create, edit, and collaborate on visual content.
                    The Service includes features such as drawing tools, text
                    editing, shape creation, and content synchronization across
                    devices.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  3. User Accounts
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-stone-800 mb-3">
                      3.1 Account Creation
                    </h3>
                    <p className="text-stone-700 leading-relaxed">
                      To use certain features of our Service, you must create an
                      account. You agree to provide accurate, current, and
                      complete information during registration and to update
                      such information to keep it accurate, current, and
                      complete.
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-stone-800 mb-3">
                      3.2 Account Security
                    </h3>
                    <p className="text-stone-700 leading-relaxed">
                      You are responsible for safeguarding the password and for
                      maintaining the confidentiality of your account. You agree
                      not to disclose your password to any third party and to
                      take sole responsibility for all activities that occur
                      under your account.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  4. Acceptable Use Policy
                </h2>
                <div className="bg-gradient-to-r from-stone-50 to-amber-50 border border-stone-200 rounded-lg p-6">
                  <p className="text-stone-700 mb-4">
                    You agree not to use the Service to:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="list-disc list-inside text-stone-700 space-y-2">
                      <li>Violate any applicable laws or regulations</li>
                      <li>
                        Infringe on intellectual property rights of others
                      </li>
                      <li>
                        Upload or transmit harmful, offensive, or inappropriate
                        content
                      </li>
                      <li>
                        Attempt to gain unauthorized access to our systems
                      </li>
                    </ul>
                    <ul className="list-disc list-inside text-stone-700 space-y-2">
                      <li>Interfere with or disrupt the Service or servers</li>
                      <li>
                        Use the Service for any commercial purpose without our
                        consent
                      </li>
                      <li>Impersonate another person or entity</li>
                      <li>
                        Collect or harvest personal information from other users
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  5. Content and Intellectual Property
                </h2>

                <div className="space-y-6">
                  <div className="bg-white border border-stone-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-stone-800 mb-3">
                      5.1 Your Content
                    </h3>
                    <p className="text-stone-700 leading-relaxed">
                      You retain ownership of all content you create using our
                      Service. By using the Service, you grant us a
                      non-exclusive, worldwide, royalty-free license to use,
                      store, and display your content solely for the purpose of
                      providing the Service.
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-stone-800 mb-3">
                      5.2 Our Intellectual Property
                    </h3>
                    <p className="text-stone-700 leading-relaxed">
                      The Service and its original content, features, and
                      functionality are and will remain the exclusive property
                      of Pointer and its licensors. The Service is protected by
                      copyright, trademark, and other laws.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  6. Service Availability
                </h2>
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
                  <p className="text-stone-700 leading-relaxed">
                    We strive to maintain high availability of our Service, but
                    we do not guarantee uninterrupted access. We may experience
                    downtime due to maintenance, updates, or unforeseen
                    circumstances. We reserve the right to modify or discontinue
                    the Service at any time.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  7. Limitation of Liability
                </h2>
                <div className="bg-gradient-to-r from-amber-50 to-stone-50 border border-amber-200 rounded-lg p-6">
                  <p className="text-stone-700 leading-relaxed">
                    To the maximum extent permitted by applicable law, in no
                    event shall Pointer, its affiliates, officers, directors,
                    employees, agents, suppliers, or licensors be liable for any
                    indirect, punitive, incidental, special, consequential, or
                    exemplary damages, including without limitation damages for
                    loss of profits, goodwill, use, data, or other intangible
                    losses.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  8. Termination
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white border border-stone-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-stone-800 mb-3">
                      By Us
                    </h3>
                    <p className="text-stone-700 leading-relaxed">
                      We may terminate or suspend your account and bar access to
                      the Service immediately, without prior notice or
                      liability, under our sole discretion, for any reason
                      whatsoever and without limitation, including but not
                      limited to a breach of the Terms.
                    </p>
                  </div>
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-stone-800 mb-3">
                      By You
                    </h3>
                    <p className="text-stone-700 leading-relaxed">
                      You may terminate your account at any time by contacting
                      us or through your account settings. Upon termination,
                      your right to use the Service will cease immediately.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">
                  9. Contact Information
                </h2>
                <div className="bg-gradient-to-r from-stone-50 to-amber-50 border border-stone-200 rounded-lg p-6">
                  <p className="text-stone-700 mb-4">
                    If you have any questions about these Terms of Service,
                    please contact us at:
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
                href="/terms-of-service"
                className="text-amber-600 hover:text-amber-700 text-sm transition-colors font-medium"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="text-stone-500 hover:text-stone-700 text-sm transition-colors font-medium"
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

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Crown,
  Zap,
  Sparkles,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { PLANS, MESSAGE_PACK } from "@/lib/constants/plans";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  // For annual, give 2 months free (10/12 = ~17% discount)
  const annualPrice = Math.round((PLANS.pro.price * 10) / 12);

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#FAF8F5]/80 backdrop-blur-sm border-b border-[#E8E4DF]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#B8956F] to-[#8B7355] rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-xl text-[#3D3A35]">OpenDesign</span>
          </Link>
          <Link
            href="/home"
            className="px-4 py-2 bg-[#3D3A35] text-white rounded-lg text-sm font-medium hover:bg-[#2D2A25] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-serif text-4xl md:text-5xl text-[#3D3A35] mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-[#6B6459] max-w-xl mx-auto">
            Start for free, upgrade when you need more. No hidden fees.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span
            className={`text-sm font-medium ${
              !isAnnual ? "text-[#3D3A35]" : "text-[#6B6459]"
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isAnnual ? "bg-[#B8956F]" : "bg-[#E8E4DF]"
            }`}
          >
            <motion.div
              animate={{ x: isAnnual ? 24 : 2 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
            />
          </button>
          <span
            className={`text-sm font-medium ${
              isAnnual ? "text-[#3D3A35]" : "text-[#6B6459]"
            }`}
          >
            Annual
            <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
              2 months free
            </span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-[#E8E4DF] p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#F5F2EF] rounded-lg">
                <Zap className="w-5 h-5 text-[#6B6459]" />
              </div>
              <h2 className="text-xl font-semibold text-[#3D3A35]">Free</h2>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-[#3D3A35]">$0</span>
              <span className="text-[#6B6459]">/month</span>
            </div>

            <div className="flex items-center gap-2 mb-6 p-3 bg-[#F5F2EF] rounded-lg">
              <MessageSquare className="w-4 h-4 text-[#6B6459]" />
              <span className="text-sm text-[#3D3A35]">
                <strong>{PLANS.free.messagesPerMonth}</strong> AI generations/month
              </span>
            </div>

            <ul className="space-y-3 mb-6">
              {PLANS.free.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-[#6B6459]"
                >
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/home"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[#E8E4DF] text-[#3D3A35] rounded-xl font-medium hover:bg-[#F5F2EF] transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-6 relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              Most Popular
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-[#3D3A35]">Pro</h2>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-[#3D3A35]">
                ${isAnnual ? annualPrice : PLANS.pro.price}
              </span>
              <span className="text-[#6B6459]">/month</span>
              {isAnnual && (
                <span className="ml-2 text-sm text-green-600">
                  (${PLANS.pro.price * 10}/year)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-6 p-3 bg-white/60 rounded-lg">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-[#3D3A35]">
                <strong>{PLANS.pro.messagesPerMonth}</strong> AI generations/month
              </span>
            </div>

            <ul className="space-y-3 mb-6">
              {PLANS.pro.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-[#3D3A35]"
                >
                  <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/home"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-colors"
            >
              Upgrade to Pro
              <Crown className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Message Pack Add-on */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto mt-8"
        >
          <div className="bg-white rounded-xl border border-[#E8E4DF] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F5F2EF] rounded-lg">
                <Zap className="w-5 h-5 text-[#B8956F]" />
              </div>
              <div>
                <p className="font-medium text-[#3D3A35]">Need more messages?</p>
                <p className="text-sm text-[#6B6459]">
                  Pro users can purchase extra message packs
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#3D3A35]">
                ${MESSAGE_PACK.priceUsd}
              </p>
              <p className="text-sm text-[#6B6459]">
                for {MESSAGE_PACK.messages} messages
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto mt-16"
        >
          <h2 className="font-serif text-2xl text-[#3D3A35] text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <details className="bg-white rounded-xl border border-[#E8E4DF] p-4 group">
              <summary className="font-medium text-[#3D3A35] cursor-pointer list-none flex items-center justify-between">
                What counts as a &quot;message&quot;?
                <span className="text-[#6B6459] group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-3 text-sm text-[#6B6459]">
                Each AI generation request counts as one message. This includes
                creating new screens and editing existing ones. Viewing, exporting,
                or navigating your designs does not count.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-[#E8E4DF] p-4 group">
              <summary className="font-medium text-[#3D3A35] cursor-pointer list-none flex items-center justify-between">
                What&apos;s the difference between Flash and Pro models?
                <span className="text-[#6B6459] group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-3 text-sm text-[#6B6459]">
                Flash is faster and great for quick iterations. Pro produces higher
                quality designs with more attention to detail. Free users have access
                to Flash only, while Pro subscribers can use both.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-[#E8E4DF] p-4 group">
              <summary className="font-medium text-[#3D3A35] cursor-pointer list-none flex items-center justify-between">
                Do unused messages roll over?
                <span className="text-[#6B6459] group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-3 text-sm text-[#6B6459]">
                Monthly message allowances reset at the start of each billing cycle.
                However, any extra message packs you purchase never expire.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-[#E8E4DF] p-4 group">
              <summary className="font-medium text-[#3D3A35] cursor-pointer list-none flex items-center justify-between">
                Can I cancel anytime?
                <span className="text-[#6B6459] group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-3 text-sm text-[#6B6459]">
                Yes! You can cancel your subscription at any time. You&apos;ll continue
                to have Pro access until the end of your current billing period.
              </p>
            </details>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E4DF] py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-[#6B6459]">
          <p>© 2024 OpenDesign. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

"use client";

/**
 * Quota Exceeded Banner
 *
 * A refined inline banner that shows when the user has no messages remaining.
 * - Compact mode: Simple text link for chat interface
 * - Full mode: Detailed cards with pricing info for home page
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Key, Sparkles, Infinity } from "lucide-react";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { PLANS, MESSAGE_PACK } from "@/lib/constants/plans";

interface QuotaExceededBannerProps {
  compact?: boolean;
}

export function QuotaExceededBanner({ compact = false }: QuotaExceededBannerProps) {
  const { plan } = useSubscription();

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-3"
      >
        <p className="text-sm text-[#6B6459]">
          No messages remaining •{" "}
          <Link href="/home/settings" className="text-[#B8956F] hover:underline font-medium">
            Get more
          </Link>
        </p>
      </motion.div>
    );
  }

  // Full version with more details for home page
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="text-center">
        <p className="text-sm text-[#6B6459]">
          You&apos;ve used all your messages this month
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Upgrade / Buy Messages Option */}
        <Link href="/home/settings">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl text-white transition-all shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4" />
              <span className="font-semibold">
                {plan === "pro" ? "Buy More Messages" : "Upgrade to Pro"}
              </span>
            </div>
            <p className="text-xs text-white/80">
              {plan === "pro" ? (
                <>${MESSAGE_PACK.priceUsd} for {MESSAGE_PACK.messages} messages</>
              ) : (
                <>
                  ${PLANS.pro.price}/month • {PLANS.pro.messagesPerMonth} messages
                </>
              )}
            </p>
            {plan !== "pro" && (
              <div className="flex items-center gap-1 mt-2 text-xs text-white/70">
                <Sparkles className="w-3 h-3" />
                <span>Access all AI models</span>
              </div>
            )}
          </motion.div>
        </Link>

        {/* API Key Option */}
        <Link href="/home/settings">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-[#F5F2EF] hover:bg-[#EBE8E3] border border-[#E8E4E0] rounded-xl transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-[#1A1A1A]" />
              <span className="font-semibold text-[#1A1A1A]">Use Your Own API Key</span>
            </div>
            <p className="text-xs text-[#6B6459]">
              Connect OpenRouter or Gemini API
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-[#6B6459]">
              <Infinity className="w-3 h-3" />
              <span>Unlimited messages, all models</span>
            </div>
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
}

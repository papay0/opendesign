"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Crown, AlertCircle } from "lucide-react";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { PLANS } from "@/lib/constants/plans";

interface SubscriptionBannerProps {
  onUpgradeClick?: () => void;
}

export function SubscriptionBanner({ onUpgradeClick }: SubscriptionBannerProps) {
  const {
    plan,
    messagesRemaining,
    messagesLimit,
    isLoading,
    upgradeToProUrl,
  } = useSubscription();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (onUpgradeClick) {
      onUpgradeClick();
      return;
    }

    setIsUpgrading(true);
    const url = await upgradeToProUrl();
    if (url) {
      window.location.href = url;
    }
    setIsUpgrading(false);
  };

  if (isLoading) {
    return (
      <div className="h-8 bg-[#E8E4DF] rounded-lg animate-pulse w-32" />
    );
  }

  const isLow = messagesRemaining <= Math.ceil(messagesLimit * 0.2);
  const isOut = messagesRemaining <= 0;
  const planConfig = PLANS[plan];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2"
    >
      {/* Plan Badge */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          plan === "pro"
            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
            : "bg-[#E8E4DF] text-[#6B6459]"
        }`}
      >
        {plan === "pro" ? (
          <Crown className="w-3 h-3" />
        ) : (
          <Zap className="w-3 h-3" />
        )}
        <span className="capitalize">{planConfig.name}</span>
      </div>

      {/* Messages Counter */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          isOut
            ? "bg-red-100 text-red-700"
            : isLow
            ? "bg-amber-100 text-amber-700"
            : "bg-[#E8E4DF] text-[#6B6459]"
        }`}
      >
        {isOut && <AlertCircle className="w-3 h-3" />}
        <span>
          {messagesRemaining}/{messagesLimit} messages
        </span>
      </div>

      {/* Upgrade Button (for free users) */}
      {plan === "free" && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUpgrade}
          disabled={isUpgrading}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-50"
        >
          <Crown className="w-3 h-3" />
          {isUpgrading ? "..." : "Upgrade"}
        </motion.button>
      )}
    </motion.div>
  );
}

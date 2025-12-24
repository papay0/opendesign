"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check, Zap, Sparkles } from "lucide-react";
import { PLANS, MESSAGE_PACK } from "@/lib/constants/plans";
import { useSubscription } from "@/lib/hooks/useSubscription";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: "quota_exceeded" | "model_restricted" | "voluntary";
}

export function UpgradeModal({ isOpen, onClose, reason = "voluntary" }: UpgradeModalProps) {
  const { plan, upgradeToProUrl, purchaseMessagesUrl } = useSubscription();
  const [isLoading, setIsLoading] = useState<"pro" | "messages" | null>(null);

  const handleUpgradeToPro = async () => {
    setIsLoading("pro");
    const url = await upgradeToProUrl();
    if (url) {
      window.location.href = url;
    }
    setIsLoading(null);
  };

  const handlePurchaseMessages = async () => {
    setIsLoading("messages");
    const url = await purchaseMessagesUrl();
    if (url) {
      window.location.href = url;
    }
    setIsLoading(null);
  };

  const reasonMessages = {
    quota_exceeded: "You've used all your messages this month",
    model_restricted: "Pro model access requires an upgrade",
    voluntary: "Unlock more power with Pro",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {reason === "voluntary" ? "Upgrade to Pro" : "Need More Power?"}
                    </h2>
                    <p className="text-white/80 text-sm mt-0.5">
                      {reasonMessages[reason]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Pro Plan Card */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpgradeToPro}
                  disabled={isLoading !== null || plan === "pro"}
                  className="w-full text-left p-4 rounded-xl border-2 border-amber-200 bg-amber-50 hover:border-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                        <span className="font-semibold text-[#3D3A35]">
                          Pro Plan
                        </span>
                        {plan === "pro" && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#6B6459] mt-1">
                        {PLANS.pro.messagesPerMonth} messages/month, Pro + Flash models
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-[#3D3A35]">
                        ${PLANS.pro.price}
                      </div>
                      <div className="text-xs text-[#6B6459]">/month</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {PLANS.pro.features.slice(0, 4).map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-1 text-xs text-[#6B6459]"
                      >
                        <Check className="w-3 h-3 text-green-600" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {plan !== "pro" && (
                    <div className="mt-4 w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center rounded-lg font-medium text-sm">
                      {isLoading === "pro" ? "Loading..." : "Upgrade Now"}
                    </div>
                  )}
                </motion.button>

                {/* Message Pack (only for Pro users) */}
                {plan === "pro" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePurchaseMessages}
                    disabled={isLoading !== null}
                    className="w-full text-left p-4 rounded-xl border-2 border-[#E8E4DF] bg-white hover:border-[#B8956F] transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-[#B8956F]" />
                          <span className="font-semibold text-[#3D3A35]">
                            Message Pack
                          </span>
                        </div>
                        <p className="text-sm text-[#6B6459] mt-1">
                          +{MESSAGE_PACK.messages} extra messages
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-[#3D3A35]">
                          ${MESSAGE_PACK.priceUsd}
                        </div>
                        <div className="text-xs text-[#6B6459]">one-time</div>
                      </div>
                    </div>

                    <div className="mt-4 w-full py-2 bg-[#3D3A35] text-white text-center rounded-lg font-medium text-sm">
                      {isLoading === "messages" ? "Loading..." : "Purchase"}
                    </div>
                  </motion.button>
                )}

                {/* Free Plan Reference */}
                {plan === "free" && (
                  <div className="p-4 rounded-xl border border-[#E8E4DF] bg-[#F5F2EF]">
                    <div className="flex items-center gap-2 text-[#6B6459]">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-medium">Current: Free Plan</span>
                    </div>
                    <p className="text-xs text-[#9C9589] mt-1">
                      {PLANS.free.messagesPerMonth} messages/month, Flash model only
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

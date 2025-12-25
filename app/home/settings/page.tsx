"use client";

/**
 * Settings Page - Subscription & API Key Configuration
 *
 * A clean, organized settings page with two main sections:
 * 1. Subscription - Current plan, usage stats, upgrade options
 * 2. API Keys - BYOK (Bring Your Own Key) configuration
 *
 * Design: Editorial/Magazine aesthetic with warm colors
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
  Shield,
  Zap,
  Sparkles,
  Trash2,
  Crown,
  CreditCard,
  Calendar,
  AlertCircle,
  ChevronRight,
  Infinity,
  Loader2,
} from "lucide-react";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useBYOK } from "@/lib/hooks/useBYOK";
import { PLANS, MESSAGE_PACK } from "@/lib/constants/plans";
import { SegmentedControl } from "@/app/home/components/SegmentedControl";
import type { BillingInterval } from "@/lib/stripe";

// ============================================================================
// Types
// ============================================================================

type Provider = "openrouter" | "gemini";
type SettingsSection = "subscription" | "api-keys";

interface ApiConfig {
  key: string;
  provider: Provider;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "opendesign_api_config";

const PROVIDERS = [
  {
    id: "openrouter" as Provider,
    name: "OpenRouter",
    description: "Access 100+ models with no rate limits",
    recommended: true,
    setupUrl: "https://openrouter.ai/keys",
    placeholder: "sk-or-v1-...",
    icon: Zap,
  },
  {
    id: "gemini" as Provider,
    name: "Google Gemini",
    description: "Direct access for Tier 2+ accounts",
    recommended: false,
    setupUrl: "https://aistudio.google.com/apikey",
    placeholder: "AIza...",
    icon: Sparkles,
  },
];

// Section options are now built dynamically in the component
// to include isActiveMode based on BYOK state

// ============================================================================
// Animation Variants
// ============================================================================

const contentVariants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ============================================================================
// Helper Functions
// ============================================================================

function getStoredConfig(): ApiConfig | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function saveConfig(config: ApiConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  // Dispatch event so useBYOK hook updates reactively
  window.dispatchEvent(new CustomEvent("byok-config-changed"));
}

function clearConfig() {
  localStorage.removeItem(STORAGE_KEY);
  // Dispatch event so useBYOK hook updates reactively
  window.dispatchEvent(new CustomEvent("byok-config-changed"));
}

// ============================================================================
// Component: Provider Card (Compact)
// ============================================================================

function ProviderCard({
  provider,
  isSelected,
  onSelect,
}: {
  provider: (typeof PROVIDERS)[0];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = provider.icon;

  return (
    <button
      onClick={onSelect}
      className={`relative w-full text-left p-3 rounded-xl border transition-all ${
        isSelected
          ? "border-[#B8956F] bg-[#B8956F]/5"
          : "border-[#E8E4E0] hover:border-[#D4CFC9] bg-white"
      }`}
    >
      {provider.recommended && (
        <span className="absolute -top-2 right-3 text-[10px] bg-[#B8956F] text-white font-medium px-2 py-0.5 rounded-full">
          Recommended
        </span>
      )}

      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isSelected ? "bg-[#B8956F]/10" : "bg-[#F5F2EF]"
          }`}
        >
          <Icon
            className={`w-4 h-4 ${isSelected ? "text-[#B8956F]" : "text-[#9A9A9A]"}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-[#1A1A1A]">{provider.name}</h3>
            {isSelected && <Check className="w-3.5 h-3.5 text-[#B8956F]" />}
          </div>
          <p className="text-xs text-[#6B6B6B] truncate">{provider.description}</p>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// Component: Subscription Section (Warm Editorial Design)
// ============================================================================

function SubscriptionSection() {
  const {
    plan,
    messagesRemaining,
    messagesLimit,
    messagesResetAt,
    subscription,
    isLoading,
    upgradeToProUrl,
    purchaseMessagesUrl,
    manageSubscriptionUrl,
  } = useSubscription();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [billingChoice, setBillingChoice] = useState<BillingInterval>('annual');

  const annualTotal = PLANS.pro.price * 10; // $150/year
  const annualPrice = annualTotal / 12; // $12.50/month

  const handleUpgrade = async (interval: BillingInterval) => {
    setBillingChoice(interval);
    setActionLoading("upgrade");
    const url = await upgradeToProUrl(interval);
    if (url) {
      window.location.href = url;
    }
    setActionLoading(null);
  };

  const handleAction = async (action: "purchase" | "manage") => {
    setActionLoading(action);
    let url: string | null = null;

    if (action === "purchase") {
      url = await purchaseMessagesUrl();
    } else {
      url = await manageSubscriptionUrl();
    }

    if (url) {
      window.location.href = url;
    }
    setActionLoading(null);
  };

  const planConfig = PLANS[plan];
  const resetDate = messagesResetAt ? new Date(messagesResetAt) : null;
  const daysUntilReset = resetDate
    ? Math.max(0, Math.ceil((new Date(resetDate.getTime() + 30 * 24 * 60 * 60 * 1000).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30;
  const usagePercent = ((messagesLimit - messagesRemaining) / messagesLimit) * 100;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-28 bg-gradient-to-br from-[#F5F2EF] to-[#E8E4E0] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 bg-[#F5F2EF] rounded-2xl animate-pulse" />
          <div className="h-80 bg-[#F5F2EF] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Status Banner - Warm Light Theme */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50/50 to-transparent rounded-2xl" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #B8956F 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative p-6 rounded-2xl border border-amber-200/60">
          <div className="flex items-center justify-between">
            {/* Left - Plan Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center border border-amber-200/50">
                  {plan === "pro" ? (
                    <Crown className="w-7 h-7 text-amber-600" />
                  ) : (
                    <Zap className="w-7 h-7 text-amber-600" />
                  )}
                </div>
                {plan === "pro" && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-amber-700/70 uppercase tracking-wider mb-0.5">Your Plan</p>
                <h3 className="text-2xl font-serif text-[#3D3A35]">{planConfig.name}</h3>
              </div>
            </div>

            {/* Right - Usage Stats */}
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-xs text-[#9A9A9A] mb-1">Messages this month</p>
                <div className="flex items-baseline gap-1.5 justify-end">
                  <span className={`text-3xl font-bold ${messagesRemaining <= 0 ? 'text-red-500' : messagesRemaining <= messagesLimit * 0.2 ? 'text-amber-600' : 'text-[#3D3A35]'}`}>
                    {messagesRemaining}
                  </span>
                  <span className="text-[#9A9A9A] text-lg">/ {messagesLimit}</span>
                </div>
              </div>

              {/* Visual progress bar */}
              <div className="w-32">
                <div className="flex justify-between text-xs text-[#9A9A9A] mb-1.5">
                  <span>Used</span>
                  <span>{Math.round(usagePercent)}%</span>
                </div>
                <div className="h-2.5 bg-amber-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usagePercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      messagesRemaining <= 0 ? 'bg-red-400' :
                      messagesRemaining <= messagesLimit * 0.2 ? 'bg-amber-500' :
                      'bg-gradient-to-r from-amber-400 to-orange-400'
                    }`}
                  />
                </div>
                <p className="text-xs text-[#9A9A9A] mt-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Resets in {daysUntilReset} days
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Upgrade Section - For Free Users */}
      {plan === "free" && (
        <div className="space-y-8">
          {/* Marketing Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center max-w-lg mx-auto"
          >
            <h2 className="font-serif text-3xl text-[#3D3A35] mb-3">
              Unlock Your Creative Potential
            </h2>
            <p className="text-[#6B6459] text-lg">
              Join thousands of designers creating with Pro
            </p>
          </motion.div>

          {/* Equal Height Pricing Cards */}
          <div className="grid grid-cols-2 gap-6">
            {/* Monthly Card */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(184, 149, 111, 0.15)' }}
              onClick={() => handleUpgrade('monthly')}
              disabled={actionLoading !== null}
              className="relative text-left rounded-2xl border-2 border-[#E8E4E0] bg-white p-6 transition-all disabled:opacity-50 group h-full flex flex-col"
            >
              {/* Card Content */}
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider mb-4">Monthly</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-[#3D3A35]">${PLANS.pro.price}</span>
                    <span className="text-xl text-[#9A9A9A]">/mo</span>
                  </div>
                  <p className="text-sm text-[#9A9A9A] mt-1">Billed monthly</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-[#6B6459]">
                    <div className="w-5 h-5 rounded-full bg-[#F5F2EF] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#B8956F]" />
                    </div>
                    <span>50 AI generations/month</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#6B6459]">
                    <div className="w-5 h-5 rounded-full bg-[#F5F2EF] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#B8956F]" />
                    </div>
                    <span>Flash + Pro models</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#6B6459]">
                    <div className="w-5 h-5 rounded-full bg-[#F5F2EF] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#B8956F]" />
                    </div>
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#6B6459]">
                    <div className="w-5 h-5 rounded-full bg-[#F5F2EF] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#B8956F]" />
                    </div>
                    <span>Code export</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="w-full py-3.5 border-2 border-[#E8E4DF] text-[#3D3A35] text-center rounded-xl font-semibold group-hover:border-[#B8956F] group-hover:bg-[#B8956F]/5 transition-all">
                {actionLoading === "upgrade" && billingChoice === 'monthly' ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Choose Monthly"
                )}
              </div>
            </motion.button>

            {/* Annual Card - Highlighted */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -4, boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.25)' }}
              onClick={() => handleUpgrade('annual')}
              disabled={actionLoading !== null}
              className="relative text-left rounded-2xl p-6 transition-all disabled:opacity-50 group h-full flex flex-col bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border-2 border-amber-200"
            >
              {/* Best Value Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  BEST VALUE
                </div>
              </div>

              {/* Card Content */}
              <div className="flex-1 mt-2">
                <p className="text-xs font-semibold text-amber-700/70 uppercase tracking-wider mb-4">Annual</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-[#3D3A35]">${annualPrice.toFixed(2)}</span>
                    <span className="text-xl text-[#6B6459]">/mo</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-[#6B6459]">${annualTotal}/year</span>
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      Save $30
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-[#3D3A35]">
                    <div className="w-5 h-5 rounded-full bg-amber-200/60 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-amber-700" />
                    </div>
                    <span className="font-medium">50 AI generations/month</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#3D3A35]">
                    <div className="w-5 h-5 rounded-full bg-amber-200/60 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-amber-700" />
                    </div>
                    <span className="font-medium">Flash + Pro models</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#3D3A35]">
                    <div className="w-5 h-5 rounded-full bg-amber-200/60 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-amber-700" />
                    </div>
                    <span className="font-medium">2 months FREE</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#3D3A35]">
                    <div className="w-5 h-5 rounded-full bg-amber-200/60 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-amber-700" />
                    </div>
                    <span className="font-medium">Priority support</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center rounded-xl font-semibold shadow-lg shadow-amber-500/25 group-hover:shadow-xl group-hover:shadow-amber-500/35 transition-all">
                {actionLoading === "upgrade" && billingChoice === 'annual' ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Get 2 Months Free
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </div>
            </motion.button>
          </div>

          {/* Trust Signal */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-[#9A9A9A]"
          >
            <Shield className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Secure payment via Stripe • Cancel anytime
          </motion.p>
        </div>
      )}

      {/* Pro User Actions */}
      {plan === "pro" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4"
        >
          <button
            onClick={() => handleAction("purchase")}
            disabled={actionLoading !== null}
            className="flex items-center gap-4 p-5 bg-white border border-[#E8E4DF] hover:border-[#B8956F] rounded-xl transition-all disabled:opacity-50 group"
          >
            <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
              {actionLoading === "purchase" ? (
                <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-[#3D3A35]">Buy More Messages</p>
              <p className="text-sm text-[#9A9A9A]">+{MESSAGE_PACK.messages} for ${MESSAGE_PACK.priceUsd}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#9A9A9A] group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => handleAction("manage")}
            disabled={actionLoading !== null}
            className="flex items-center gap-4 p-5 bg-white border border-[#E8E4DF] hover:border-[#B8956F] rounded-xl transition-all disabled:opacity-50 group"
          >
            <div className="p-3 bg-gradient-to-br from-[#F5F2EF] to-[#E8E4E0] rounded-xl border border-[#E8E4DF]">
              {actionLoading === "manage" ? (
                <Loader2 className="w-5 h-5 text-[#6B6459] animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5 text-[#6B6459]" />
              )}
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-[#3D3A35]">Manage Subscription</p>
              <p className="text-sm text-[#9A9A9A]">Payment, invoices & more</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#9A9A9A] group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      )}

      {/* Subscription Status for Pro users */}
      {plan === "pro" && subscription && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 text-sm text-[#9A9A9A] pt-2"
        >
          <Calendar className="w-4 h-4" />
          <span>
            {subscription.cancel_at_period_end ? "Access ends" : "Renews"} on{" "}
            {subscription.current_period_end
              ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              : "N/A"}
          </span>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// Component: API Keys Section
// ============================================================================

function ApiKeysSection() {
  const [selectedProvider, setSelectedProvider] = useState<Provider>("openrouter");
  const [apiKey, setApiKey] = useState("");
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);

  // Load existing config on mount
  useEffect(() => {
    const config = getStoredConfig();
    if (config) {
      setSelectedProvider(config.provider);
      setApiKey(config.key);
      setHasExistingConfig(true);
    }
  }, []);

  // Save config
  const handleSave = () => {
    if (!apiKey.trim()) return;

    saveConfig({
      key: apiKey.trim(),
      provider: selectedProvider,
    });

    setIsSaved(true);
    setHasExistingConfig(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Clear config
  const handleClear = () => {
    if (!confirm("Are you sure you want to remove your API key?")) return;

    clearConfig();
    setApiKey("");
    setHasExistingConfig(false);
  };

  const selectedProviderData = PROVIDERS.find((p) => p.id === selectedProvider)!;

  return (
    <div className="space-y-5">
      {/* Status Card */}
      {hasExistingConfig && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-emerald-800 text-sm">API Key Configured</p>
            <p className="text-xs text-emerald-600">Using {selectedProviderData.name}</p>
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-[#1A1A1A]">Select Provider</h3>
        <div className="grid grid-cols-1 gap-2">
          {PROVIDERS.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isSelected={selectedProvider === provider.id}
              onSelect={() => setSelectedProvider(provider.id)}
            />
          ))}
        </div>
      </div>

      {/* API Key Input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#1A1A1A]">
            {selectedProviderData.name} API Key
          </label>
          <a
            href={selectedProviderData.setupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#B8956F] hover:text-[#A6845F] flex items-center gap-1 transition-colors"
          >
            Get your key
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="relative">
          <input
            type={isKeyVisible ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={selectedProviderData.placeholder}
            className="w-full bg-white border border-[#E8E4E0] rounded-xl px-4 py-3 pr-12 text-[#1A1A1A] placeholder-[#9A9A9A] focus:outline-none focus:border-[#B8956F] focus:ring-2 focus:ring-[#B8956F]/10 transition-all font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setIsKeyVisible(!isKeyVisible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-[#6B6B6B] transition-colors"
            title={isKeyVisible ? "Hide API key" : "Show API key"}
          >
            {isKeyVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
              isSaved
                ? "bg-emerald-500 text-white"
                : "bg-[#B8956F] text-white hover:bg-[#A6845F]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaved ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : (
              "Save API Key"
            )}
          </button>

          {hasExistingConfig && (
            <button
              onClick={handleClear}
              className="px-4 py-3 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-emerald-800 text-sm mb-1.5">
              Your key stays private
            </h4>
            <ul className="text-xs text-emerald-700 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                Stored only in your browser
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                Never saved to our servers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                Sent via HTTPS when generating
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* How to Get Keys */}
      <details className="group rounded-xl border border-[#E8E4E0] bg-white overflow-hidden">
        <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F5F2EF] transition-colors">
          <span className="text-sm font-medium text-[#1A1A1A]">How to get an API key</span>
          <ChevronRight className="w-4 h-4 text-[#9A9A9A] group-open:rotate-90 transition-transform" />
        </summary>
        <div className="px-4 pb-4 space-y-4 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#B8956F]" />
              <span className="font-medium text-[#1A1A1A]">OpenRouter</span>
              <span className="text-[10px] bg-[#B8956F]/10 text-[#B8956F] px-1.5 py-0.5 rounded-full">Recommended</span>
            </div>
            <ol className="list-decimal list-inside text-[#6B6B6B] space-y-1 ml-6 text-xs">
              <li>Go to <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-[#B8956F] hover:underline">openrouter.ai</a></li>
              <li>Create an account and navigate to <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-[#B8956F] hover:underline">Keys</a></li>
              <li>Click &quot;Create Key&quot; and copy it</li>
            </ol>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#9A9A9A]" />
              <span className="font-medium text-[#1A1A1A]">Google Gemini</span>
            </div>
            <ol className="list-decimal list-inside text-[#6B6B6B] space-y-1 ml-6 text-xs">
              <li>Go to <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-[#B8956F] hover:underline">aistudio.google.com</a></li>
              <li>Click <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[#B8956F] hover:underline">Get API key</a></li>
              <li>Create or use an existing key</li>
            </ol>
          </div>
        </div>
      </details>
    </div>
  );
}

// ============================================================================
// Component: Mode Status Banner
// ============================================================================

function ModeStatusBanner({
  isBYOKActive,
  provider,
  plan,
  messagesRemaining,
}: {
  isBYOKActive: boolean;
  provider: "openrouter" | "gemini" | null;
  plan: string;
  messagesRemaining: number;
}) {
  if (isBYOKActive) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <Key className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-emerald-800">Using Your Own API Key</p>
          <p className="text-sm text-emerald-600">
            {provider === "gemini" ? "Google Gemini" : "OpenRouter"} • All models unlocked • Unlimited messages
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <Infinity className="w-3 h-3" />
          <span>Active</span>
        </div>
      </div>
    );
  }

  const planConfig = PLANS[plan as keyof typeof PLANS] || PLANS.free;
  const isLow = messagesRemaining <= Math.ceil(planConfig.messagesPerMonth * 0.2);
  const isOut = messagesRemaining <= 0;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${
      isOut
        ? "bg-red-50 border border-red-200"
        : isLow
        ? "bg-amber-50 border border-amber-200"
        : "bg-[#F5F2EF] border border-[#E8E4E0]"
    }`}>
      <div className={`p-2 rounded-lg ${
        plan === "pro"
          ? "bg-gradient-to-br from-amber-100 to-orange-100"
          : "bg-[#E8E4DF]"
      }`}>
        {plan === "pro" ? (
          <Crown className="w-5 h-5 text-amber-600" />
        ) : (
          <Zap className="w-5 h-5 text-[#6B6459]" />
        )}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${isOut ? "text-red-800" : isLow ? "text-amber-800" : "text-[#1A1A1A]"}`}>
          {planConfig.name} Plan Active
        </p>
        <p className={`text-sm ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-[#6B6B6B]"}`}>
          {messagesRemaining} of {planConfig.messagesPerMonth} messages remaining this month
        </p>
      </div>
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        plan === "pro"
          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
          : "bg-[#E8E4DF] text-[#6B6459]"
      }`}>
        <span>Active</span>
      </div>
    </div>
  );
}

// ============================================================================
// Main Settings Page Component
// ============================================================================

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(null);
  const { isBYOKActive, provider, isInitialized } = useBYOK();
  const { plan, messagesRemaining } = useSubscription();

  // Set the default tab based on which mode is active
  useEffect(() => {
    if (isInitialized && activeSection === null) {
      setActiveSection(isBYOKActive ? "api-keys" : "subscription");
    }
  }, [isInitialized, isBYOKActive, activeSection]);

  // Build section options with active mode indicators
  const sectionOptions = useMemo(() => [
    {
      value: "subscription" as SettingsSection,
      label: "Subscription",
      icon: <Crown className="w-4 h-4" />,
      isActiveMode: !isBYOKActive,
    },
    {
      value: "api-keys" as SettingsSection,
      label: "API Keys",
      icon: <Key className="w-4 h-4" />,
      isActiveMode: isBYOKActive,
    },
  ], [isBYOKActive]);

  // Show loading skeleton while initializing
  if (!isInitialized || activeSection === null) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl text-[#1A1A1A] mb-1">Settings</h1>
          <p className="text-sm text-[#6B6B6B]">
            Manage your subscription and API keys
          </p>
        </div>

        {/* Mode Status Banner Skeleton */}
        <div className="h-[72px] bg-[#F5F2EF] rounded-xl animate-pulse mb-6" />

        {/* Segmented Control Skeleton */}
        <div className="h-12 bg-[#F5F2EF] rounded-xl animate-pulse mb-6" />

        {/* Content Skeleton */}
        <div className="space-y-4">
          <div className="h-48 bg-[#F5F2EF] rounded-2xl animate-pulse" />
          <div className="h-20 bg-[#F5F2EF] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-[#1A1A1A] mb-1">Settings</h1>
        <p className="text-sm text-[#6B6B6B]">
          Manage your subscription and API keys
        </p>
      </div>

      {/* Mode Status Banner */}
      <ModeStatusBanner
        isBYOKActive={isBYOKActive}
        provider={provider}
        plan={plan}
        messagesRemaining={messagesRemaining}
      />

      {/* Segmented Control */}
      <div className="mb-6">
        <SegmentedControl
          options={sectionOptions}
          value={activeSection}
          onChange={setActiveSection}
        />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          variants={contentVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {activeSection === "subscription" ? (
            <SubscriptionSection />
          ) : (
            <ApiKeysSection />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

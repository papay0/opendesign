"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import type { User, Subscription } from "@/lib/supabase/types";
import { PLANS, type PlanType } from "@/lib/constants/plans";
import type { BillingInterval } from "@/lib/stripe";
import { trackEvent } from "@/lib/hooks/useAnalytics";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface SubscriptionState {
  plan: PlanType;
  messagesRemaining: number;
  messagesLimit: number;
  bonusMessagesRemaining: number;
  messagesResetAt: Date | null;
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseSubscriptionReturn extends SubscriptionState {
  refresh: () => Promise<void>;
  decrementMessages: () => void;
  canUseModel: (model: string) => boolean;
  upgradeToProUrl: (interval?: BillingInterval) => Promise<string | null>;
  purchaseMessagesUrl: () => Promise<string | null>;
  manageSubscriptionUrl: () => Promise<string | null>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [state, setState] = useState<SubscriptionState>({
    plan: "free",
    messagesRemaining: 2,
    messagesLimit: 2,
    bonusMessagesRemaining: 0,
    messagesResetAt: null,
    subscription: null,
    isLoading: true,
    error: null,
  });

  const fetchSubscription = useCallback(async () => {
    if (!clerkUser?.id) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Get user data including subscription info
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, plan, messages_remaining, bonus_messages_remaining, messages_reset_at")
        .eq("clerk_id", clerkUser.id)
        .single();

      if (userError) {
        console.error("Error fetching user:", userError);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to load subscription",
        }));
        return;
      }

      // Get subscription details if exists
      // Use maybeSingle() instead of single() to handle users without a subscription row
      let subscription: Subscription | null = null;
      if (user) {
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        subscription = subData;
      }

      const plan = (user?.plan || "free") as PlanType;
      const planConfig = PLANS[plan];

      setState({
        plan,
        messagesRemaining: user?.messages_remaining ?? planConfig.messagesPerMonth,
        messagesLimit: planConfig.messagesPerMonth,
        bonusMessagesRemaining: user?.bonus_messages_remaining ?? 0,
        messagesResetAt: user?.messages_reset_at
          ? new Date(user.messages_reset_at)
          : null,
        subscription,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error in useSubscription:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Unexpected error loading subscription",
      }));
    }
  }, [clerkUser?.id]);

  // Fetch on mount and when clerk user changes
  useEffect(() => {
    if (clerkLoaded) {
      fetchSubscription();
    }
  }, [clerkLoaded, fetchSubscription]);

  // Manually decrement messages (for optimistic UI updates)
  // Priority: consume monthly messages first, then bonus messages
  const decrementMessages = useCallback(() => {
    setState((prev) => {
      if (prev.messagesRemaining > 0) {
        // Decrement from monthly pool
        return {
          ...prev,
          messagesRemaining: prev.messagesRemaining - 1,
        };
      } else if (prev.bonusMessagesRemaining > 0) {
        // Monthly exhausted, decrement from bonus pool
        return {
          ...prev,
          bonusMessagesRemaining: prev.bonusMessagesRemaining - 1,
        };
      }
      return prev;
    });
  }, []);

  // Check if user can use a specific model
  const canUseModel = useCallback(
    (model: string): boolean => {
      const planConfig = PLANS[state.plan];
      return (
        planConfig.allowedModels.includes(model) ||
        planConfig.allowedModels.includes(`google/${model}`)
      );
    },
    [state.plan]
  );

  // Get checkout URL for Pro upgrade
  const upgradeToProUrl = useCallback(async (interval: BillingInterval = 'monthly'): Promise<string | null> => {
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ interval }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Checkout error:", error);
        return null;
      }

      const { url } = await response.json();

      // Track subscription upgrade initiation
      trackEvent("subscription_upgraded", {
        plan: "pro",
        interval: interval,
      });

      return url;
    } catch (err) {
      console.error("Error creating checkout:", err);
      return null;
    }
  }, []);

  // Get checkout URL for message pack purchase
  const purchaseMessagesUrl = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/stripe/purchase-messages", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Purchase error:", error);
        return null;
      }

      const { url } = await response.json();
      return url;
    } catch (err) {
      console.error("Error creating purchase:", err);
      return null;
    }
  }, []);

  // Get Stripe portal URL for subscription management
  const manageSubscriptionUrl = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Portal error:", error);
        return null;
      }

      const { url } = await response.json();
      return url;
    } catch (err) {
      console.error("Error creating portal:", err);
      return null;
    }
  }, []);

  return {
    ...state,
    refresh: fetchSubscription,
    decrementMessages,
    canUseModel,
    upgradeToProUrl,
    purchaseMessagesUrl,
    manageSubscriptionUrl,
  };
}

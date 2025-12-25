/**
 * Admin User Action API
 *
 * Handles admin actions on users:
 * - set-pro: Upgrade user to Pro plan
 * - set-free: Downgrade user to Free plan
 * - reset-messages: Reset message count based on plan
 * - set-messages: Set monthly messages to specific count
 * - set-bonus-messages: Set bonus messages to specific count
 * - cancel-stripe: Cancel Stripe subscription
 * - clear-stripe: Remove Stripe customer ID from user
 *
 * Requires admin role to access.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { PLANS } from "@/lib/constants/plans";

// Lazy Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Verify admin role
    const { data: adminUser } = await supabase
      .from("users")
      .select("role")
      .eq("clerk_id", clerkUserId)
      .single();

    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Parse request body
    const { userId, action, messagesCount, bonusMessagesCount } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }

    // Get target user
    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Execute action
    switch (action) {
      case "set-pro": {
        const { error } = await supabase
          .from("users")
          .update({
            plan: "pro",
            messages_remaining: PLANS.pro.messagesPerMonth,
            messages_reset_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) throw error;
        return NextResponse.json({ message: "User upgraded to Pro" });
      }

      case "set-free": {
        const { error } = await supabase
          .from("users")
          .update({
            plan: "free",
            messages_remaining: PLANS.free.messagesPerMonth,
            messages_reset_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) throw error;
        return NextResponse.json({ message: "User downgraded to Free" });
      }

      case "reset-messages": {
        const plan = targetUser.plan || "free";
        const planConfig = PLANS[plan as keyof typeof PLANS] || PLANS.free;

        const { error } = await supabase
          .from("users")
          .update({
            messages_remaining: planConfig.messagesPerMonth,
            messages_reset_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) throw error;
        return NextResponse.json({
          message: `Messages reset to ${planConfig.messagesPerMonth}`,
        });
      }

      case "set-messages": {
        const count = parseInt(messagesCount);

        if (isNaN(count) || count < 0) {
          return NextResponse.json({ error: "Invalid message count" }, { status: 400 });
        }

        const { error } = await supabase
          .from("users")
          .update({ messages_remaining: count })
          .eq("id", userId);

        if (error) throw error;
        return NextResponse.json({ message: `Monthly messages set to ${count}` });
      }

      case "set-bonus-messages": {
        const count = parseInt(bonusMessagesCount);

        if (isNaN(count) || count < 0) {
          return NextResponse.json({ error: "Invalid bonus message count" }, { status: 400 });
        }

        const { error } = await supabase
          .from("users")
          .update({ bonus_messages_remaining: count })
          .eq("id", userId);

        if (error) throw error;
        return NextResponse.json({ message: `Bonus messages set to ${count}` });
      }

      case "cancel-stripe": {
        if (!targetUser.stripe_customer_id) {
          return NextResponse.json({ error: "No Stripe customer linked" }, { status: 400 });
        }

        if (!stripe) {
          return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
        }

        // Find and cancel active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: targetUser.stripe_customer_id,
          status: "active",
        });

        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id);
        }

        // Update user plan
        const { error } = await supabase
          .from("users")
          .update({
            plan: "free",
            messages_remaining: PLANS.free.messagesPerMonth,
          })
          .eq("id", userId);

        if (error) throw error;

        // Update subscription record if exists
        await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("user_id", userId);

        return NextResponse.json({
          message: `Canceled ${subscriptions.data.length} subscription(s)`,
        });
      }

      case "clear-stripe": {
        const { error } = await supabase
          .from("users")
          .update({
            stripe_customer_id: null,
          })
          .eq("id", userId);

        if (error) throw error;

        // Also clear subscription record
        await supabase.from("subscriptions").delete().eq("user_id", userId);

        return NextResponse.json({ message: "Stripe customer ID cleared" });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin action error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Action failed" },
      { status: 500 }
    );
  }
}

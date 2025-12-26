/**
 * Cron Job: Reset Monthly Messages
 *
 * Runs daily at midnight UTC to reset messages for Pro users
 * whose messages_reset_at is 30+ days ago.
 *
 * This ensures yearly subscribers get monthly message resets
 * even though they only pay once a year.
 *
 * Security: Double-verifies with Stripe API that subscription is still active
 * before resetting (in case webhook failed to update our DB).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PLANS } from "@/lib/constants/plans";
import { stripe } from "@/lib/stripe";
import { logAuditEvents } from "@/lib/audit/log-event";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error("[Cron] Unauthorized request to reset-messages");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Cron] Starting monthly message reset job");

  if (!stripe) {
    console.error("[Cron] Stripe is not configured");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    // Find all Pro users whose messages_reset_at is 30+ days ago
    // AND who have an active subscription in our DB
    const { data: usersToReset, error: fetchError } = await supabaseAdmin
      .from("users")
      .select(`
        id,
        messages_reset_at,
        subscriptions!inner(stripe_subscription_id, status)
      `)
      .eq("plan", "pro")
      .eq("subscriptions.status", "active")
      .lt("messages_reset_at", thirtyDaysAgo.toISOString());

    if (fetchError) {
      console.error("[Cron] Error fetching users:", fetchError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    if (!usersToReset || usersToReset.length === 0) {
      console.log("[Cron] No users need message reset");
      return NextResponse.json({
        success: true,
        message: "No users need reset",
        usersReset: 0,
      });
    }

    console.log(`[Cron] Found ${usersToReset.length} potential users to reset`);

    // Verify each subscription with Stripe and reset only if truly active
    const verifiedUserIds: string[] = [];
    const skippedUsers: string[] = [];

    for (const user of usersToReset) {
      const subscription = user.subscriptions as unknown as {
        stripe_subscription_id: string;
        status: string;
      };

      if (!subscription?.stripe_subscription_id) {
        console.warn(`[Cron] User ${user.id} has no stripe_subscription_id, skipping`);
        skippedUsers.push(user.id);
        continue;
      }

      try {
        // Double-check with Stripe that subscription is actually active
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        );

        if (stripeSubscription.status === "active" || stripeSubscription.status === "trialing") {
          verifiedUserIds.push(user.id);
          console.log(`[Cron] User ${user.id} verified active with Stripe`);
        } else {
          console.warn(
            `[Cron] User ${user.id} subscription is ${stripeSubscription.status} in Stripe (DB says active) - skipping and fixing DB`
          );
          skippedUsers.push(user.id);

          // Map Stripe status to our DB status types
          // Stripe has more statuses than we support, so we normalize them
          type DBSubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
          const stripeToDbStatus: Record<string, DBSubscriptionStatus> = {
            active: 'active',
            trialing: 'trialing',
            past_due: 'past_due',
            canceled: 'canceled',
            incomplete: 'incomplete',
            incomplete_expired: 'canceled', // Treat as canceled
            unpaid: 'past_due',              // Treat as past_due
            paused: 'canceled',              // Treat as canceled
          };
          const dbStatus = stripeToDbStatus[stripeSubscription.status] || 'canceled';

          // Fix the DB to match Stripe's reality
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: dbStatus })
            .eq("stripe_subscription_id", subscription.stripe_subscription_id);

          // If subscription is not active, downgrade user to free
          const inactiveStatuses = ["canceled", "unpaid", "incomplete_expired", "paused"];
          if (inactiveStatuses.includes(stripeSubscription.status)) {
            await supabaseAdmin
              .from("users")
              .update({ plan: "free" })
              .eq("id", user.id);
          }
        }
      } catch (stripeError) {
        console.error(`[Cron] Error verifying subscription for user ${user.id}:`, stripeError);
        skippedUsers.push(user.id);
      }
    }

    if (verifiedUserIds.length === 0) {
      console.log("[Cron] No users passed Stripe verification");
      return NextResponse.json({
        success: true,
        message: "No users passed Stripe verification",
        usersReset: 0,
        skipped: skippedUsers.length,
      });
    }

    // Reset messages for verified users only
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        messages_remaining: PLANS.pro.messagesPerMonth,
        messages_reset_at: now.toISOString(),
      })
      .in("id", verifiedUserIds);

    if (updateError) {
      console.error("[Cron] Error resetting messages:", updateError);
      return NextResponse.json({ error: "Failed to reset messages" }, { status: 500 });
    }

    console.log(`[Cron] Successfully reset messages for ${verifiedUserIds.length} users`);

    // Batch log audit events for all reset users
    await logAuditEvents(
      verifiedUserIds.map((userId) => ({
        userId,
        eventType: 'MESSAGES_RESET' as const,
        metadata: {
          previousRemaining: 0, // We don't track this but could enhance
          newRemaining: PLANS.pro.messagesPerMonth,
          source: 'cron' as const,
        },
      }))
    );

    return NextResponse.json({
      success: true,
      message: `Reset messages for ${verifiedUserIds.length} users`,
      usersReset: verifiedUserIds.length,
      skipped: skippedUsers.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

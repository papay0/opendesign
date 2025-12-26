"use client";

/**
 * useUserSync Hook
 *
 * Syncs Clerk user data to Supabase users table.
 * - Creates user record on first sign-in
 * - Updates last_sign_in_at on subsequent visits (throttled to 5 min)
 * - Increments sign_in_count only on new sessions
 * - Logs audit events for sign-ins and user creation
 *
 * Uses localStorage for throttling to persist across tabs.
 */

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/supabase/types";
import { AUDIT_EVENT_TYPES, type AuditEventType } from "@/lib/audit/types";

/**
 * Log an audit event via the server API
 * Fire-and-forget, doesn't block the sync flow
 */
async function logAuditEventClient(
  eventType: AuditEventType,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch("/api/audit/log-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, metadata }),
    });
  } catch {
    // Silent fail - audit logging shouldn't break user flow
    console.debug("[Audit] Failed to log event:", eventType);
  }
}

// Track if user was previously signed out (null) in this session
// This helps detect actual sign-in events vs page refreshes
let wasSignedOut = true; // Start true so first load counts as sign-in

interface UseUserSyncResult {
  dbUser: User | null;
  isLoading: boolean;
  error: Error | null;
  isSynced: boolean;
}

export function useUserSync(): UseUserSyncResult {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    // Wait for Clerk to load
    if (!isLoaded) return;

    // No user logged in - mark as signed out and reset state
    if (!user) {
      wasSignedOut = true;
      setIsLoading(false);
      setDbUser(null);
      setIsSynced(false);
      lastUserId.current = null;
      return;
    }

    // Prevent duplicate sync for same user in same render cycle
    if (lastUserId.current === user.id) return;
    lastUserId.current = user.id;

    // Detect if this is an actual sign-in (user was previously signed out)
    const isActualSignIn = wasSignedOut;
    wasSignedOut = false; // Mark as signed in now

    async function syncUser() {
      const supabase = createClient();

      try {
        // Check if user exists in database
        const { data: existingUser, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("clerk_id", user!.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          // PGRST116 = no rows returned (user doesn't exist)
          throw fetchError;
        }

        if (existingUser) {
          // Update user data (always sync profile, increment count only on actual sign-in)
          const { data: updatedUser, error: updateError } = await supabase
            .from("users")
            .update({
              last_sign_in_at: new Date().toISOString(),
              ...(isActualSignIn && {
                sign_in_count: existingUser.sign_in_count + 1,
              }),
              // Also update profile data in case it changed in Clerk
              email:
                user!.emailAddresses[0]?.emailAddress || existingUser.email,
              name:
                [user!.firstName, user!.lastName].filter(Boolean).join(" ") ||
                existingUser.name,
              avatar_url: user!.imageUrl || existingUser.avatar_url,
            })
            .eq("clerk_id", user!.id)
            .select()
            .single();

          if (updateError) throw updateError;
          setDbUser(updatedUser);

          // Track sign-in events (only on actual sign-in, not page refresh)
          if (isActualSignIn) {
            posthog.capture("user_signed_in", {
              sign_in_count: updatedUser.sign_in_count,
            });
            logAuditEventClient(AUDIT_EVENT_TYPES.USER_SIGNED_IN, {
              signInCount: updatedUser.sign_in_count,
            });
          }

          posthog.people.set({
            plan: updatedUser.plan,
            messages_remaining: updatedUser.messages_remaining,
            sign_in_count: updatedUser.sign_in_count,
          });
        } else {
          // New user - create record
          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({
              clerk_id: user!.id,
              email: user!.emailAddresses[0]?.emailAddress || "",
              name:
                [user!.firstName, user!.lastName].filter(Boolean).join(" ") ||
                "Anonymous",
              avatar_url: user!.imageUrl || null,
              role: "regular",
              sign_in_count: 1,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setDbUser(newUser);

          // Track new user sign-up and set initial properties
          posthog.capture("user_signed_in", {
            sign_in_count: 1,
            is_new_user: true,
          });
          posthog.people.set({
            plan: newUser.plan,
            messages_remaining: newUser.messages_remaining,
            sign_in_count: 1,
          });

          // Log audit event for new user creation
          logAuditEventClient(AUDIT_EVENT_TYPES.USER_CREATED, {
            email: newUser.email,
            plan: newUser.plan,
          });
        }
        setIsSynced(true);
      } catch (err) {
        console.error("User sync error:", err);
        setError(err instanceof Error ? err : new Error("Failed to sync user"));
      } finally {
        setIsLoading(false);
      }
    }

    syncUser();
  }, [isLoaded, user]);

  return { dbUser, isLoading, error, isSynced };
}

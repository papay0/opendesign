"use client";

/**
 * useUserSync Hook
 *
 * Syncs Clerk user data to Supabase users table.
 * - Creates user record on first sign-in
 * - Updates last_sign_in_at on subsequent visits (throttled to 5 min)
 * - Increments sign_in_count only on new sessions
 *
 * Uses localStorage for throttling to persist across tabs.
 */

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/supabase/types";

const SYNC_KEY = "opendesign_last_sync";
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

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
  const syncAttempted = useRef(false);

  useEffect(() => {
    // Wait for Clerk to load
    if (!isLoaded) return;

    // No user logged in
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Prevent duplicate sync attempts in same render cycle
    if (syncAttempted.current) return;
    syncAttempted.current = true;

    // Check throttle - only update if 5+ minutes since last sync
    const lastSyncStr = localStorage.getItem(SYNC_KEY);
    const lastSync = lastSyncStr ? JSON.parse(lastSyncStr) : null;
    const now = Date.now();
    const isNewSession = !lastSync || lastSync.userId !== user.id;
    const shouldUpdate = isNewSession || now - lastSync.timestamp > THROTTLE_MS;

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
          if (shouldUpdate) {
            // Update last_sign_in_at (and increment count only on new session)
            const { data: updatedUser, error: updateError } = await supabase
              .from("users")
              .update({
                last_sign_in_at: new Date().toISOString(),
                ...(isNewSession && {
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

            // Track sign-in and update PostHog person properties
            if (isNewSession) {
              posthog.capture("user_signed_in", {
                sign_in_count: updatedUser.sign_in_count,
              });
            }
            posthog.people.set({
              plan: updatedUser.plan,
              messages_remaining: updatedUser.messages_remaining,
              sign_in_count: updatedUser.sign_in_count,
            });
          } else {
            setDbUser(existingUser);
            // Update PostHog person properties even when not syncing
            posthog.people.set({
              plan: existingUser.plan,
              messages_remaining: existingUser.messages_remaining,
              sign_in_count: existingUser.sign_in_count,
            });
          }
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
        }

        // Update throttle timestamp
        if (shouldUpdate) {
          localStorage.setItem(
            SYNC_KEY,
            JSON.stringify({ userId: user!.id, timestamp: now })
          );
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

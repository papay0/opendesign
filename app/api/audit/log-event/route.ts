/**
 * Client Audit Event Logging API
 *
 * Allows authenticated clients to log specific audit events.
 * Only whitelisted event types are allowed for security.
 *
 * This endpoint is needed because:
 * 1. Client-side code uses anon key (no service_role access)
 * 2. audit_logs table only allows service_role to insert (RLS)
 * 3. Some events (USER_SIGNED_IN) happen client-side
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { logAuditEvent } from "@/lib/audit/log-event";
import { AUDIT_EVENT_TYPES, type AuditEventType } from "@/lib/audit/types";

// Only allow specific events from clients (security measure)
const ALLOWED_CLIENT_EVENTS: AuditEventType[] = [
  AUDIT_EVENT_TYPES.USER_SIGNED_IN,
  AUDIT_EVENT_TYPES.USER_CREATED,
  AUDIT_EVENT_TYPES.BYOK_CONFIGURED,
  AUDIT_EVENT_TYPES.BYOK_REMOVED,
  AUDIT_EVENT_TYPES.PROJECT_CREATED,
  AUDIT_EVENT_TYPES.PROJECT_DELETED,
];

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { eventType, metadata } = body;

    // Validate event type
    if (!eventType || !ALLOWED_CLIENT_EVENTS.includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid or disallowed event type" },
        { status: 400 }
      );
    }

    // Get user's internal UUID from clerk_id
    const supabase = getSupabaseAdmin();
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (!user) {
      // User might not exist yet (during creation flow)
      // Log without user_id for USER_CREATED event
      if (eventType === AUDIT_EVENT_TYPES.USER_CREATED) {
        await logAuditEvent({
          eventType,
          metadata: { ...metadata, clerkId: clerkUserId },
          request,
        });
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log the audit event
    await logAuditEvent({
      userId: user.id,
      eventType,
      metadata,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Audit Log API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to log event" },
      { status: 500 }
    );
  }
}

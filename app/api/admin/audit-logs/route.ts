/**
 * Admin Audit Logs API
 *
 * Fetches audit logs with filtering and pagination.
 * Requires admin role to access.
 *
 * Query params:
 * - userId: Filter by user ID
 * - eventType: Filter by event type
 * - from: Start date (ISO string)
 * - to: End date (ISO string)
 * - limit: Number of results (default 50, max 200)
 * - offset: Pagination offset
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { AUDIT_EVENT_TYPES, type AuditEventType } from "@/lib/audit/types";

/**
 * Shape of the audit log query result with joined user data
 */
interface AuditLogQueryResult {
  id: string;
  user_id: string | null;
  event_type: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  users: {
    email: string;
    name: string;
  } | null;
}

// Lazy Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const eventType = searchParams.get("eventType") as AuditEventType | null;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("audit_logs")
      .select(`
        id,
        user_id,
        event_type,
        metadata,
        ip_address,
        user_agent,
        created_at,
        users!audit_logs_user_id_fkey (
          email,
          name
        )
      `, { count: 'exact' })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (eventType && Object.values(AUDIT_EVENT_TYPES).includes(eventType)) {
      query = query.eq("event_type", eventType);
    }

    if (from) {
      query = query.gte("created_at", from);
    }

    if (to) {
      query = query.lte("created_at", to);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching audit logs:", error);
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }

    // Cast to our expected shape at the boundary
    // Using unknown first is the proper pattern for external data
    const logs = data as unknown as AuditLogQueryResult[] | null;

    // Transform data for response
    const transformedLogs = logs?.map((log) => ({
      id: log.id,
      userId: log.user_id,
      eventType: log.event_type,
      metadata: log.metadata,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at,
      user: log.users,
    }));

    return NextResponse.json({
      logs: transformedLogs,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Audit logs error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

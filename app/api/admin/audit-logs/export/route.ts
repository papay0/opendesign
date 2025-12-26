/**
 * Admin Audit Logs Export API
 *
 * Exports audit logs as CSV with the same filters as the main endpoint.
 * Requires admin role to access.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { AUDIT_EVENT_TYPES, EVENT_TYPE_LABELS, type AuditEventType } from "@/lib/audit/types";

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

    // Build query (no limit for export, but cap at 10000)
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
      `)
      .order("created_at", { ascending: false })
      .limit(10000);

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

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching audit logs for export:", error);
      return NextResponse.json({ error: "Failed to export logs" }, { status: 500 });
    }

    // Cast to our expected shape at the boundary
    // Using unknown first is the proper pattern for external data
    const logs = data as unknown as AuditLogQueryResult[] | null;

    // Generate CSV
    const headers = ["Timestamp", "Event", "User Email", "User Name", "User ID", "Metadata", "IP Address"];
    const rows = logs?.map((log) => {
      const eventLabel = EVENT_TYPE_LABELS[log.event_type as AuditEventType] || log.event_type;

      return [
        new Date(log.created_at).toISOString(),
        eventLabel,
        log.users?.email || "",
        log.users?.name || "",
        log.user_id || "",
        JSON.stringify(log.metadata || {}),
        log.ip_address || "",
      ].map((cell) => {
        // Escape quotes and wrap in quotes if contains comma
        const str = String(cell);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(",");
    }) || [];

    const csv = [headers.join(","), ...rows].join("\n");

    // Generate filename with date range
    const fromDate = from ? new Date(from).toISOString().split("T")[0] : "all";
    const toDate = to ? new Date(to).toISOString().split("T")[0] : "now";
    const filename = `audit-logs-${fromDate}-to-${toDate}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Audit logs export error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export logs" },
      { status: 500 }
    );
  }
}

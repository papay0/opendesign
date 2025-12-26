/**
 * Audit Event Logging Utility
 *
 * Provides a type-safe way to log important events to the audit_logs table.
 * All logging is fire-and-forget to avoid blocking the main request.
 */

import { createClient } from '@supabase/supabase-js';
import { AuditEventType, AuditEventMetadata } from './types';

// Lazy initialization to avoid build-time errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Extract IP address from request headers
 */
function extractIpAddress(request?: Request): string | null {
  if (!request) return null;

  // Vercel/Cloudflare headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return null;
}

/**
 * Extract user agent from request headers
 */
function extractUserAgent(request?: Request): string | null {
  if (!request) return null;
  return request.headers.get('user-agent');
}

/**
 * Type-safe audit event logging
 *
 * @param params.userId - Internal UUID from users table (not Clerk ID)
 * @param params.eventType - Type of event from AUDIT_EVENT_TYPES
 * @param params.metadata - Event-specific metadata
 * @param params.request - Optional request object to extract IP/UA
 *
 * @example
 * await logAuditEvent({
 *   userId: dbUser.id,
 *   eventType: 'DESIGN_GENERATED',
 *   metadata: { projectId: '...', model: 'gemini-3-pro', usingBYOK: false },
 *   request,
 * });
 */
export async function logAuditEvent<T extends AuditEventType>(params: {
  userId?: string | null;
  eventType: T;
  metadata?: T extends keyof AuditEventMetadata ? AuditEventMetadata[T] : Record<string, unknown>;
  request?: Request;
}): Promise<void> {
  const { userId, eventType, metadata, request } = params;

  try {
    const supabaseAdmin = getSupabaseAdmin();

    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId || null,
      event_type: eventType,
      metadata: metadata || {},
      ip_address: extractIpAddress(request),
      user_agent: extractUserAgent(request),
    });

    console.log(`[Audit] ${eventType}${userId ? ` for user ${userId}` : ''}`);
  } catch (error) {
    // Log but don't throw - audit logging should never break the main flow
    console.error('[Audit] Failed to log event:', eventType, error);
  }
}

/**
 * Batch log multiple events (for bulk operations like cron jobs)
 */
export async function logAuditEvents(
  events: Array<{
    userId?: string | null;
    eventType: AuditEventType;
    metadata?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }>
): Promise<void> {
  if (events.length === 0) return;

  try {
    const supabaseAdmin = getSupabaseAdmin();

    await supabaseAdmin.from('audit_logs').insert(
      events.map((event) => ({
        user_id: event.userId || null,
        event_type: event.eventType,
        metadata: event.metadata || {},
        ip_address: event.ipAddress || null,
        user_agent: event.userAgent || null,
      }))
    );

    console.log(`[Audit] Logged ${events.length} events in batch`);
  } catch (error) {
    console.error('[Audit] Failed to batch log events:', error);
  }
}

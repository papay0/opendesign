/**
 * Audit Logging Types
 *
 * Strictly typed event types for tracking important user actions.
 * Used throughout the application for debugging and analytics.
 */

/**
 * All possible audit event types
 */
export const AUDIT_EVENT_TYPES = {
  // User lifecycle
  USER_CREATED: 'USER_CREATED',
  USER_SIGNED_IN: 'USER_SIGNED_IN',

  // Subscription events
  SUBSCRIPTION_CREATED: 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPDATED: 'SUBSCRIPTION_UPDATED',
  SUBSCRIPTION_CANCELED: 'SUBSCRIPTION_CANCELED',

  // Payment events
  PAYMENT_SUCCEEDED: 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  MESSAGE_PACK_PURCHASED: 'MESSAGE_PACK_PURCHASED',

  // Usage events
  MESSAGES_RESET: 'MESSAGES_RESET',
  DESIGN_GENERATED: 'DESIGN_GENERATED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // BYOK events
  BYOK_CONFIGURED: 'BYOK_CONFIGURED',
  BYOK_REMOVED: 'BYOK_REMOVED',

  // Project events
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_DELETED: 'PROJECT_DELETED',
} as const;

export type AuditEventType = typeof AUDIT_EVENT_TYPES[keyof typeof AUDIT_EVENT_TYPES];

/**
 * Metadata types for each event
 */
export interface AuditEventMetadata {
  USER_CREATED: {
    email: string;
    name: string;
    source?: string;
  };
  USER_SIGNED_IN: {
    email: string;
    signInCount?: number;
  };
  SUBSCRIPTION_CREATED: {
    plan: 'pro';
    interval: 'monthly' | 'annual';
    stripeSubscriptionId: string;
  };
  SUBSCRIPTION_UPDATED: {
    previousPlan?: string;
    newPlan: string;
    stripeSubscriptionId: string;
    reason?: string;
  };
  SUBSCRIPTION_CANCELED: {
    stripeSubscriptionId: string;
    cancelAtPeriodEnd: boolean;
    reason?: string;
  };
  PAYMENT_SUCCEEDED: {
    amountCents: number;
    currency: string;
    invoiceId?: string;
  };
  PAYMENT_FAILED: {
    amountCents: number;
    currency: string;
    failureReason?: string;
    invoiceId?: string;
  };
  MESSAGE_PACK_PURCHASED: {
    messagesAdded: number;
    amountCents: number;
    paymentIntentId?: string;
  };
  MESSAGES_RESET: {
    previousRemaining: number;
    newRemaining: number;
    source: 'cron' | 'api_auto_reset';
  };
  DESIGN_GENERATED: {
    projectId: string;
    model: string;
    provider: 'openrouter' | 'gemini';
    inputTokens?: number;
    outputTokens?: number;
    usingBYOK: boolean;
  };
  QUOTA_EXCEEDED: {
    plan: 'free' | 'pro';
    messagesRemaining: number;
    bonusRemaining: number;
  };
  BYOK_CONFIGURED: {
    provider: 'openrouter' | 'gemini';
  };
  BYOK_REMOVED: {
    provider: 'openrouter' | 'gemini';
  };
  PROJECT_CREATED: {
    projectId: string;
    platform: 'mobile' | 'desktop';
    hasInitialImage: boolean;
  };
  PROJECT_DELETED: {
    projectId: string;
    projectName: string;
  };
}

/**
 * Audit log row from database
 */
export interface AuditLog {
  id: string;
  user_id: string | null;
  event_type: AuditEventType;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Audit log with user info for display
 */
export interface AuditLogWithUser extends AuditLog {
  user?: {
    email: string;
    name: string;
  } | null;
}

/**
 * Human-readable labels for event types
 */
export const EVENT_TYPE_LABELS: Record<AuditEventType, string> = {
  USER_CREATED: 'User Signed Up',
  USER_SIGNED_IN: 'User Signed In',
  SUBSCRIPTION_CREATED: 'Subscription Created',
  SUBSCRIPTION_UPDATED: 'Subscription Updated',
  SUBSCRIPTION_CANCELED: 'Subscription Canceled',
  PAYMENT_SUCCEEDED: 'Payment Succeeded',
  PAYMENT_FAILED: 'Payment Failed',
  MESSAGE_PACK_PURCHASED: 'Message Pack Purchased',
  MESSAGES_RESET: 'Messages Reset',
  DESIGN_GENERATED: 'Design Generated',
  QUOTA_EXCEEDED: 'Quota Exceeded',
  BYOK_CONFIGURED: 'API Key Configured',
  BYOK_REMOVED: 'API Key Removed',
  PROJECT_CREATED: 'Project Created',
  PROJECT_DELETED: 'Project Deleted',
};

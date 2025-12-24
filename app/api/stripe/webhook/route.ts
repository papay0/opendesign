import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { PLANS } from '@/lib/constants/plans';
import type Stripe from 'stripe';

// Lazy initialization to avoid build-time errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabaseAdmin = getSupabaseAdmin();
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;

  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  // Check if this was a one-time message pack purchase
  if (session.metadata?.type === 'message_pack') {
    await handleMessagePackPurchase(userId, session);
    return;
  }

  // Update user with Stripe customer ID
  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({
      stripe_customer_id: customerId,
      plan: 'pro',
      messages_remaining: PLANS.pro.messagesPerMonth,
      messages_reset_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (userError) {
    console.error('Error updating user:', userError);
  }
}

async function handleMessagePackPurchase(userId: string, session: Stripe.Checkout.Session) {
  const supabaseAdmin = getSupabaseAdmin();
  const messagesToAdd = 20; // MESSAGE_PACK.messages

  // Add messages to user's remaining count
  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('messages_remaining')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    console.error('Error fetching user for message pack:', fetchError);
    return;
  }

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      messages_remaining: user.messages_remaining + messagesToAdd,
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Error adding purchased messages:', updateError);
    return;
  }

  // Record the purchase
  const { error: purchaseError } = await supabaseAdmin
    .from('message_purchases')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: session.payment_intent as string,
      messages_purchased: messagesToAdd,
      amount_cents: 500, // $5 in cents
    });

  if (purchaseError) {
    console.error('Error recording message purchase:', purchaseError);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabaseAdmin = getSupabaseAdmin();
  const userId = subscription.metadata?.userId;
  const customerId = subscription.customer as string;

  if (!userId) {
    // Try to find user by customer ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!user) {
      console.error('Could not find user for subscription update');
      return;
    }

    await updateSubscriptionRecord(user.id, subscription);
    return;
  }

  await updateSubscriptionRecord(userId, subscription);
}

async function updateSubscriptionRecord(userId: string, subscription: Stripe.Subscription) {
  const supabaseAdmin = getSupabaseAdmin();
  const status = subscription.status;
  const isActive = status === 'active' || status === 'trialing';

  // Upsert subscription record
  // Cast to any to access Stripe subscription properties
  const sub = subscription as unknown as {
    id: string;
    items: { data: Array<{ price: { id: string } }> };
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
  };

  const { error: subError } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: sub.id,
      stripe_price_id: sub.items.data[0]?.price.id,
      status: status as 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete',
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
    }, {
      onConflict: 'user_id',
    });

  if (subError) {
    console.error('Error upserting subscription:', subError);
  }

  // Update user plan status
  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({
      plan: isActive ? 'pro' : 'free',
    })
    .eq('id', userId);

  if (userError) {
    console.error('Error updating user plan:', userError);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabaseAdmin = getSupabaseAdmin();
  const customerId = subscription.customer as string;

  // Find user by customer ID
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error('Could not find user for subscription deletion');
    return;
  }

  // Update subscription status
  const { error: subError } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('user_id', user.id);

  if (subError) {
    console.error('Error updating subscription status:', subError);
  }

  // Downgrade user to free plan
  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({
      plan: 'free',
      messages_remaining: PLANS.free.messagesPerMonth,
      messages_reset_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (userError) {
    console.error('Error downgrading user:', userError);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const supabaseAdmin = getSupabaseAdmin();
  // Cast to access Stripe invoice properties
  const inv = invoice as unknown as {
    customer: string;
    subscription: string | null;
  };
  const customerId = inv.customer;
  const subscriptionId = inv.subscription;

  if (!subscriptionId) {
    // One-time payment, not a subscription renewal
    return;
  }

  // Find user by customer ID
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, plan')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error('Could not find user for invoice payment');
    return;
  }

  // Reset monthly messages for subscription renewal
  if (user.plan === 'pro') {
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        messages_remaining: PLANS.pro.messagesPerMonth,
        messages_reset_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error resetting monthly messages:', error);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabaseAdmin = getSupabaseAdmin();
  // Cast to access Stripe invoice properties
  const inv = invoice as unknown as { customer: string };
  const customerId = inv.customer;

  // Find user by customer ID
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error('Could not find user for failed payment');
    return;
  }

  // Update subscription status to past_due
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating subscription status to past_due:', error);
  }
}

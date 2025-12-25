import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { createCheckoutSession, getOrCreateCustomer, getProPriceId, type BillingInterval } from '@/lib/stripe';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse billing interval from request body (defaults to monthly)
    let interval: BillingInterval = 'monthly';
    try {
      const body = await req.json();
      if (body.interval === 'annual') {
        interval = 'annual';
      }
    } catch {
      // No body or invalid JSON, use default
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, stripe_customer_id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await getOrCreateCustomer({
        email: user.email,
        name: user.name,
        userId: user.id,
      });

      if (!customer) {
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        );
      }

      customerId = customer.id;

      // Save customer ID to user
      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Get the origin from the request
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create checkout session with the appropriate price
    const session = await createCheckoutSession({
      customerId,
      priceId: getProPriceId(interval),
      userId: user.id,
      successUrl: `${origin}/home?subscription=success`,
      cancelUrl: `${origin}/home?subscription=canceled`,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

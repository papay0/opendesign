import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { createMessagePackCheckout, STRIPE_PRICES } from '@/lib/stripe';

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

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, plan, stripe_customer_id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow Pro users to purchase extra messages
    if (user.plan !== 'pro') {
      return NextResponse.json(
        { error: 'Only Pro users can purchase extra messages. Please upgrade first.' },
        { status: 403 }
      );
    }

    if (!user.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No payment method on file' },
        { status: 400 }
      );
    }

    // Get the origin from the request
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create checkout session for message pack
    const session = await createMessagePackCheckout({
      customerId: user.stripe_customer_id,
      priceId: STRIPE_PRICES.messagePack,
      userId: user.id,
      successUrl: `${origin}/home?purchase=success`,
      cancelUrl: `${origin}/home?purchase=canceled`,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating message pack checkout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

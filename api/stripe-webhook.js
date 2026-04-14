/**
 * POST /api/stripe-webhook
 * Receives Stripe events and keeps the `subscriptions` table in Supabase in sync.
 *
 * Events handled:
 *   checkout.session.completed      → create/activate subscription row
 *   customer.subscription.updated   → sync status changes (e.g. cancel at period end)
 *   customer.subscription.deleted   → mark subscription as 'canceled'
 *   invoice.payment_failed          → mark subscription as 'past_due'
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failure:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const handlers = {
    'checkout.session.completed': handleCheckout,
    'customer.subscription.updated': handleSubUpdated,
    'customer.subscription.deleted': handleSubDeleted,
    'invoice.payment_failed': handlePaymentFailed,
  };

  const fn = handlers[event.type];
  if (fn) {
    try {
      await fn(event.data.object);
    } catch (err) {
      console.error(`Error handling ${event.type}:`, err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(200).json({ received: true });
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleCheckout(session) {
  // client_reference_id is set to the Supabase user.id during checkout
  const userId = session.client_reference_id;
  const stripeCustomerId = session.customer;
  const stripeSubId = session.subscription;

  if (!userId) {
    console.warn('checkout.session.completed missing client_reference_id');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(stripeSubId);

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubId,
    status: subscription.status,        // 'active', 'trialing', etc.
    price_id: subscription.items.data[0]?.price.id,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

async function handleSubUpdated(subscription) {
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubDeleted(subscription) {
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentFailed(invoice) {
  if (!invoice.subscription) return;
  await supabase
    .from('subscriptions')
    .update({ status: 'past_due', updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', invoice.subscription);
}

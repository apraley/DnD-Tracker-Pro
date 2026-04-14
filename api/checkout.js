/**
 * POST /api/checkout
 * Creates a Stripe Checkout session and returns its URL.
 *
 * Body: { userId: string, email: string }
 * Returns: { url: string }
 *
 * We pass userId as client_reference_id so the webhook can link the
 * Stripe subscription back to the Supabase user.
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, email } = req.body || {};
  if (!userId || !email) return res.status(400).json({ error: 'userId and email required' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      client_reference_id: userId,         // passed back in webhook
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,  // your monthly/annual price ID
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL || 'https://dnd-tracker-pro.vercel.app'}/?checkout=success`,
      cancel_url:  `${process.env.APP_URL || 'https://dnd-tracker-pro.vercel.app'}/?checkout=canceled`,
      subscription_data: {
        trial_period_days: 7,              // 7-day free trial
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}

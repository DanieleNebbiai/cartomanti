import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Skip Stripe initialization during build if API key is not set
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy'
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy'

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
})

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id

        if (!userId) {
          console.error('No user_id in session metadata')
          return NextResponse.json({ error: 'No user_id found' }, { status: 400 })
        }

        // Update user subscription status
        const { error } = await supabase
          .from('profiles')
          .update({
            stripe_customer_id: session.customer as string,
            subscription_status: 'active',
            subscription_started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) {
          console.error('Error updating user subscription:', error)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        console.log(`Subscription activated for user ${userId}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.log(`No profile found for customer: ${customerId} - might be processed by checkout.session.completed later`)
          return NextResponse.json({ received: true, message: 'Customer not yet in database' })
        }

        // Update subscription status
        const status = subscription.status === 'active' ? 'active' : 'inactive'
        
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)

        if (error) {
          console.error('Error updating subscription status:', error)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        console.log(`Subscription ${status} for user ${profile.id}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.log(`No profile found for customer: ${customerId} - might be processed by checkout.session.completed later`)
          return NextResponse.json({ received: true, message: 'Customer not yet in database' })
        }

        // Update subscription status to inactive
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'inactive',
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)

        if (error) {
          console.error('Error deactivating subscription:', error)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        console.log(`Subscription canceled for user ${profile.id}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error handling webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
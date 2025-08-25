import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Skip Stripe initialization during build if API key is not set
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy'
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy'

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
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

  // Use service role to bypass RLS for webhook operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

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
        console.log(`Updating user ${userId} with stripe_customer_id: ${session.customer}`)
        
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

        console.log(`Successfully updated user ${userId} with stripe_customer_id: ${session.customer}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID first
        let { data: profile } = await supabase
          .from('profiles')
          .select('id, stripe_customer_id')
          .eq('stripe_customer_id', customerId)
          .single()

        // If not found by stripe_customer_id, try to get customer from Stripe and find by email
        if (!profile) {
          try {
            console.log(`Searching customer ${customerId} in Stripe API`)
            const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
            console.log(`Customer email from Stripe: "${customer.email}"`)
            
            if (customer.email) {
              console.log(`Searching profile with email: "${customer.email}"`)
              const { data: profileByEmail, error: emailSearchError } = await supabase
                .from('profiles')
                .select('id, stripe_customer_id, email')
                .eq('email', customer.email)
                .maybeSingle()

              console.log(`Profile search result:`, profileByEmail, `Error:`, emailSearchError)

              if (profileByEmail) {
                console.log(`Found profile by email: ${profileByEmail.id}, updating with stripe_customer_id`)
                // Update the profile with stripe_customer_id for future webhooks
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({ stripe_customer_id: customerId })
                  .eq('id', profileByEmail.id)

                if (!updateError) {
                  profile = { ...profileByEmail, stripe_customer_id: customerId }
                  console.log(`Successfully updated profile ${profileByEmail.id} with stripe_customer_id: ${customerId}`)
                } else {
                  console.error(`Error updating profile:`, updateError)
                }
              } else {
                console.log(`No profile found with email: "${customer.email}"`)
              }
            } else {
              console.log(`No email found for customer: ${customerId}`)
            }
          } catch (stripeError) {
            console.error('Error retrieving customer from Stripe:', stripeError)
          }
        }

        if (!profile) {
          console.log(`No profile found for customer: ${customerId}`)
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
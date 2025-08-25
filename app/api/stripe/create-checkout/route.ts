import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Skip Stripe initialization during build if API key is not set
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy'

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profilo utente non trovato' },
        { status: 404 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Piano Mensile - Cartomanti',
              description: 'Accesso illimitato alle conversazioni con cartomanti esperti',
            },
            unit_amount: 2900, // €29.00 in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.cartomanti.online'}/consulto?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.cartomanti.online'}/consulto?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error)
    return NextResponse.json(
      { error: 'Errore durante la creazione della sessione di pagamento' },
      { status: 500 }
    )
  }
}
import express from 'express'
import Stripe from 'stripe'
import dotenv from 'dotenv'
import { supabase } from '../db.js'

dotenv.config()

const router = express.Router()
// Forzamos el uso de la clave del .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

router.post('/create-checkout-session', async (req, res) => {
    const { name, price, product_id, user_id, shipping_method } = req.body

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: name,
                        },
                        unit_amount: Math.round(price * 100), // Stripe usa céntimos
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `http://localhost:3000/src/pages/perfil.html?success=true&product_id=${product_id}`,
            cancel_url: `http://localhost:3000/src/pages/checkout.html?id=${product_id}`,
            metadata: {
                product_id,
                user_id,
                shipping_method
            }
        })

        res.json({ url: session.url })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        const { product_id, user_id, shipping_method } = session.metadata

        await supabase
            .from('products')
            .update({ status: 'sold', sold_at: new Date() })
            .eq('id', product_id)

        await supabase
            .from('orders')
            .insert([{
                user_id,
                product_id,
                shipping_method,
                total_amount: session.amount_total / 100,
                status: 'paid'
            }])
    }

    res.json({ received: true })
})

export default router

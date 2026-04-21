import express from 'express'
import Stripe from 'stripe'
import dotenv from 'dotenv'

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

export default router

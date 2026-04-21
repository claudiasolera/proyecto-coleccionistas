import express from 'express'
import { supabase } from '../db.js'

const router = express.Router()

// Crear un nuevo pedido (Cierre de Venta)
router.post('/', async (req, res) => {
    const { user_id, product_id, shipping_method, total_amount } = req.body

    try {
        // 1. Crear el registro en la tabla de pedidos
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{ 
                user_id, 
                product_id, 
                shipping_method, 
                total_amount 
            }])
            .select()

        if (orderError) throw orderError

        // 2. Actualización de Stock: Cambiar estado del producto a 'sold' (Vendido)
        const { error: stockError } = await supabase
            .from('products')
            .update({ status: 'sold', sold_at: new Date() })
            .eq('id', product_id)

        if (stockError) throw stockError

        res.status(201).json(orderData[0])
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Obtener pedidos por usuario
router.get('/user/:user_id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                products (name, price)
            `)
            .eq('user_id', req.params.user_id)

        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

export default router

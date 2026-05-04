import express from 'express'
import { supabase } from '../db.js'

const router = express.Router()

// Crear un nuevo pedido (Cierre de Venta)
router.post('/', async (req, res) => {
    const { user_id, product_id, shipping_method, total_amount } = req.body
    try {
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{ user_id, product_id, shipping_method, total_amount, status: 'paid' }])
            .select()
        if (orderError) throw orderError

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
            .select('*, products (name, price)')
            .eq('user_id', req.params.user_id)
            .order('created_at', { ascending: false })
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// ─── RUTAS DE ADMINISTRADOR ──────────────────────────────────────────────────

// todos los pedidos con producto + usuario
router.get('/admin/all', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`*, products (id, name, price), users (id, name, last_name, dni, address, phone, email)`)
            .order('created_at', { ascending: false })
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// contar pedidos nuevos (status: 'paid') para la notificación
router.get('/admin/new-count', async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'paid')
        if (error) throw error
        res.json({ count })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// actualizar estado de un pedido + notificación automática al chat
router.put('/admin/:id/status', async (req, res) => {
    const { id } = req.params
    const { status, tracking_number } = req.body

    try {
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*, products (name), users (id)')
            .eq('id', id)
            .single()
        if (fetchError) throw fetchError

        const productName = order.products?.name || 'tu producto'
        const userId = order.users?.id || order.user_id

        const updateData = { status }
        if (tracking_number) updateData.tracking_number = tracking_number

        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()
        if (updateError) throw updateError

        let autoMessage = null

        if (status === 'preparing') {
            autoMessage = `[SISTEMA] ¡Buenas noticias! Tu pedido de '${productName}' ya se está preparando en nuestras instalaciones.`
        } else if (status === 'ready') {
            autoMessage = `[SISTEMA] ¡Tu pedido de '${productName}' ya está listo para recoger! Puedes pasarte por la tienda cuando quieras.`
        } else if (status === 'shipped') {
            autoMessage = `[SISTEMA] ¡Tu pedido de '${productName}' ya ha sido enviado! Puedes realizar el seguimiento con este código: ${tracking_number}`
        } else if (status === 'completed') {
            autoMessage = `[SISTEMA] Tu pedido de '${productName}' ha sido entregado correctamente. ¡Gracias por confiar en El Bazar del Coleccionista!`
        }

        if (autoMessage && userId) {
            const { error: msgError } = await supabase
                .from('messages')
                .insert([{
                    sender_id: null,
                    receiver_id: userId,
                    text: autoMessage,
                    is_from_admin: true
                }])
            if (msgError) console.error('Error al enviar mensaje automático:', msgError)
        }

        res.json(updatedOrder)
    } catch (error) {
        console.error('ERROR AL CAMBIAR ESTADO:', error)
        res.status(500).json({ message: error.message })
    }
})

export default router
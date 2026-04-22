import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

// 1. Enviar un mensaje (User -> Admin o Admin -> User)
router.post('/', async (req, res) => {
    const { sender_id, receiver_id, text, product_id } = req.body

    try {
        const { data, error } = await supabase
            .from('messages')
            .insert([{ sender_id, receiver_id, text, product_id }])
            .select()

        if (error) throw error
        res.status(201).json(data[0])
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// 2. Obtener lista de conversaciones únicas para el ADMIN
router.get('/admin/conversations', async (req, res) => {
    try {
        // Obtenemos los mensajes donde el admin es receptor o emisor
        const { data, error } = await supabase
            .from('messages')
            .select('sender_id, users!messages_sender_id_fkey(name, email)')
            .eq('receiver_id', 'admin') // Asumimos que los usuarios escriben a 'admin'

        if (error) throw error
        
        // Filtrar duplicados para tener soloIDs de usuario únicos
        const uniqueUsers = Array.from(new Set(data.map(m => m.sender_id)))
            .map(id => data.find(m => m.sender_id === id))

        res.json(uniqueUsers)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// 3. Obtener historial entre Admin y un usuario concreto
router.get('/history/:userId', async (req, res) => {
    const { userId } = req.params
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.admin),and(sender_id.eq.admin,receiver_id.eq.${userId})`)
            .order('created_at', { ascending: true })

        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

export default router

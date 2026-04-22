import express from 'express'
import { supabase } from '../db.js'

const router = express.Router()

// 1. Obtener favoritos de un usuario (HÍBRIDO: Productos + Categorías)
router.get('/:user_id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('favorites')
            .select(`
                id,
                product_id,
                category_id,
                products (
                    *,
                    product_images (url)
                ),
                categories (*)
            `)
            .eq('user_id', req.params.user_id)

        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// 2. Añadir a favoritos
router.post('/', async (req, res) => {
    const { user_id, product_id, category_id } = req.body
    
    if (!user_id) return res.status(400).json({ message: 'User ID is required' })

    try {
        const { data, error } = await supabase
            .from('favorites')
            .insert([{ user_id, product_id, category_id }])
            .select()

        if (error) throw error
        res.status(201).json(data[0])
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// 3. Eliminar favorito
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', req.params.id)

        if (error) throw error
        res.status(204).send()
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

export default router

import { Router } from 'express'
import { supabase } from '../db.js'
import { getCategories } from '../controllers/categories.js'

const router = Router()

router.get('/', getCategories)

// Crear una nueva categoría (Solo Admin)
router.post('/', async (req, res) => {
    const { name, description } = req.body
    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([{ name, description }])
            .select()
        
        if (error) throw error
        res.status(201).json(data[0])
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

export default router
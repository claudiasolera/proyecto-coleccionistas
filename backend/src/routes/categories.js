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

// Editar una categoría
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { name, description } = req.body
    try {
        const { data, error } = await supabase
            .from('categories')
            .update({ name, description })
            .eq('id', id)
            .select()
        
        if (error) throw error
        res.json(data[0])
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Borrar una categoría (Con seguridad de integridad)
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    try {
        // 1. Verificar si hay productos asociados
        const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', id)
        
        if (countError) throw countError
        if (count > 0) {
            return res.status(400).json({ 
                message: `No se puede borrar: hay ${count} productos asociados a esta categoría.` 
            })
        }

        // 2. Si no hay productos, borrar
        const { error: deleteError } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)
        
        if (deleteError) throw deleteError
        res.json({ message: 'Categoría eliminada con éxito' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

export default router
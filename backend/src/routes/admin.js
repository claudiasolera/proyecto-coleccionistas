import { Router } from 'express'
import { supabase } from '../db.js'

const router = Router()

router.post('/', async (req, res) => {
    const { name, description, price, category_id, brand, year, dimensions, images } = req.body

    try {
        const { data: product, error: pError } = await supabase
            .from('products')
            .insert([{ 
                name, 
                description, 
                price, 
                category_id, 
                brand, 
                year, 
                dimensions,
                status: 'available',
                published_at: new Date()
            }])
            .select()
            .single()

        if (pError) throw pError

        if (images && images.length > 0) {
            const imageData = images.map(url => ({
                product_id: product.id,
                url: url
            }))
            const { error: iError } = await supabase.from('product_images').insert(imageData)
            if (iError) throw iError
        }

        res.status(201).json(product)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.put('/:id/status', async (req, res) => {
    const { id } = req.params
    const { status, reserved_for } = req.body
    try {
        const { data, error } = await supabase
            .from('products')
            .update({ 
                status, 
                reserved_for: reserved_for || null,
                reserved_at: status === 'reserved' ? new Date() : null 
            })
            .eq('id', id)
            .select()
        
        if (error) throw error
        res.json(data[0])
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

export default router
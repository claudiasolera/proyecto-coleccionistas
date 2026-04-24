import { Router } from 'express'
import { supabase } from '../db.js'
import multer from 'multer'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/', upload.array('images', 10), async (req, res) => {
    const { name, description, price, category_id, brand, year, dimensions } = req.body

    try {
        const { data: product, error: pError } = await supabase
            .from('products')
            .insert([{ 
                name, description, price, category_id, brand, year, dimensions,
                status: 'available',
                published_at: new Date()
            }])
            .select()
            .single()

        if (pError) throw pError

        const imageUrls = []

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const fileName = `${product.id}/${Date.now()}-${file.originalname}`
                
                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype
                    })

                if (uploadError) throw uploadError

                const { data: urlData } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName)

                imageUrls.push(urlData.publicUrl)
            }
        }

        if (imageUrls.length > 0) {
            const imageData = imageUrls.map((url, i) => ({
                product_id: product.id,
                url,
                order: i
            }))
            const { error: iError } = await supabase.from('product_images').insert(imageData)
            if (iError) throw iError
        }

        res.status(201).json(product)
    } catch (error) {
        console.error('ERROR ADMIN:', error)
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
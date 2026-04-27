import { Router } from 'express'
import { supabase } from '../db.js'
import multer from 'multer'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/', upload.array('images', 10), async (req, res) => {
    const { name, description, price, category_id, brand, year, dimensions } = req.body

    const yearInt = parseInt(year);
    const priceFloat = parseFloat(price);

    // Limpiar campos vacíos y validar tipos para evitar errores en BD
    const sanitizedData = {
        name,
        description: description || null,
        price: !isNaN(priceFloat) ? priceFloat : 0,
        category_id,
        brand: brand || null,
        year: !isNaN(yearInt) ? yearInt : null,
        dimensions: dimensions || null,
        status: 'available',
        published_at: new Date()
    }

    try {
        const { data: product, error: pError } = await supabase
            .from('products')
            .insert([sanitizedData])
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

// Obtener todo el inventario (incluyendo vendidos/reservados)
router.get('/inventory', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, product_images(*), categories(name)')
            .order('published_at', { ascending: false })
        
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Editar un producto existente
router.put('/:id', upload.array('images', 10), async (req, res) => {
    const { id } = req.params
    const { name, description, price, category_id, brand, year, dimensions } = req.body

    const yearInt = parseInt(year);
    const priceFloat = parseFloat(price);

    const sanitizedData = {
        name,
        description: description || null,
        price: !isNaN(priceFloat) ? priceFloat : 0,
        category_id,
        brand: brand || null,
        year: !isNaN(yearInt) ? yearInt : null,
        dimensions: dimensions || null
    }

    try {
        const { data: product, error: pError } = await supabase
            .from('products')
            .update(sanitizedData)
            .eq('id', id)
            .select()
            .single()

        if (pError) throw pError
        res.json(product)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Borrar un producto
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
        
        if (error) throw error
        res.json({ message: 'Producto eliminado' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Actualizar solo el estado (Usado por el Chat para reservas)
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
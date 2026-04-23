import { supabase } from '../db.js'

export async function checkExpiredReservations() {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    try {
        await supabase
            .from('products')
            .update({ 
                status: 'available', 
                reserved_for: null, 
                reserved_at: null 
            })
            .eq('status', 'reserved')
            .lt('reserved_at', fortyEightHoursAgo);
    } catch (err) {
        console.error("Error en auto-liberación:", err);
    }
}

export async function getProducts(req, res) {
    await checkExpiredReservations();
    const { category, search, sort } = req.query

    let query = supabase
        .from('active_products')
        .select('*, product_images(*), categories(name)')

    if (category) query = query.eq('category_id', category)
    if (search) query = query.ilike('name', `%${search}%`)

    if (sort === 'oldest') {
        query = query.order('published_at', { ascending: true })
    } else if (sort === 'price_asc') {
        query = query.order('price', { ascending: true })
    } else if (sort === 'price_desc') {
        query = query.order('price', { ascending: false })
    } else {
        query = query.order('published_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) return res.status(500).json({ error })
    res.json(data)
}

export async function getProduct(req, res) {
    const { id } = req.params
    await checkExpiredReservations();

    const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*), categories(name)')
        .eq('id', id)
        .single()

    if (error) return res.status(404).json({ error })
    res.json(data)
}
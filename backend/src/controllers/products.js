import { supabase } from '../lib/supabase.js'

export async function getProducts(req, res) {
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

    const { data, error } = await supabase
        .from('active_products')
        .select('*, product_images(*), categories(name)')
        .eq('id', id)
        .single()

    if (error) return res.status(404).json({ error })
    res.json(data)
}
import { supabase } from '../lib/supabase.js'

export async function getProducts(req, res) {
    const { category, from, to } = req.query

    let query = supabase
        .from('active_products')
        .select('*, product_images(*), categories(name)')

    if (category) query = query.eq('category_id', category)

    if (from) query = query.gte('published_at', from)
    if (to) query = query.lte('published_at', to)

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
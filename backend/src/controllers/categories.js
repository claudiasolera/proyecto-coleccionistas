import { supabase } from '../lib/supabase.js'

export async function getCategories(req, res) {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

    if (error) return res.status(500).json({ error })
    res.json(data)
}
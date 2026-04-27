import { supabase } from '../db.js'

export async function getShippingMethods(req, res) {
    const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('price', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
}

export async function createShippingMethod(req, res) {
    const { name, description, price } = req.body
    const { data, error } = await supabase
        .from('shipping_methods')
        .insert([{ name, description, price: parseFloat(price) }])
        .select()

    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data[0])
}

export async function updateShippingMethod(req, res) {
    const { id } = req.params
    const { name, description, price } = req.body
    const { data, error } = await supabase
        .from('shipping_methods')
        .update({ name, description, price: parseFloat(price) })
        .eq('id', id)
        .select()

    if (error) return res.status(500).json({ error: error.message })
    res.json(data[0])
}

export async function deleteShippingMethod(req, res) {
    const { id } = req.params
    const { error } = await supabase
        .from('shipping_methods')
        .delete()
        .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    res.json({ message: 'Método de envío eliminado' })
}

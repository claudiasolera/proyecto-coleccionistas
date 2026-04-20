import express from 'express'
import { supabase } from '../db.js'

const router = express.Router()

router.post('/register', async (req, res) => {
    const { name, last_name, email, dni, address, phone } = req.body
    
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([{ name, last_name, email, dni, address, phone }])
            .select()

        if (error) throw error
        res.status(201).json(data[0])
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.params.id)
            .single()

        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

export default router

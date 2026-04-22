import express from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../db.js'

const router = express.Router()

// 1. REGISTRO DE USUARIO (Con password encriptado)
router.post('/register', async (req, res) => {
    console.log('DATOS RECIBIDOS EN REGISTRO:', req.body)
    const { name, last_name, email, dni, address, phone, password } = req.body
    
    if (!password) {
        console.error('ERROR: Contraseña no recibida');
        return res.status(400).json({ message: 'La contraseña es obligatoria' })
    }

    try {
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        console.log('CONTRASEÑA ENCRIPTADA CON ÉXITO');

        const { data, error } = await supabase
            .from('users')
            .insert([{ 
                name, 
                last_name, 
                email, 
                dni, 
                address, 
                phone, 
                password: hashedPassword,
                role: 'user' 
            }])
            .select()

        if (error) throw error
        res.status(201).json(data[0])
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// 2. LOGIN DE USUARIO (Verificación de password)
router.post('/login', async (req, res) => {
    const { email, password } = req.body
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

        if (error || !user) return res.status(404).json({ message: 'Usuario no encontrado' })

        // Comparar contraseñas
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(400).json({ message: 'Contraseña incorrecta' })

        res.json(user)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Buscar usuarios por Email o DNI
router.get('/', async (req, res) => {
    const { email, dni } = req.query
    try {
        let query = supabase.from('users').select('*')
        if (email) query = query.eq('email', email)
        if (dni) query = query.eq('dni', dni)
        
        const { data, error } = await query
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// 3. Obtener Usuario por ID
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

// 4. ACTUALIZAR PERFIL
router.put('/:id', async (req, res) => {
    const { name, last_name, address, phone } = req.body
    try {
        const { data, error } = await supabase
            .from('users')
            .update({ name, last_name, address, phone })
            .eq('id', req.params.id)
            .select()

        if (error) throw error
        res.json(data[0])
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

export default router

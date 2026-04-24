import express from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../db.js'
import crypto from 'crypto'

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

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

        if (error || !user) return res.status(404).json({ message: 'Email no encontrado' })

        const token = crypto.randomBytes(32).toString('hex')
        const expires = new Date(Date.now() + 3600000) // 1 hora

        await supabase
            .from('users')
            .update({ reset_token: token, reset_token_expires: expires })
            .eq('id', user.id)

        const resetUrl = `http://localhost:3000/reset-password.html?token=${token}`
        console.log('RESET URL (enviar por email):', resetUrl)

        res.json({ message: 'Enlace enviado' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('reset_token', token)
            .single()

        if (error || !user) return res.status(400).json({ message: 'Token inválido' })
        if (new Date(user.reset_token_expires) < new Date()) return res.status(400).json({ message: 'Token expirado' })

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        await supabase
            .from('users')
            .update({ password: hashedPassword, reset_token: null, reset_token_expires: null })
            .eq('id', user.id)

        res.json({ message: 'Contraseña actualizada' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

export default router

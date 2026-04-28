import express from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { supabase } from '../db.js'

const router = express.Router()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

// 1. REGISTRO DE USUARIO
router.post('/register', async (req, res) => {
    console.log('DATOS RECIBIDOS EN REGISTRO:', req.body)
    const { name, last_name, email, dni, address, phone, password } = req.body

    if (!password) {
        console.error('ERROR: Contraseña no recibida')
        return res.status(400).json({ message: 'La contraseña es obligatoria' })
    }

    try {
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        console.log('CONTRASEÑA ENCRIPTADA CON ÉXITO')

        const verificationToken = crypto.randomBytes(32).toString('hex')

        const { data, error } = await supabase
            .from('users')
            .insert([{ 
                name, last_name, email, dni, address, phone,
                password: hashedPassword,
                role: 'user',
                email_verified: false,
                verification_token: verificationToken
            }])
            .select()

        if (error) throw error

        const verifyUrl = `http://localhost:3000/verify-email.html?token=${verificationToken}`
        console.log('VERIFY URL:', verifyUrl)

        await transporter.sendMail({
            from: `"El Bazar del Coleccionista" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'VERIFICAR_EMAIL.EXE — El Bazar del Coleccionista',
            html: `
                <div style="font-family:'Courier New',monospace; background:#f4ecd8; padding:2rem; border:2px solid #000; max-width:500px;">
                    <div style="background:#000080; color:#fff; padding:5px 10px; margin-bottom:1.5rem; font-weight:bold;">
                        VERIFICAR_EMAIL.EXE
                    </div>
                    <p>Hola <strong>${name}</strong>,</p>
                    <p style="margin-top:1rem;">Gracias por registrarte en El Bazar del Coleccionista.</p>
                    <p style="margin-top:1rem;">Haz click en el siguiente enlace para verificar tu cuenta:</p>
                    <a href="${verifyUrl}" 
                        style="display:inline-block; background:#90ee90; border:2px solid #000; padding:10px 20px; text-decoration:none; color:#000; font-weight:bold; margin-top:1rem; box-shadow:2px 2px 0px #000;">
                        [OK] VERIFICAR MI CUENTA
                    </a>
                    <p style="margin-top:1.5rem; font-size:0.8rem; color:#555;">
                        Si no creaste esta cuenta ignora este mensaje.
                    </p>
                </div>
            `
        })

        res.status(201).json({ message: 'Registro completado. Verifica tu email.' })
    } catch (error) {
        console.error('ERROR EN REGISTRO:', error)
        
        const msg = error.message || ''
        
        if (msg.includes('users_email_key') || msg.includes('email')) {
            return res.status(400).json({ message: 'Este email ya está registrado.' })
        }
        if (msg.includes('users_dni_key') || msg.includes('dni')) {
            return res.status(400).json({ message: 'Este DNI ya está registrado.' })
        }
        if (msg.includes('users_phone_key') || msg.includes('phone')) {
            return res.status(400).json({ message: 'Este teléfono ya está registrado.' })
        }
        
        res.status(500).json({ message: 'Error al registrar. Inténtalo de nuevo.' })
    }
})

// 2. VERIFICAR EMAIL
router.get('/verify-email', async (req, res) => {
    const { token } = req.query
    console.log('VERIFICANDO TOKEN:', token)
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('verification_token', token)
            .single()

        if (error || !user) return res.status(400).json({ message: 'Token inválido' })

        await supabase
            .from('users')
            .update({ email_verified: true, verification_token: null })
            .eq('id', user.id)

        console.log('EMAIL VERIFICADO:', user.email)
        res.json({ message: 'Email verificado correctamente' })
    } catch (error) {
        console.error('ERROR EN VERIFICACION:', error)
        res.status(500).json({ message: error.message })
    }
})

// 3. LOGIN DE USUARIO
router.post('/login', async (req, res) => {
    const { email, password } = req.body
    console.log('INTENTO DE LOGIN:', email)
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

        if (error || !user) return res.status(404).json({ message: 'Usuario no encontrado' })

        if (!user.email_verified) {
            console.log('EMAIL NO VERIFICADO:', email)
            return res.status(403).json({ message: 'Debes verificar tu email antes de entrar.' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(400).json({ message: 'Contraseña incorrecta' })

        console.log('LOGIN EXITOSO:', email)
        res.json(user)
    } catch (error) {
        console.error('ERROR EN LOGIN:', error)
        res.status(500).json({ message: error.message })
    }
})

// 4. BUSCAR USUARIOS
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

// 5. OBTENER USUARIO POR ID
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

// 6. ACTUALIZAR PERFIL
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

// 7. RECUPERAR CONTRASEÑA
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
        const expires = new Date(Date.now() + 3600000)

        await supabase
            .from('users')
            .update({ reset_token: token, reset_token_expires: expires })
            .eq('id', user.id)

        const resetUrl = `http://localhost:3000/reset-password.html?token=${token}`
        console.log('RESET URL:', resetUrl)

        await transporter.sendMail({
            from: `"El Bazar del Coleccionista" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'RECUPERAR_CONTRASEÑA.EXE — El Bazar del Coleccionista',
            html: `
                <div style="font-family:'Courier New',monospace; background:#f4ecd8; padding:2rem; border:2px solid #000; max-width:500px;">
                    <div style="background:#000080; color:#fff; padding:5px 10px; margin-bottom:1.5rem; font-weight:bold;">
                        RECUPERAR_CONTRASEÑA.EXE
                    </div>
                    <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
                    <p style="margin-top:1rem;">Haz click en el siguiente enlace — expira en 1 hora:</p>
                    <a href="${resetUrl}" 
                       style="display:inline-block; background:#90ee90; border:2px solid #000; padding:10px 20px; text-decoration:none; color:#000; font-weight:bold; margin-top:1rem; box-shadow:2px 2px 0px #000;">
                        [>>>] RESTABLECER CONTRASEÑA
                    </a>
                    <p style="margin-top:1.5rem; font-size:0.8rem; color:#555;">
                        Si no solicitaste este cambio ignora este mensaje.
                    </p>
                </div>
            `
        })

        res.json({ message: 'Enlace enviado' })
    } catch (error) {
        console.error('ERROR EN FORGOT PASSWORD:', error)
        res.status(500).json({ message: error.message })
    }
})

// 8. RESET CONTRASEÑA
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

        console.log('CONTRASEÑA RESETEADA PARA TOKEN:', token)
        res.json({ message: 'Contraseña actualizada' })
    } catch (error) {
        console.error('ERROR EN RESET PASSWORD:', error)
        res.status(500).json({ message: error.message })
    }
})

export default router
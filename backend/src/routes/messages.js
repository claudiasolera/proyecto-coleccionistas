import express from 'express'
import { supabase } from '../db.js'
import { checkExpiredReservations } from '../controllers/products.js'

const router = express.Router()

// 1. Enviar un mensaje (User -> Admin o Admin -> User)
router.post('/', async (req, res) => {
    let { sender_id, receiver_id, text, product_id } = req.body

    try {
        // RESOLUCIÓN DE IDENTIDAD: Si el receptor es 'admin', buscamos su UUID real
        if (receiver_id === 'admin') {
            const { data: adminUser, error: adminErr } = await supabase
                .from('users')
                .select('id')
                .ilike('role', 'admin')
                .limit(1)
                .single();
            
            if (!adminErr && adminUser) {
                receiver_id = adminUser.id;
            } else {
                throw new Error("ERROR: No existe ningún usuario con el ROL 'admin' en la base de datos.");
            }
        }

        // Si el emisor es 'admin', también buscamos su UUID real
        if (sender_id === 'admin') {
            const { data: adminUser, error: adminErr } = await supabase
                .from('users')
                .select('id')
                .ilike('role', 'admin')
                .limit(1)
                .single();
            if (!adminErr && adminUser) {
                sender_id = adminUser.id;
            } else {
                throw new Error("ERROR: No existe ningún usuario con el ROL 'admin' en la base de datos.");
            }
        }

        const { data, error } = await supabase
            .from('messages')
            .insert([{ sender_id, receiver_id, text, product_id }])
            .select()

        if (error) throw error
        res.status(201).json(data[0])
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// 2. Obtener lista de conversaciones únicas para el ADMIN
router.get('/admin/conversations', async (req, res) => {
    try {
        const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select(`
                sender_id, 
                receiver_id,
                created_at,
                is_read,
                users_sender:users!sender_id(id, name, email, role),
                users_receiver:users!receiver_id(id, name, email, role)
            `)
            .order('created_at', { ascending: false });

        if (msgError) throw msgError;

        const conversationMap = {};
        messages.forEach(m => {
            const senderIsAdmin = m.users_sender?.role?.toLowerCase() === 'admin';
            const receiverIsAdmin = m.users_receiver?.role?.toLowerCase() === 'admin';

            let otherUser = null;
            if (senderIsAdmin && !receiverIsAdmin) otherUser = m.users_receiver;
            if (!senderIsAdmin && receiverIsAdmin) otherUser = m.users_sender;

            if (otherUser && otherUser.id) {
                if (!conversationMap[otherUser.id]) {
                    conversationMap[otherUser.id] = {
                        id: otherUser.id,
                        name: otherUser.name || 'Usuario Desconocido',
                        email: otherUser.email,
                        unreadCount: 0
                    };
                }
                if (receiverIsAdmin && !m.is_read) {
                    conversationMap[otherUser.id].unreadCount++;
                }
            }
        });

        res.json(Object.values(conversationMap));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Obtener historial entre Admin y un usuario concreto
router.get('/history/:userId', async (req, res) => {
    const { userId } = req.params;
    await checkExpiredReservations();

    try {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                users_sender:users!sender_id(role),
                users_receiver:users!receiver_id(role),
                products:products!product_id(id, name, price, status, product_images(url))
            `)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Mandamos TODO lo que haya con este cliente, sin filtrar roles
        const history = data.map(m => ({
            ...m,
            is_from_admin: m.users_sender?.role?.toLowerCase() === 'admin'
        }));

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. Marcar mensajes como leídos (Admin abre chat de un usuario)
router.put('/read/:senderId', async (req, res) => {
    const { senderId } = req.params
    try {
        const { data: adminUser } = await supabase
            .from('users')
            .select('id')
            .ilike('role', 'admin')
            .limit(1)
            .single();
        
        const adminId = adminUser ? adminUser.id : 'admin';

        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', senderId)
            .eq('receiver_id', adminId)
            .eq('is_read', false);

        if (error) throw error
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// 5. Contar mensajes sin leer para un usuario (Admin -> User)
router.get('/unread/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        res.json({ unreadCount: count || 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 6. Marcar como leído por el usuario
router.put('/read-user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 7. Contador TOTAL para el Admin
router.get('/admin/unread-total', async (req, res) => {
    try {
        const { data: adminUser } = await supabase
            .from('users')
            .select('id')
            .ilike('role', 'admin')
            .limit(1)
            .single();
        
        const adminId = adminUser ? adminUser.id : 'admin';
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', adminId)
            .eq('is_read', false);

        if (error) throw error;
        res.json({ totalUnread: count || 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router

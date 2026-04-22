import { apiFetch } from './utils.js';
import { supabase } from './supabase.js';

const userListContainer = document.getElementById('users-items');
const chatWindow = document.getElementById('chat-window');
const replyForm = document.getElementById('admin-reply-form');
const adminInput = document.getElementById('admin-input');
const btnSend = document.getElementById('btn-send');

let activeUserId = null;

async function init() {
    loadConversations();
    subscribeToMessages();
}

async function loadConversations() {
    try {
        const users = await apiFetch('/messages/admin/conversations');
        userListContainer.innerHTML = users.map(u => `
            <div class="user-item" data-id="${u.sender_id}">
                <strong>${u.users.name}</strong><br>
                <small>${u.users.email}</small>
            </div>
        `).join('');

        // Eventos click
        document.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', async () => {
                document.querySelectorAll('.user-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                activeUserId = item.dataset.id;

                // Cargar datos del usuario para el info bar
                const user = await apiFetch(`/users/${activeUserId}`);
                const infoBar = document.getElementById('user-info-bar');
                infoBar.innerHTML = `<strong>CLIENTE:</strong> ${user.name} ${user.last_name} | <strong>DNI:</strong> <span style="background:yellow; color:black; padding:0 5px;">${user.dni}</span> | <strong>EMAIL:</strong> ${user.email}`;

                loadHistory(activeUserId);
                adminInput.disabled = false;
                btnSend.disabled = false;
            });
        });

    } catch (err) {
        console.error("Error al cargar chats:", err);
    }
}

async function loadHistory(userId) {
    chatWindow.innerHTML = '<p>Cargando historial...</p>';
    try {
        const messages = await apiFetch(`/messages/history/${userId}`);
        chatWindow.innerHTML = messages.map(m => {
            let productSnippet = '';
            if (m.product_id && m.sender_id !== 'admin') {
                productSnippet = `
                    <div class="product-mini-card" style="background:#fffdec; border:1px dashed orange; padding:10px; margin-top:5px; font-size:0.7rem;">
                        <strong>📦 OBJETO DEL DESEO:</strong> ${m.text.split(': ')[1] || 'Ver Producto'}
                        <button onclick="reserveFromChat('${m.product_id}', '${m.sender_id}')" 
                                style="display:block; margin-top:5px; background:orange; color:white; border:none; padding:5px; width:100%; cursor:pointer; font-weight:bold;">
                            ⚡ RESERVAR PARA ESTE CLIENTE
                        </button>
                    </div>
                `;
            }
            return `
                <div style="margin-bottom: 10px; color: ${m.sender_id === 'admin' ? 'blue' : 'black'}">
                    <strong>${m.sender_id === 'admin' ? 'TÚ (Admin)' : 'USUARIO'}:</strong> ${m.text}
                    ${productSnippet}
                </div>
            `;
        }).join('');
        chatWindow.scrollTop = chatWindow.scrollHeight;
    } catch (err) {
        chatWindow.innerHTML = '<p>Error al cargar historial.</p>';
    }
}

window.reserveFromChat = async (productId, userId) => {
    if (!confirm('¿Quieres reservar este objeto para el coleccionista actual?')) return;
    try {
        await apiFetch(`/admin/${productId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'reserved', reserved_for: userId })
        });
        alert('✨ RESERVADO CON ÉXITO');
        loadHistory(userId); // Recargar para ver si cambia algo o simplemente confirmar
    } catch (err) {
        alert('Error al reservar: ' + err.message);
    }
};

replyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeUserId || !adminInput.value) return;

    const text = adminInput.value;
    adminInput.value = '';

    try {
        await apiFetch('/messages', {
            method: 'POST',
            body: JSON.stringify({
                sender_id: 'admin',
                receiver_id: activeUserId,
                text: text
            })
        });
        
        // El realtime actualizará la vista
    } catch (err) {
        alert('Error al enviar respuesta');
    }
});

function subscribeToMessages() {
    supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            const newMsg = payload.new;
            if (activeUserId && (newMsg.sender_id === activeUserId || newMsg.receiver_id === activeUserId)) {
                loadHistory(activeUserId);
            } else {
                // Si es un nuevo usuario, recargar lista
                loadConversations();
            }
        })
        .subscribe();
}

init();

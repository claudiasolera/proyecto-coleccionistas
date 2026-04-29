import { apiFetch, showNotification } from './utils.js';
import { supabase } from './lib/supabase.js';

const userListContainer = document.getElementById('users-items');
const chatWindow = document.getElementById('chat-window');
const replyForm = document.getElementById('admin-reply-form');
const adminInput = document.getElementById('admin-input');
const btnSend = document.getElementById('btn-send');
const btnAttach = document.getElementById('btn-attach');
const infoBar = document.getElementById('user-info-bar');

const productModal = document.getElementById('product-modal');
const closeModal = document.getElementById('close-modal');
const productListAttach = document.getElementById('product-list-attach');
const searchInput = document.getElementById('search-product-attach');

let activeUserId = null;
let activeUserName = ''
let allProducts = [];

async function init() {
    loadConversations();
    subscribeToMessages();
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderProductList(e.target.value));
    }
}

async function loadConversations() {
    try {
        const users = await apiFetch('/messages/admin/conversations');
        userListContainer.innerHTML = users.map(u => `
            <div class="user-item ${activeUserId === u.id ? 'active' : ''}" 
                 onclick="selectUser('${u.id}', '${u.name}')" 
                 id="user-item-${u.id}">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.2rem; filter: grayscale(1);">📁</span>
                        <strong>${u.name.toUpperCase()}</strong>
                    </div>
                    ${u.unreadCount > 0 ? `<span class="unread-badge" style="background:red; color:white; border-radius:50%; padding:2px 6px; font-size:0.7rem; border:2px solid #000;">${u.unreadCount}</span>` : ''}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Error al cargar chats:", err);
    }
}

window.selectUser = async (id, name) => {
    activeUserId = id;
    activeUserName = name;
    if (infoBar) infoBar.innerText = `EXPEDIENTE: ${name.toUpperCase()}`;
    document.querySelectorAll('.user-item').forEach(i => i.classList.remove('active'));
    const item = document.getElementById(`user-item-${id}`);
    if (item) item.classList.add('active');
    try {
        await apiFetch(`/messages/read/${id}`, { method: 'PUT' });
        loadConversations();
    } catch (err) {}
    loadHistory(id);
    adminInput.disabled = false;
    btnSend.disabled = false;
    btnAttach.disabled = false;
    adminInput.focus();
};

async function loadHistory(userId) {
    if (!userId) return;
    try {
        const messages = await apiFetch(`/messages/history/${userId}`);
        chatWindow.innerHTML = messages.map(m => {
            const myId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'admin';
            const isMe = m.is_from_admin;
            const bubbleClass = isMe ? 'message-me' : 'message-vendedor';
            const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let productHtml = '';
            if (m.products) {
                const p = m.products;
                const isReserved = p.status === 'reserved';
                const isSold = p.status === 'sold';
                
                let reserveBtn = '';
                if (!isReserved && !isSold) {
                    reserveBtn = `
                        <button class="retro-button" 
                                style="background: #cfe2ff; font-size: 0.65rem; padding: 2px 8px; min-width: auto; margin:0;"
                                onclick="event.stopPropagation(); reserveProduct('${p.id}', '${p.name.toUpperCase()}')">
                            RESERVAR PARA ESTE CHAT
                        </button>
                    `;
                } else if (isReserved) {
                    reserveBtn = `<span style="font-size: 0.65rem; color: #000080; font-weight: bold; border: 1px solid #000080; padding: 1px 4px;">YA RESERVADO</span>`;
                }

                productHtml = `
                    <div class="chat-product-card" onclick="window.open('producto.html#id=${p.id}', '_blank')" title="Ver ficha del tesoro">
                        <div class="chat-product-card-title" style="font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 6px;">
                            ARCHIVO: ${p.name.toUpperCase()}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
                            <span style="color: var(--clr-accent); font-weight: bold; font-size: 0.9rem;">${Number(p.price).toFixed(2)} €</span>
                            <div style="display: flex; gap: 5px; align-items: center;">
                                ${reserveBtn}
                                <button class="retro-button" style="padding: 2px 8px; font-size: 0.65rem; min-width: auto; margin:0;">VER DETALLES</button>
                            </div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="message-bubble ${bubbleClass}">
                    <span class="message-header">&lt;${isMe ? 'ADMIN' : activeUserName}&gt;</span>
                    <div class="message-text">
                        ${m.text}
                        ${productHtml}
                    </div>
                    <div class="message-footer" style="text-align:right; font-size:0.65rem; opacity:0.5; margin-top:4px;">${time}</div>
                </div>
            `;
        }).join('');
        chatWindow.scrollTop = chatWindow.scrollHeight;
    } catch (err) {
        chatWindow.innerHTML = '<p style="text-align:center; padding:2rem;">Fallo al recuperar registros históricos.</p>';
    }
}

// Función de reserva con MENSAJE AUTOMÁTICO DE SEGURIDAD
window.reserveProduct = async (pId, pName) => {
    if (!activeUserId) return;
    const myId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'admin';

    try {
        // 1. Efectuar la reserva en base de datos
        await apiFetch(`/admin/${pId}/status`, {
            method: 'PUT',
            body: JSON.stringify({
                status: 'reserved',
                reserved_for: activeUserId
            })
        });

        // 2. Enviar COMUNICADO OFICIAL automático al chat
        await apiFetch('/messages', {
            method: 'POST',
            body: JSON.stringify({
                sender_id: myId,
                receiver_id: activeUserId,
                text: `📋 [COMUNICADO DEL SISTEMA]: Se ha reservado el registro "${pName}" para usted. Dispone de 48 horas para completar la compra antes de que el archivo sea liberado automáticamente.`
            })
        });

        showNotification('RESERVA Y COMUNICADO EJECUTADOS', 'success');
        loadHistory(activeUserId);
    } catch (err) {
        showNotification('ERROR EN PROTOCOLO DE RESERVA', 'error');
    }
};

btnAttach.onclick = async () => {
    if (!activeUserId) return;
    productModal.style.display = 'flex';
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    try {
        const products = await apiFetch('/products');
        allProducts = products.filter(p => p.status !== 'sold');
        renderProductList();
    } catch (err) {
        showNotification('Error al cargar catálogo', 'error');
    }
};

function renderProductList(query = '') {
    const q = query.toLowerCase();
    let filtered = allProducts.filter(p => p.name.toLowerCase().includes(q));
    
    // Añadimos aviso de 48h en la parte superior de la lista
    productListAttach.innerHTML = `
        <div style="background: #fff3cd; color: #856404; padding: 10px; font-size: 0.7rem; border: 1px solid #ffeeba; margin-bottom: 10px; text-align: center; font-family: var(--font-accent);">
            ⚠️ AVISO: LAS RESERVAS TIENEN UNA VALIDEZ DE 48 HORAS
        </div>
    ` + filtered.map(p => {
        const statusText = p.status === 'reserved' ? '[RESERVADO] ' : '';
        return `
            <div class="product-select-item" onclick="sendProduct('${p.id}', '${p.name}')">
                <div style="display: flex; align-items: center;">
                    <span style="font-family: var(--font-accent);">
                        ${statusText}ARCHIVO: ${p.name.toUpperCase()}
                    </span>
                </div>
                <strong style="color: var(--clr-accent); white-space: nowrap; flex-shrink: 0;">${Number(p.price).toFixed(2)} €</strong>
            </div>
        `;
    }).join('');
}

window.sendProduct = async (pId, pName) => {
    productModal.style.display = 'none';
    const myId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'admin';
    try {
        await apiFetch('/messages', {
            method: 'POST',
            body: JSON.stringify({
                sender_id: myId,
                receiver_id: activeUserId,
                text: '',
                product_id: pId
            })
        });
        loadHistory(activeUserId);
    } catch (err) {
        showNotification('ERROR AL ADJUNTAR', 'error');
    }
};

closeModal.onclick = () => productModal.style.display = 'none';

replyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = adminInput.value;
    const myId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'admin';
    if (!activeUserId || !text) return;
    adminInput.value = '';
    try {
        await apiFetch('/messages', {
            method: 'POST',
            body: JSON.stringify({ sender_id: myId, receiver_id: activeUserId, text: text })
        });
        loadHistory(activeUserId);
    } catch (err) {
        showNotification('ERROR DE TRANSMISIÓN', 'error');
    }
});

function subscribeToMessages() {
    supabase.channel('public:messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMsg = payload.new;
        loadConversations();
        if (activeUserId && (newMsg.sender_id === activeUserId || newMsg.receiver_id === activeUserId)) {
            loadHistory(activeUserId);
        }
    }).subscribe();
}

init();

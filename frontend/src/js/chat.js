import { supabase } from './supabase.js';
import { apiFetch } from './utils.js';

const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const btnAttach = document.getElementById('btn-attach');
const productModal = document.getElementById('product-modal');
const closeModal = document.getElementById('close-modal');
const productListAttach = document.getElementById('product-list-attach');

const userId = localStorage.getItem('userId');

if (!userId) {
    alert('Identifícate primero para hablar con el vendedor.');
    window.location.href = '../../login.html';
}

async function init() {
    loadHistory();
    subscribeToMessages();
}

async function loadHistory() {
    try {
        const messages = await apiFetch(`/messages/history/${userId}`);
        chatWindow.innerHTML = messages.map(m => `
            <div style="margin-bottom: 10px; color: ${m.sender_id === 'admin' ? 'blue' : 'black'}">
                <strong>${m.sender_id === 'admin' ? 'VENDEDOR' : 'TÚ'}:</strong> ${m.text}
            </div>
        `).join('');
        chatWindow.scrollTop = chatWindow.scrollHeight;
    } catch (err) {
        console.error("Error al cargar historial");
    }
}

// Lógica de Adjuntar
btnAttach.onclick = async () => {
    productModal.style.display = 'flex';
    const products = await apiFetch('/products');
    productListAttach.innerHTML = products.map(p => `
        <div class="product-select-item" onclick="sendProduct('${p.id}', '${p.name}')">
            <span>${p.name}</span>
            <strong>${p.price} €</strong>
        </div>
    `).join('');
};

window.sendProduct = async (id, name) => {
    productModal.style.display = 'none';
    try {
        await apiFetch('/messages', {
            method: 'POST',
            body: JSON.stringify({
                sender_id: userId,
                receiver_id: 'admin',
                text: `INTERESADO EN: ${name}`,
                product_id: id
            })
        });
    } catch (err) {
        alert('Error al adjuntar producto');
    }
};

closeModal.onclick = () => productModal.style.display = 'none';

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value;
    if (!text) return;
    chatInput.value = '';

    try {
        await apiFetch('/messages', {
            method: 'POST',
            body: JSON.stringify({
                sender_id: userId,
                receiver_id: 'admin',
                text: text
            })
        });
    } catch (err) {
        alert('Error al enviar mensaje');
    }
});

function subscribeToMessages() {
    supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            const newMsg = payload.new;
            if (newMsg.sender_id === userId || newMsg.receiver_id === userId) {
                loadHistory();
            }
        })
        .subscribe();
}

init();

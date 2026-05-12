import { supabase } from './lib/supabase.js';
import { apiFetch, showNotification } from './utils.js';

const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const btnAttach = document.getElementById('btn-attach');
const productModal = document.getElementById('product-modal');
const closeModal = document.getElementById('close-modal');
const productListAttach = document.getElementById('product-list-attach');
const searchInput = document.getElementById('search-product-attach');
const threadList = document.getElementById('thread-list');
const chatThreadTitle = document.getElementById('chat-thread-title');

const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

let allMessages = [];
let allProducts = [];
let favIds = new Set();
let activeThread = 'all'; // 'all' or a product_id string

if (!userId) {
    window.location.href = '../../login.html';
}

async function init() {
    if (!userId) {
        window.location.href = '/login.html';
        return;
    }

    try {
        await apiFetch(`/messages/read-user/${userId}`, { method: 'PUT' });
    } catch (err) {
        console.warn("Fallo al marcar lectura inicial");
    }

    await loadHistory();
    subscribeToMessages();

    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderProductList(e.target.value));
    }

    // Auto-adjuntar producto desde ficha (soporta ? y #)
    const params = new URLSearchParams(window.location.search);
    let productId = params.get('productId');

    if (!productId && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        productId = hashParams.get('productId');
    }

    if (productId) {
        setTimeout(() => autoAttachProduct(productId), 1000);
    }
}

async function autoAttachProduct(pId) {
    try {
        const p = await apiFetch(`/products/${pId}`);
        if (p && !p.error) {
            const res = await fetch('http://localhost:3000/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_id: userId,
                    receiver_id: 'admin',
                    text: 'CONSULTA DE ARTÍCULO',
                    product_id: p.id
                })
            });

            if (res.ok) {
                await loadHistory();
                window.history.replaceState({}, document.title, window.location.pathname);
                showNotification('Consulta enviada correctamente', 'success');
                window.selectThread(pId);
            } else {
                throw new Error("Respuesta del servidor no OK");
            }
        }
    } catch (err) {
        console.error("Error en auto-envío:", err);
        showNotification('Fallo al enviar consulta automática', 'error');
    }
}

function renderMessages(messages) {
    const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName') || 'Tú';

    if (messages.length === 0) {
        chatWindow.innerHTML = `
            <p style="text-align:center; opacity:0.5; margin-top:4rem; font-family:var(--font-accent);">
                [ SIN MENSAJES EN ESTE EXPEDIENTE ]
            </p>`;
        return;
    }

    chatWindow.innerHTML = messages.map(m => {
        const isMe = !m.is_from_admin && m.sender_id === userId;
        const bubbleClass = isMe ? 'message-me' : 'message-vendedor';
        const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let productHtml = '';
        if (m.products) {
            const p = m.products;
            productHtml = `
                <div class="chat-product-card" onclick="location.href='producto.html#id=${p.id}'" title="Ver ficha del tesoro">
                    <div class="chat-product-card-title" style="font-weight:bold; border-bottom:1px solid #ccc; padding-bottom:4px; margin-bottom:6px;">
                        ARCHIVO: ${p.name.toUpperCase()}
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
                        <span style="color:var(--clr-accent); font-weight:bold; font-size:0.9rem;">${Number(p.price).toFixed(2)} €</span>
                        <div style="display:flex; gap:5px; align-items:center;">
                            <button class="retro-button" style="padding:2px 8px; font-size:0.65rem; min-width:auto; margin:0;">VER DETALLES</button>
                        </div>
                    </div>
                </div>`;
        }

        return `
            <div class="message-bubble ${bubbleClass}">
                <span class="message-header">&lt;${isMe ? userName : 'ADMIN'}&gt;</span>
                <div class="message-text">
                    ${m.text}
                    ${productHtml}
                </div>
                <div class="message-footer" style="text-align:right; font-size:0.65rem; opacity:0.5; margin-top:4px;">${time}</div>
            </div>`;
    }).join('');

    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function renderThreadList() {
    if (!threadList) return;

    // Build a map of unique products in the conversation
    const productMap = {};
    allMessages.forEach(m => {
        if (m.product_id && m.products) {
            productMap[m.product_id] = m.products;
        }
    });

    const generalCount = allMessages.filter(m => !m.product_id).length;

    const items = [`
        <div class="thread-item ${activeThread === 'all' ? 'active' : ''}" onclick="window.selectThread('all')">
            <div class="thread-item-title">📋 GENERAL</div>
            <div class="thread-item-meta">${allMessages.length} mensajes totales</div>
        </div>`];

    Object.entries(productMap).forEach(([pid, p]) => {
        const count = allMessages.filter(m => m.product_id === pid).length;
        const shortName = p.name.length > 20 ? p.name.substring(0, 20) + '…' : p.name;
        items.push(`
            <div class="thread-item ${activeThread === pid ? 'active' : ''}" onclick="window.selectThread('${pid}')">
                <div class="thread-item-title">📦 ${shortName}</div>
                <div class="thread-item-meta">${count} mensaje${count !== 1 ? 's' : ''}</div>
            </div>`);
    });

    threadList.innerHTML = items.join('');
}

window.selectThread = (threadId) => {
    activeThread = threadId;

    if (chatThreadTitle) {
        if (threadId === 'all') {
            chatThreadTitle.textContent = 'COM_TERMINAL.EXE - [SESIÓN_ACTIVA]';
        } else {
            const product = allMessages.find(m => m.product_id === threadId)?.products;
            chatThreadTitle.textContent = product
                ? `EXPEDIENTE: ${product.name.toUpperCase()}`
                : 'COM_TERMINAL.EXE - [EXPEDIENTE]';
        }
    }

    renderThreadList();

    const filtered = threadId === 'all'
        ? allMessages
        : allMessages.filter(m => m.product_id === threadId);
    renderMessages(filtered);
};

async function loadHistory() {
    try {
        allMessages = await apiFetch(`/messages/history/${userId}`);
        const filtered = activeThread === 'all'
            ? allMessages
            : allMessages.filter(m => m.product_id === activeThread);
        renderMessages(filtered);
        renderThreadList();
    } catch (err) {
        console.error("Error al cargar historial el usuario:", err);
    }
}

btnAttach.onclick = async () => {
    productModal.style.display = 'flex';
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    try {
        const [products, favorites] = await Promise.all([
            apiFetch('/products'),
            apiFetch(`/favoritos/${userId}`)
        ]);
        allProducts = products.filter(p => p.status !== 'sold');
        favIds = new Set(favorites.map(f => f.product_id));
        renderProductList();
    } catch (err) {
        showNotification('Error al cargar lista de tesoros', 'error');
    }
};

function renderProductList(query = '') {
    const q = query.toLowerCase();
    let filtered = allProducts.filter(p => p.name.toLowerCase().includes(q));
    filtered.sort((a, b) => (favIds.has(b.id) ? 1 : 0) - (favIds.has(a.id) ? 1 : 0));

    if (filtered.length === 0) {
        productListAttach.innerHTML = '<p style="text-align:center; padding:2rem; opacity:0.5;">[ SIN RESULTADOS EN ARCHIVO ]</p>';
        return;
    }

    productListAttach.innerHTML = filtered.map(p => {
        const isFav = favIds.has(p.id);
        const statusText = p.status === 'reserved' ? '[RESERVADO] ' : '';
        const favStar = isFav ? '<span style="color:#d63031; margin-right:5px;">⭐</span>' : '';

        return `
            <div class="product-select-item" onclick="sendProduct('${p.id}', '${p.name}')">
                <div style="display:flex; align-items:center;">
                    <span style="font-family:var(--font-accent);">
                        ${favStar}${statusText}ARCHIVO: ${p.name.toUpperCase()}
                    </span>
                </div>
                <strong style="color:var(--clr-accent); white-space:nowrap; flex-shrink:0;">${Number(p.price).toFixed(2)} €</strong>
            </div>`;
    }).join('');
}

window.sendProduct = async (id, name) => {
    productModal.style.display = 'none';
    try {
        await apiFetch('/messages', {
            method: 'POST',
            body: JSON.stringify({
                sender_id: userId,
                receiver_id: 'admin',
                text: '',
                product_id: id
            })
        });
        await loadHistory();
        window.selectThread(id);
    } catch (err) {
        showNotification(err.message, 'error');
    }
};

closeModal.onclick = () => productModal.style.display = 'none';

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';

    const productId = activeThread !== 'all' ? activeThread : undefined;

    try {
        await apiFetch('/messages', {
            method: 'POST',
            body: JSON.stringify({
                sender_id: userId,
                receiver_id: 'admin',
                text,
                ...(productId && { product_id: productId })
            })
        });
        await loadHistory();
    } catch (err) {
        showNotification(err.message, 'error');
    }
});

function subscribeToMessages() {
    supabase.channel('public:messages').on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages'
    }, payload => {
        const newMsg = payload.new;
        if (newMsg.sender_id === userId || newMsg.receiver_id === userId) {
            loadHistory();
            if (newMsg.receiver_id === userId) {
                apiFetch(`/messages/read-user/${userId}`, { method: 'PUT' }).catch(() => {});
            }
        }
    }).subscribe();
}

init();

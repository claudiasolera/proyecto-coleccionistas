import { apiFetch } from './utils.js';

const form = document.getElementById('profile-form');
const userId = localStorage.getItem('userId');

if (!userId) {
    window.location.href = '../../login.html';
}

// 1. CARGAR DATOS AL INICIAR
window.addEventListener('DOMContentLoaded', async () => {
    
    // --- LOGICA DE RETORNO DE PAGO ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
        const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder'));
        if (pendingOrder) {
            try {
                await apiFetch('/pedidos', {
                    method: 'POST',
                    body: JSON.stringify(pendingOrder)
                });
                localStorage.removeItem('pendingOrder');
                alert('✅ PAGO CONFIRMADO. El artículo ya es suyo.');
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (err) {
                console.error('Error al finalizar pedido:', err);
            }
        }
    }

    // CARGAR DATOS DEL USUARIO
    try {
        const user = await apiFetch(`/users/${userId}`);
        Object.keys(user).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = user[key];
        });
        
        loadFavorites();
    } catch (err) {
        console.warn("Error al cargar perfil:", err.message);
    }
});

async function loadFavorites() {
    const list = document.getElementById('favorites-list');
    try {
        const favorites = await apiFetch(`/favoritos/${userId}`);
        if (favorites.length === 0) {
            list.innerHTML = '<p>Aún no tienes tesoros guardados.</p>';
            return;
        }
        list.innerHTML = favorites.map(fav => {
            const name = fav.products?.name || fav.categories?.name || 'Item';
            const price = fav.products ? `${fav.products.price} €` : 'Categoría';
            const type = fav.product_id ? 'PRODUCTO' : 'CATEGORÍA';
            
            return `
                <div style="border: 1px solid #000; padding: 10px; background: #fffaf0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-size: 0.6rem; background: #000; color: #fff; padding: 2px 5px;">${type}</span>
                        <h3 style="font-size: 0.9rem; margin: 5px 0;">${name}</h3>
                        <p style="font-weight: bold; margin: 0; font-size: 0.8rem;">${price}</p>
                    </div>
                    <button onclick="removeFavorite('${fav.id}')" class="retro-button" style="padding: 2px 5px; font-size: 0.7rem;">ELIMINAR</button>
                </div>
            `;
        }).join('');
    } catch (err) {
        list.innerHTML = '<p>Error al cargar favoritos.</p>';
    }
}

window.removeFavorite = async (id) => {
    if (!confirm('¿Seguro?')) return;
    try {
        await apiFetch(`/favoritos/${id}`, { method: 'DELETE' });
        loadFavorites();
    } catch (err) {
        alert('Error: ' + err.message);
    }
};

// 2. ACTUALIZACIÓN DE DATOS (PUT)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    try {
        await apiFetch(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        alert('✨ TUS DATOS HAN SIDO ACTUALIZADOS');
    } catch (err) {
        alert('Error al actualizar: ' + err.message);
    }
});

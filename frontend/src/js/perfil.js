import { apiFetch, validators } from './utils.js';

const form = document.getElementById('profile-form');

// 1. CARGAR DATOS AL INICIAR
window.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
        console.log('Intentando cargar perfil del usuario:', userId);
        
        // --- LOGICA DE RETORNO DE PAGO (Módulo 3) ---
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
                    alert('✅ PAGO CONFIRMADO POR STRIPE. El artículo ya es tuyo.');
                    // Limpiar la URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (err) {
                    console.error('Error al finalizar pedido:', err);
                }
            }
        }
        // --------------------------------------------

        try {
            const user = await apiFetch(`/users/${userId}`);
            // Rellenar cada campo del formulario dinámicamente si existe en la respuesta
            Object.keys(user).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) input.value = user[key];
            });

            // CARGAR FAVORITOS
            loadFavorites(userId);
            
        } catch (err) {
            console.warn("No se pudo cargar el perfil previo:", err.message);
        }
    }
});

async function loadFavorites(userId) {
    const list = document.getElementById('favorites-list');
    try {
        const favorites = await apiFetch(`/favoritos/${userId}`);
        
        if (favorites.length === 0) {
            list.innerHTML = '<p>Aún no tienes favoritos guardados. ¡Explora el catálogo!</p>';
            return;
        }

        list.innerHTML = favorites.map(fav => {
            if (fav.product_id) {
                // Renderizar Card de Producto
                return `
                    <div style="border: 1px solid #000; padding: 10px; background: #fffaf0; position: relative;">
                        <span style="font-size: 0.6rem; background: #000; color: #fff; padding: 2px 5px; position: absolute; top: 0; right: 0;">PRODUCTO</span>
                        <h3 style="font-size: 1rem; margin: 5px 0;">${fav.products.name}</h3>
                        <p style="font-weight: bold; margin: 0;">${fav.products.price} €</p>
                        <button onclick="removeFavorite('${fav.id}')" class="retro-button" style="padding: 2px 5px; font-size: 0.7rem; margin-top: 5px;" aria-label="Eliminar ${fav.products.name} de favoritos">ELIMINAR</button>
                    </div>
                `;
            } else if (fav.category_id) {
                // Renderizar Etiqueta de Categoría (Tag)
                return `
                    <div style="border: 2px dashed #000; padding: 10px; background: #e6f7ff; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <span style="font-size: 0.6rem; color: #666;">CATEGORÍA</span>
                        <h3 style="font-size: 1.1rem; margin: 5px 0; color: #007bff;">#${fav.categories.name}</h3>
                        <button onclick="removeFavorite('${fav.id}')" class="retro-button" style="padding: 2px 5px; font-size: 0.7rem;" aria-label="Dejar de seguir categoría ${fav.categories.name}">DEJAR DE SEGUIR</button>
                    </div>
                `;
            }
        }).join('');
    } catch (err) {
        list.innerHTML = '<p>Error al cargar favoritos.</p>';
    }
}

// Hacer la función accesible globalmente para los botones
window.removeFavorite = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar este favorito?')) return;
    try {
        await apiFetch(`/favoritos/${id}`, { method: 'DELETE' });
        const userId = localStorage.getItem('userId');
        loadFavorites(userId);
    } catch (err) {
        alert('Error al eliminar: ' + err.message);
    }
};

// 2. LOGICA DE REGISTRO / ACTUALIZACIÓN
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validaciones de seguridad y negocio
    if (!validators.email(data.email)) return alert('Error: El formato del e-mail no es válido.');
    if (!validators.dni(data.dni)) return alert('Error: El DNI debe tener 8 números y una letra.');
    if (!validators.phone(data.phone)) return alert('Error: El teléfono debe tener 9 dígitos.');

    try {
        const result = await apiFetch('/users/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        // Guardar ID en localStorage para futuras visitas
        localStorage.setItem('userId', result.id);
        alert('¡DATOS GUARDADOS EN EL BAZAR CON ÉXITO!');
        
    } catch (err) {
        alert('Error al procesar el registro: ' + err.message);
    }
});

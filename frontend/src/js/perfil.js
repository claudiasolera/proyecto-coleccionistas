import { apiFetch } from './utils.js';

const form = document.getElementById('profile-form');
const userId = localStorage.getItem('userId');
const btnLogout = document.getElementById('btn-logout');

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
    } catch (err) {
        console.warn("Error al cargar perfil:", err.message);
    }
});

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

// 3. LÓGICA DE CIERRE DE SESIÓN
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        if (confirm('¿Seguro que deseas salir del sistema?')) {
            localStorage.clear();
            window.location.href = '../../index.html';
        }
    });
}

import { apiFetch } from './utils.js';

export async function initHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const userId = localStorage.getItem('userId');
    let user = null;

    if (userId) {
        try {
            user = await apiFetch(`/users/${userId}`);
        } catch (err) {
            console.warn("Sesión caducada o usuario no encontrado");
            localStorage.removeItem('userId');
        }
    }

    // Definir los links según el ROl
    let navHTML = `<a href="/index.html">Catálogo</a>`;

    if (!userId) {
        // INVITADO
        navHTML += `<a href="/login.html" class="nav-highlight">ENTRAR / REGISTRO</a>`;
    } else if (user && user.role === 'admin') {
        // ADMIN
        navHTML += `
            <a href="/admin.html">PANEL ADMIN</a>
            <a href="/src/pages/chat_admin.html">CENTRAL DE CHATS</a>
            <a href="#" id="btn-logout">CERRAR SESIÓN</a>
        `;
    } else {
        // USUARIO NORMAL
        navHTML += `
            <a href="/src/pages/perfil.html">MI PERFIL</a>
            <a href="/src/pages/perfil.html#favoritos">FAVORITOS</a>
            <a href="/src/pages/chat.html">CHAT VENDEDOR</a>
            <a href="#" id="btn-logout">CERRAR SESIÓN</a>
        `;
    }

    // Inyectar en el nav del header
    const nav = header.querySelector('.site-nav');
    if (nav) {
        nav.innerHTML = navHTML;
        
        // Lógica de logout
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = '/index.html';
            });
        }
    }
}

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', initHeader);

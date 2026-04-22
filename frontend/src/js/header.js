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
            <a href="/src/pages/perfil.html">MI PERFIL</a>
        `;
    } else {
        // USUARIO NORMAL
        navHTML += `
            <a href="/src/pages/chat.html">CHAT</a>
            <a href="/src/pages/favoritos.html">FAVORITOS</a>
            <a href="/src/pages/perfil.html">MI PERFIL</a>
        `;
    }

    // Inyectar en el nav del header
    const nav = header.querySelector('.site-nav');
    if (nav) {
        nav.innerHTML = navHTML;
    }
}

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', initHeader);

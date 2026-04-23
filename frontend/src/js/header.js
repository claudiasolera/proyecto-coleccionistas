import { apiFetch } from './utils.js';

export async function initHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const nav = header.querySelector('.site-nav');
    if (!nav) return;

    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    // Función centralizada para generar el HTML del menú
    const getNavHTML = (role) => {
        let html = `<a href="/index.html">Catálogo</a>`;
        
        if (!userId) {
            // Caso: INVITADO
            html += `<a href="/login.html" class="nav-highlight">ENTRAR</a>`;
        } else if (role === 'admin') {
            // Caso: ADMINISTRADOR
            html += `
                <a href="/admin.html">PANEL ADMIN</a>
                <a href="/src/pages/chat_admin.html">CENTRAL DE CHATS</a>
                <a href="/src/pages/perfil.html">MI PERFIL</a>
            `;
        } else {
            // Caso: USUARIO REGISTRADO
            html += `
                <a href="/src/pages/chat.html">CHAT</a>
                <a href="/src/pages/favoritos.html">FAVORITOS</a>
                <a href="/src/pages/perfil.html">MI PERFIL</a>
            `;
        }
        return html;
    };

    // 1. Renderizado instantáneo basado en el estado local (Sin parpadeos)
    nav.innerHTML = getNavHTML(userRole);

    // 3. Marcar link activo
    const currentPath = window.location.pathname;
    nav.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        // Normalizamos rutas para comparar (evitamos problemas con / vs /index.html)
        if (currentPath.endsWith(href) || (currentPath === '/' && href === '/index.html')) {
            link.classList.add('active');
        }
    });

    // 2. Validación de seguridad en segundo plano (Opcional)
    if (userId) {
        try {
            const user = await apiFetch(`/users/${userId}`);
            if (user && user.role !== userRole) {
                localStorage.setItem('userRole', user.role);
                nav.innerHTML = getNavHTML(user.role);
                // Re-marcar activo tras actualización de rol
                nav.querySelectorAll('a').forEach(link => {
                    const href = link.getAttribute('href');
                    if (currentPath.endsWith(href) || (currentPath === '/' && href === '/index.html')) {
                        link.classList.add('active');
                    }
                });
            }
        } catch (err) {
            console.warn("No se pudo validar el rol en segundo plano:", err.message);
        }
    }
}

// Iniciar cabecera
initHeader();

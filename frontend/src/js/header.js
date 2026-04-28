import { apiFetch } from './utils.js';

export async function initHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const nav = header.querySelector('.site-nav');
    if (!nav) return;

    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId')
    const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole')
    
    const getNavHTML = (role) => {
        let html = `<a href="/index.html">Catálogo</a>`;
        if (!userId) {
            html += `<a href="/login.html" class="nav-highlight">ENTRAR</a>`;
        } else if (role === 'admin') {
            html += `
                <a href="/admin.html">PANEL ADMIN</a>
                <a href="/src/pages/chat_admin.html">CHATS</a>
                <a href="/src/pages/perfil.html">MI PERFIL</a>
            `;
        } else {
            html += `
                <a href="/src/pages/chat.html">CHAT</a>
                <a href="/src/pages/favoritos.html">FAVORITOS</a>
                <a href="/src/pages/perfil.html">MI PERFIL</a>
            `;
        }
        return html;
    };

    // 1. Renderizado instantáneo
    nav.innerHTML = getNavHTML(userRole);

    let hamburgerBtn = header.querySelector('.hamburger-btn');
    if (!hamburgerBtn) {
        hamburgerBtn = document.createElement('button');
        hamburgerBtn.className = 'hamburger-btn';
        hamburgerBtn.innerHTML = '☰';
        header.insertBefore(hamburgerBtn, nav);
        
        hamburgerBtn.addEventListener('click', () => {
            nav.classList.toggle('open');
        });
    }

    // 2. Marcar link activo
    const currentPath = window.location.pathname;
    const highlightActive = () => {
        nav.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (currentPath.endsWith(href) || (currentPath === '/' && href === '/index.html')) {
                link.classList.add('active');
            }
        });
    };
    highlightActive();

    // 3. Validación de rol y radares de mensajes
    if (userId) {
        // Validación de seguridad (segundo plano)
        try {
            const user = await apiFetch(`/users/${userId}`);
            if (user && user.role !== userRole) {
                localStorage.setItem('userRole', user.role);
                nav.innerHTML = getNavHTML(user.role);
                highlightActive();
            }
        } catch (err) { console.warn("Validación de rol omitida"); }

        // --- RADARES DE MENSAJES ---
        const updateBadges = async () => {
            try {
                if (userRole === 'admin') {
                    // Radar Admin: Total de todos los usuarios
                    const { totalUnread } = await apiFetch('/messages/admin/unread-total');
                    const adminChatLink = nav.querySelector('a[href="/src/pages/chat_admin.html"]');
                    refreshBadge(adminChatLink, totalUnread);
                } else {
                    // Radar Usuario: Mensajes del admin
                    const { unreadCount } = await apiFetch(`/messages/unread/${userId}`);
                    const userChatLink = nav.querySelector('a[href="/src/pages/chat.html"]');
                    refreshBadge(userChatLink, unreadCount);
                }
            } catch (err) {}
        };

        const refreshBadge = (link, count) => {
            if (!link) return;
            const oldBadge = link.querySelector('.unread-badge-mini');
            if (oldBadge) oldBadge.remove();

            // Actualizar también la hamburguesa para el móvil
            const hamburger = document.querySelector('.hamburger-btn');
            const oldHamBadge = hamburger?.querySelector('.unread-badge-mini');
            if (oldHamBadge) oldHamBadge.remove();

            if (count > 0) {
                const badge = document.createElement('span');
                badge.className = 'unread-badge-mini';
                badge.innerText = count;
                badge.style = "background:red; color:white; border-radius:50%; padding:1px 5px; font-size:0.6rem; margin-left:5px; border:1px solid #000; vertical-align:top;";
                link.appendChild(badge);

                // Si hay hamburguesa (móvil), le ponemos también el aviso
                if (hamburger) {
                    const hamBadge = badge.cloneNode(true);
                    hamBadge.style.position = 'absolute';
                    hamBadge.style.top = '2px';
                    hamBadge.style.right = '2px';
                    hamBadge.style.margin = '0';
                    hamBadge.style.boxShadow = '2px 2px 0px rgba(0,0,0,0.5)';
                    hamburger.appendChild(hamBadge);
                }
            }
        };

        updateBadges();
        setInterval(updateBadges, 15000);
    }
}

initHeader();

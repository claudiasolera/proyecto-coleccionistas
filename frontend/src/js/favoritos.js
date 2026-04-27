import { apiFetch, showNotification } from './utils.js';

const userId = localStorage.getItem('userId');
let allFavorites = [];
let currentTab = 'products'; // 'products' o 'categories'

if (!userId) {
    window.location.href = '../../login.html';
}

function formatStatus(status) {
    const labels = {
        available: 'Disponible',
        reserved: 'Reservado',
        sold: 'Vendido'
    }
    return labels[status] || status
}

async function loadFavorites() {
    const list = document.getElementById('favorites-list');
    list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 3rem; font-family: var(--font-accent); opacity: 0.5;">[ SISTEMA: CONSULTANDO ARCHIVOS... ]</p>';
    
    try {
        allFavorites = await apiFetch(`/favoritos/${userId}`);
        renderTab();
    } catch (err) {
        console.error('Error:', err);
        list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; font-family: var(--font-accent); color: red;">ERROR: FALLO EN LA CONEXIÓN DE DATOS</p>';
    }
}

async function renderTab() {
    const list = document.getElementById('favorites-list');
    list.innerHTML = '';

    const filtered = allFavorites.filter(fav => {
        if (currentTab === 'products') return !!fav.product_id;
        if (currentTab === 'categories') return !!fav.category_id;
        return false;
    });

    if (filtered.length === 0) {
        const title = currentTab === 'products' ? 'BAÚL DE PIEZAS VACÍO' : 'ÍNDICE DE COLECCIONES VACÍO';
        const icon = currentTab === 'products' ? '📦' : '📂';
        const msg = currentTab === 'products' 
            ? 'Parece que aún no has rescatado ningún tesoro individual de nuestro catálogo principal.' 
            : 'Aún no has registrado ninguna colección completa en tu archivo de búsqueda.';

        list.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem 2rem; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center;">

                <div style="font-size: 6rem; margin-bottom: 1rem; z-index: 1;">${icon}</div>
                
                <h3 style="font-family: var(--font-main); text-transform: uppercase; font-size: 2.2rem; margin-bottom: 0.5rem; color: #333; letter-spacing: 2px; text-shadow: 2px 2px 0px #fff; z-index: 2;">
                    ${title}
                </h3>
                
                <p style="font-family: var(--font-accent); font-size: 1rem; color: #555; margin-bottom: 1.5rem; max-width: 450px; line-height: 1.4; background: rgba(255,249,230,0.8); z-index: 2;">
                    ${msg}
                </p>

                <button class="retro-button" onclick="location.href='../../index.html'" style="z-index: 10; padding: 12px 25px;">
                    INGRESAR AL CATÁLOGO GENERAL
                </button>
            </div>
        `;
        return;
    }

    // Renderizado de elementos (Igual que en el catálogo)
    for (const fav of filtered) {
        if (currentTab === 'products') {
            try {
                const res = await fetch(`http://localhost:3000/api/products/${fav.product_id}`);
                const p = await res.json();
                if (p) {
                    const imgUrl = p.product_images?.[0]?.url || 'https://via.placeholder.com/150';
                    const article = document.createElement('article');
                    article.className = 'product-card';
                    article.style.display = 'flex';
                    article.style.flexDirection = 'column';
                    article.style.minHeight = '100%';
                    article.innerHTML = `
                        <a href="/src/pages/producto.html#id=${p.id}" style="display: block; position: relative; width: 100%; border-bottom: 2px solid #000; text-decoration: none; color: inherit;">
                            <img src="${imgUrl}" alt="${p.name}" style="display: block; width: 100%; object-fit: cover;">
                            <!-- Badge de Estado -->
                            <div class="product-card-status status-${p.status}" 
                                 style="position: absolute; top: 10px; left: 10px; margin: 0; font-size: 0.7rem; z-index: 2;">
                                ${formatStatus(p.status)}
                            </div>
                        </a>

                        <div class="product-card-body" style="padding: 15px; flex: 1; display: flex; flex-direction: column; min-height: 140px;">
                            <h2 class="product-card-title" style="margin-bottom: 5px; font-size: 1rem; line-height: 1.2;">${p.name}</h2>
                            
                            <div style="flex: 1; display: flex; align-items: center;">
                                <p class="product-card-price" style="font-weight: bold; font-size: 1.2rem; color: var(--clr-accent); margin: 0;">
                                    ${Number(p.price).toFixed(2)} €
                                </p>
                            </div>
                            
                            <div style="display: flex; gap: 8px; margin-top: 10px; align-items: stretch;">
                                <a href="/src/pages/producto.html#id=${p.id}" class="retro-button" style="flex: 1; font-size: 0.8rem; padding: 0; height: 44px; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">
                                    VER DETALLES
                                </a>
                                <button class="retro-button" 
                                        style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #d63031; padding: 0; flex-shrink: 0; box-sizing: border-box;"
                                        onclick="event.stopPropagation(); window.removeFavorite('${fav.id}')">
                                    ♥
                                </button>
                            </div>
                        </div>
                    `;
                    list.appendChild(article);
                }
            } catch (e) { console.error(e); }
        } else {
            try {
                const res = await fetch(`http://localhost:3000/api/categories`);
                const categories = await res.json();
                const c = categories.find(cat => cat.id === fav.category_id);
                if (c) {
                    const article = document.createElement('article');
                    article.className = 'product-card';
                    article.style.display = 'flex';
                    article.style.flexDirection = 'column';
                    article.style.minHeight = '100%';
                    article.innerHTML = `
                        <div onclick="window.goToCategory('${c.id}')" style="cursor: pointer; height: 250px; background: #fcfcfc; display: flex; align-items: center; justify-content: center; border-bottom: 2px solid #000; position: relative; text-decoration: none;">
                            <span style="font-size: 6rem; filter: drop-shadow(4px 4px 0px rgba(0,0,0,0.1));">📁</span>
                            <div class="product-card-status status-available" style="position: absolute; top: 10px; left: 10px;">CATEGORÍA</div>
                        </div>
                        <div class="product-card-body" style="padding: 15px; flex: 1; display: flex; flex-direction: column; min-height: 140px;">
                            <h2 class="product-card-title" style="margin-bottom: 5px; font-size: 1rem; line-height: 1.2;">${c.name}</h2>
                            
                            <div style="flex: 1; display: flex; align-items: center;">
                                <p class="product-card-price" style="font-size: 0.8rem; margin: 0; color: #666;">Colección Completa</p>
                            </div>
                            
                            <div style="display: flex; gap: 8px; margin-top: 10px; align-items: stretch;">
                                <button onclick="window.goToCategory('${c.id}')" class="retro-button" style="flex: 1; font-size: 0.8rem; padding: 0; height: 44px; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">
                                    VER COLECCIÓN
                                </button>
                                <button class="retro-button" 
                                        style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #d63031; padding: 0; flex-shrink: 0; box-sizing: border-box;"
                                        onclick="event.stopPropagation(); window.removeFavorite('${fav.id}')">
                                    ♥
                                </button>
                            </div>
                        </div>
                    `;
                    list.appendChild(article);
                }
            } catch (e) { console.error(e); }
        }
    }
}

document.getElementById('tab-products').addEventListener('click', () => {
    currentTab = 'products';
    document.getElementById('tab-products').classList.add('active');
    document.getElementById('tab-categories').classList.remove('active');
    renderTab();
});

document.getElementById('tab-categories').addEventListener('click', () => {
    currentTab = 'categories';
    document.getElementById('tab-products').classList.remove('active');
    document.getElementById('tab-categories').classList.add('active');
    renderTab();
});

window.removeFavorite = async (id) => {
    try {
        await apiFetch(`/favoritos/${id}`, { method: 'DELETE' });
        showNotification('ARCHIVO ACTUALIZADO: ELEMENTO RETIRADO', 'success');
        loadFavorites();
    } catch (err) {
        showNotification('ERROR AL RETIRAR ELEMENTO: ' + err.message, 'error');
    }
};
window.goToCategory = (id) => {
    localStorage.setItem('filterCategory', id);
    location.href = '/index.html';
};

loadFavorites();

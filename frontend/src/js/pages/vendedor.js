import { apiFetch } from '../utils.js';

const params = new URLSearchParams(window.location.search);
let sellerId = params.get('id');
if (!sellerId && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    sellerId = hashParams.get('id');
}

let allProducts = [];

function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let html = '';
    for (let i = 0; i < 5; i++) {
        if (i < full) html += '<span class="star star-full">★</span>';
        else if (i === full && half) html += '<span class="star star-half">★</span>';
        else html += '<span class="star star-empty">☆</span>';
    }
    return html;
}

function renderProducts(products) {
    const grid = document.getElementById('seller-products-grid');
    if (products.length === 0) {
        grid.innerHTML = '<p style="text-align:center; padding:3rem; opacity:0.5; font-family:var(--font-accent);">[ SIN ARTÍCULOS DISPONIBLES ]</p>';
        return;
    }
    const statusLabels = { available: 'Disponible', reserved: 'Reservado', sold: 'Vendido' };
    grid.innerHTML = products.map(p => {
        const imgUrl = p.product_images?.[0]?.url || '';
        const imgHtml = imgUrl
            ? `<img src="${imgUrl}" alt="${p.name}" style="display:block; width:100%; height:180px; object-fit:cover;">`
            : `<div style="height:180px; background:#eee; display:flex; align-items:center; justify-content:center; font-size:2rem; border-bottom:2px solid #000;">📦</div>`;
        return `
        <article class="product-card">
            <a href="/src/pages/producto.html#id=${p.id}" style="display:block; position:relative; text-decoration:none; color:inherit; border-bottom:2px solid #000;">
                ${imgHtml}
                <span class="product-card-status status-${p.status}" style="position:absolute; top:8px; left:8px; font-size:0.65rem;">${statusLabels[p.status] || p.status}</span>
            </a>
            <div class="product-card-body" style="padding:12px; display:flex; flex-direction:column; gap:6px;">
                <h3 class="product-card-title" style="font-size:0.9rem;">${p.name}</h3>
                <p class="product-card-price" style="font-size:1.1rem;">${Number(p.price).toFixed(2)} €</p>
                <a href="/src/pages/producto.html#id=${p.id}" class="retro-button" style="display:block; text-align:center; font-size:0.75rem; text-decoration:none;">VER DETALLES</a>
            </div>
        </article>`;
    }).join('');
}

function renderRatingBars() {
    const bars = document.getElementById('rating-bars');
    const distribution = [
        { stars: 5, pct: 78 },
        { stars: 4, pct: 15 },
        { stars: 3, pct: 5 },
        { stars: 2, pct: 1 },
        { stars: 1, pct: 1 },
    ];
    bars.innerHTML = distribution.map(d => `
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-family:var(--font-accent); font-size:0.75rem;">
            <span style="width:20px; text-align:right;">${d.stars}★</span>
            <div style="flex:1; height:12px; background:#eee; border:1px solid #ccc; position:relative; overflow:hidden;">
                <div style="width:${d.pct}%; height:100%; background:var(--clr-primary);"></div>
            </div>
            <span style="width:30px;">${d.pct}%</span>
        </div>
    `).join('');
}

async function loadSeller() {
    if (!sellerId) {
        document.getElementById('seller-display-name').textContent = 'Vendedor desconocido';
        return;
    }

    try {
        const user = await apiFetch(`/users/public/${sellerId}`);
        const displayName = user.name ? `${user.name} ${user.last_name || ''}`.trim() : 'El Bazar del Coleccionista';
        const initials = (user.name?.[0] || 'E').toUpperCase();
        const memberYear = user.created_at ? new Date(user.created_at).getFullYear() : '—';

        document.getElementById('seller-avatar-big').textContent = initials;
        document.getElementById('seller-display-name').textContent = displayName;
        document.getElementById('seller-rating-display').innerHTML =
            `<span class="star-rating">${renderStars(4.8)}</span> <span style="font-family:var(--font-accent); font-size:0.85rem; opacity:0.8;">4.8</span>`;
        document.getElementById('seller-meta').textContent =
            `✔ Vendedor Verificado · Miembro Fundador · ${memberYear}`;

        document.getElementById('seller-badges').innerHTML = `
            <span style="background:#e0ffd0; border:1px solid #000; padding:2px 10px; font-family:var(--font-accent); font-size:0.65rem;">★ VERIFICADO</span>
            <span style="background:#d0e8ff; border:1px solid #000; padding:2px 10px; font-family:var(--font-accent); font-size:0.65rem;">🏪 MIEMBRO FUNDADOR</span>
        `;

        allProducts = await apiFetch('/products');
        const activeProducts = allProducts.filter(p => p.status !== 'sold');
        const soldCount = allProducts.filter(p => p.status === 'sold').length;

        document.getElementById('stat-products').textContent = activeProducts.length;
        document.getElementById('stat-sales').textContent = soldCount;
        document.getElementById('stat-rating').textContent = '4.8';
        document.getElementById('stat-since').textContent = memberYear;

        renderProducts(activeProducts);

        document.getElementById('big-rating').textContent = '4.8';
        document.getElementById('big-stars').innerHTML = renderStars(4.8);
        renderRatingBars();

        document.getElementById('reviews-list').innerHTML = `
            <p style="text-align:center; opacity:0.5; padding:2rem; font-family:var(--font-accent);">
                [ SIN VALORACIONES PÚBLICAS TODAVÍA ]
            </p>
        `;

        document.title = `${displayName} — Escaparate`;
    } catch (err) {
        console.error('Error cargando perfil del vendedor:', err);
        document.getElementById('seller-display-name').textContent = 'El Bazar del Coleccionista';
        allProducts = await apiFetch('/products').catch(() => []);
        renderProducts(allProducts.filter(p => p.status !== 'sold'));
    }
}

// Tab switching
document.getElementById('tab-productos').addEventListener('click', () => {
    document.getElementById('tab-productos').classList.add('active');
    document.getElementById('tab-valoraciones').classList.remove('active');
    document.getElementById('content-productos').style.display = 'block';
    document.getElementById('content-valoraciones').style.display = 'none';
});

document.getElementById('tab-valoraciones').addEventListener('click', () => {
    document.getElementById('tab-valoraciones').classList.add('active');
    document.getElementById('tab-productos').classList.remove('active');
    document.getElementById('content-valoraciones').style.display = 'block';
    document.getElementById('content-productos').style.display = 'none';
});

// Search within escaparate
document.getElementById('seller-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => p.status !== 'sold' && p.name.toLowerCase().includes(q));
    renderProducts(filtered);
});

loadSeller();

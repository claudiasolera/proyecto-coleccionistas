import { getCart, removeFromCart, clearCart } from '../carrito.js';
import { showNotification } from '../utils.js';

const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartCountEl = document.getElementById('cart-count-display');
const cartSummaryEl = document.getElementById('cart-summary-items');
const checkoutActionsEl = document.getElementById('cart-checkout-actions');
const btnClear = document.getElementById('btn-clear-cart');

const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

function render() {
    const cart = getCart();

    cartCountEl.textContent = cart.length;

    if (cart.length === 0) {
        cartItemsEl.innerHTML = `
            <div style="text-align:center; padding:4rem; font-family:var(--font-accent); opacity:0.5;">
                <p style="font-size:1.5rem; margin-bottom:1rem;">[ BOLSA VACÍA ]</p>
                <p style="font-size:0.85rem;">No hay artículos seleccionados.</p>
                <a href="/index.html" class="retro-button" style="display:inline-block; margin-top:1.5rem; text-decoration:none;">
                    ← IR AL CATÁLOGO
                </a>
            </div>
        `;
        cartTotalEl.textContent = '0,00 €';
        cartSummaryEl.innerHTML = '<p style="opacity:0.5;">Sin artículos</p>';
        checkoutActionsEl.innerHTML = '';
        return;
    }

    const total = cart.reduce((acc, p) => acc + p.price, 0);
    cartTotalEl.textContent = total.toFixed(2).replace('.', ',') + ' €';

    cartItemsEl.innerHTML = cart.map(p => {
        const imgHtml = p.image
            ? `<img src="${p.image}" alt="${p.name}" style="width:80px; height:80px; object-fit:cover; border:2px solid #000; flex-shrink:0;">`
            : `<div style="width:80px; height:80px; background:#eee; border:2px solid #000; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0;">📦</div>`;

        const statusLabels = { available: 'Disponible', reserved: 'Reservado', sold: 'Vendido' };
        const statusClass = `status-${p.status}`;

        return `
            <div class="cart-item" data-id="${p.id}">
                <a href="/src/pages/producto.html#id=${p.id}" style="display:flex; gap:1rem; text-decoration:none; color:inherit; flex:1; align-items:center;">
                    ${imgHtml}
                    <div style="flex:1;">
                        <p style="font-weight:bold; font-size:1rem; margin-bottom:4px;">${p.name}</p>
                        <span class="product-card-status ${statusClass}" style="font-size:0.65rem;">${statusLabels[p.status] || p.status}</span>
                    </div>
                </a>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px; flex-shrink:0;">
                    <strong style="font-size:1.1rem; color:var(--clr-accent);">${Number(p.price).toFixed(2)} €</strong>
                    <button class="retro-button btn-remove-item" data-id="${p.id}" style="font-size:0.7rem; background:#ffd0d0; padding:4px 10px;">
                        QUITAR
                    </button>
                    <a href="/src/pages/checkout.html#id=${p.id}" class="retro-button" style="font-size:0.7rem; background:#90ee90; padding:4px 10px; text-decoration:none; white-space:nowrap;">
                        COMPRAR
                    </a>
                </div>
            </div>
        `;
    }).join('');

    cartSummaryEl.innerHTML = cart.map(p =>
        `<div class="summary-row"><span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:160px;">${p.name}</span><span style="flex-shrink:0; margin-left:8px;">${Number(p.price).toFixed(2)} €</span></div>`
    ).join('');

    checkoutActionsEl.innerHTML = `
        <p style="font-family:var(--font-accent); font-size:0.7rem; text-align:center; opacity:0.6; border:1px dashed #ccc; padding:8px;">
            Cada artículo es único. Cómpralo individualmente o uno a uno.
        </p>
    `;

    document.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            removeFromCart(btn.dataset.id);
            showNotification('Artículo eliminado de la bolsa', 'success');
            render();
        });
    });
}

btnClear.addEventListener('click', () => {
    if (getCart().length === 0) return;
    clearCart();
    showNotification('Bolsa vaciada', 'success');
    render();
});

if (!userId) {
    document.getElementById('cart-checkout-actions').innerHTML = `
        <a href="/login.html" class="retro-button" style="text-align:center; text-decoration:none; background:#ffffcc;">
            🔒 INICIA SESIÓN PARA COMPRAR
        </a>
    `;
}

render();

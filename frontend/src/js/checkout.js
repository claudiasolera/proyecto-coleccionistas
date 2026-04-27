import { apiFetch, formatCurrency, showNotification } from './utils.js';

const summaryContainer = document.getElementById('product-summary');
const totalContainer = document.getElementById('total-price');
const shippingCostLabel = document.getElementById('shipping-cost');
const btnPay = document.getElementById('btn-pay');
const shippingForm = document.getElementById('shipping-form');

// Obtener ID del producto desde la URL (Soporte dual ? y # para evitar borrados del servidor)
const urlParams = new URLSearchParams(window.location.search);
let productId = urlParams.get('id');

if (!productId && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    productId = hashParams.get('id');
}
const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId')

let productPrice = 0;
let shippingPrice = 0;
let productName = ''
let shippingMethods = [];

async function init() {
    if (!productId || !userId) {
        showNotification('Faltan datos del producto o usuario.', 'error');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return;
    }

    try {
        const product = await apiFetch(`/products/${productId}`);
        productName = product.name
        productPrice = parseFloat(product.price);

        const statusLabels = {
            available: 'Disponible',
            reserved: 'Reservado',
            sold: 'Vendido'
        };
        
        summaryContainer.innerHTML = `
            <p class="summary-product-name">${product.name}</p>
            <p class="summary-product-status">Estado: ${statusLabels[product.status] || product.status}</p>
            <p class="summary-product-price">${formatCurrency(productPrice)}</p>
        `;

        await loadShippingMethods();
        updateTotal();
    } catch (err) {
        console.error(err);
        summaryContainer.innerHTML = '<p>Error al cargar el producto.</p>';
    }
}

async function loadShippingMethods() {
    const container = document.getElementById('shipping-options-container');
    try {
        shippingMethods = await apiFetch('/shipping');
        if (shippingMethods.length === 0) {
            container.innerHTML = '<p style="padding: 1rem;">No hay métodos de envío configurados.</p>';
            return;
        }

        container.innerHTML = shippingMethods.map((method, index) => `
            <div class="shipping-option ${index === 0 ? 'selected' : ''}" data-id="${method.id}">
                <input type="radio" id="ship-${method.id}" name="logistics" value="${method.name}" ${index === 0 ? 'checked' : ''}>
                <div class="shipping-label">
                    <strong>${method.name}</strong>
                    <span>${method.description || ''}</span>
                    <span>${parseFloat(method.price) === 0 ? 'Gratis' : formatCurrency(method.price)}</span>
                </div>
            </div>
        `).join('');

        // Set initial shipping price
        if (shippingMethods.length > 0) {
            shippingPrice = parseFloat(shippingMethods[0].price);
            shippingCostLabel.innerText = formatCurrency(shippingPrice);
        }

        // Re-attach event listeners for the new elements
        attachShippingListeners();

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="padding: 1rem; color: var(--clr-accent);">Error al cargar métodos de envío.</p>';
    }
}

function attachShippingListeners() {
    document.querySelectorAll('.shipping-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.shipping-option').forEach(o => o.classList.remove('selected'))
            option.classList.add('selected')
            const radio = option.querySelector('input[type="radio"]');
            radio.checked = true;
            
            // Update price based on selected method
            const methodId = option.dataset.id;
            const method = shippingMethods.find(m => m.id === methodId);
            if (method) {
                shippingPrice = parseFloat(method.price);
                shippingCostLabel.innerText = formatCurrency(shippingPrice);
                updateTotal();
            }
        })
    })
}

function updateTotal() {
    const total = productPrice + shippingPrice;
    totalContainer.innerText = formatCurrency(total);
}

// Manejar cambio de logística (Mantenido por compatibilidad si se dispara manualmente)
shippingForm.addEventListener('change', (e) => {
    const methodName = e.target.value;
    const method = shippingMethods.find(m => m.name === methodName);
    if (method) {
        shippingPrice = parseFloat(method.price);
        shippingCostLabel.innerText = formatCurrency(shippingPrice);
        updateTotal();
    }
});

// Pagar y redirigir a Stripe
btnPay.addEventListener('click', async () => {
    const method = shippingForm.logistics.value;
    const total = productPrice + shippingPrice;

    try {
        btnPay.disabled = true;
        btnPay.innerText = 'CONECTANDO CON PASARELA...';

        // 1. Crear sesión en Stripe
        const session = await apiFetch('/pagos/create-checkout-session', {
            method: 'POST',
            body: JSON.stringify({
                name: productName,
                price: total,
                product_id: productId,
                user_id: userId,
                shipping_method: method
            })
        });

        // 2. Guardar datos temporales para cuando volvamos del pago
        localStorage.setItem('pendingOrder', JSON.stringify({
            user_id: userId,
            product_id: productId,
            shipping_method: method,
            total_amount: total
        }));

        // 3. Redirigir a pasarela oficial
        window.location.href = session.url;
        
    } catch (err) {
        showNotification('Error con Stripe: ' + err.message, 'error');
        btnPay.disabled = false;
        btnPay.innerText = 'PAGAR AHORA';
    }
});

// Se eliminó el listener estático de .shipping-option porque ahora se añaden dinámicamente

init();

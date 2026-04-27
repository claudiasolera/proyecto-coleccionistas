import { apiFetch, formatCurrency, showNotification } from './utils.js';

const summaryContainer = document.getElementById('product-summary');
const totalContainer = document.getElementById('total-price');
const shippingCostLabel = document.getElementById('shipping-cost');
const btnPay = document.getElementById('btn-pay');
const shippingForm = document.getElementById('shipping-form');

// Obtener ID del producto desde la URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');
const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId')

let productPrice = 0;
let shippingPrice = 5.00;
let productName = ''

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

        updateTotal();
    } catch (err) {
        console.error(err);
        summaryContainer.innerHTML = '<p>Error al cargar el producto.</p>';
    }
}

function updateTotal() {
    const total = productPrice + shippingPrice;
    totalContainer.innerText = formatCurrency(total);
}

// Manejar cambio de logística
shippingForm.addEventListener('change', (e) => {
    const method = e.target.value;
    if (method === 'Certificado') shippingPrice = 5.00;
    else if (method === 'Punto de Recogida') shippingPrice = 3.00;
    else shippingPrice = 0.00;
    
    shippingCostLabel.innerText = formatCurrency(shippingPrice);
    updateTotal();
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

document.querySelectorAll('.shipping-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.shipping-option').forEach(o => o.classList.remove('selected'))
        option.classList.add('selected')
        option.querySelector('input[type="radio"]').checked = true
        option.querySelector('input[type="radio"]').dispatchEvent(new Event('change', { bubbles: true }))
    })
})

init();

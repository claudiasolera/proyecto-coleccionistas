import { apiFetch, formatCurrency } from './utils.js';

const summaryContainer = document.getElementById('product-summary');
const totalContainer = document.getElementById('total-price');
const shippingCostLabel = document.getElementById('shipping-cost');
const btnPay = document.getElementById('btn-pay');
const shippingForm = document.getElementById('shipping-form');

// Obtener ID del producto desde la URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');
const userId = localStorage.getItem('userId');

let productPrice = 0;
let shippingPrice = 5.00;

async function init() {
    if (!productId || !userId) {
        alert('Faltan datos del producto o usuario.');
        window.location.href = '../../index.html';
        return;
    }

    try {
        const product = await apiFetch(`/products/${productId}`);
        productPrice = parseFloat(product.price);
        
        summaryContainer.innerHTML = `
            <p><strong>${product.name}</strong></p>
            <p>Estado: ${product.status}</p>
            <p>Precio: ${formatCurrency(productPrice)}</p>
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

// Pagar y actualizar stock
btnPay.addEventListener('click', async () => {
    const method = shippingForm.logistics.value;
    const total = productPrice + shippingPrice;

    if (!confirm(`¿Confirmar pago de ${formatCurrency(total)} por envío ${method}?`)) return;

    try {
        btnPay.disabled = true;
        btnPay.innerText = 'PROCESANDO PAGO...';

        const order = await apiFetch('/pedidos', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                product_id: productId,
                shipping_method: method,
                total_amount: total
            })
        });

        alert('✨ COMPRA REALIZADA CON ÉXITO. El producto ha sido marcado como VENDIDO.');
        window.location.href = 'perfil.html';
    } catch (err) {
        alert('Error en la transacción: ' + err.message);
        btnPay.disabled = false;
        btnPay.innerText = 'PAGAR AHORA';
    }
});

init();

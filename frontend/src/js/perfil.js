import { apiFetch, showNotification } from './utils.js';

const form = document.getElementById('profile-form');
const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
const btnLogout = document.getElementById('btn-logout');

// Elementos de Pestañas
const tabPerfil = document.getElementById('tab-perfil');
const tabCompras = document.getElementById('tab-compras');
const contentPerfil = document.getElementById('content-perfil');
const contentCompras = document.getElementById('content-compras');
const purchasesList = document.getElementById('purchases-list');

if (!userId) {
    window.location.href = '/login.html';
}

// --- LÓGICA DE PESTAÑAS ---
function showPerfilTab() {
    tabPerfil.classList.add('active');
    tabCompras.classList.remove('active');
    contentPerfil.style.display = 'block';
    contentCompras.style.display = 'none';
}

tabPerfil.addEventListener('click', showPerfilTab);

tabCompras.addEventListener('click', async () => {
    tabCompras.classList.add('active');
    tabPerfil.classList.remove('active');
    contentCompras.style.display = 'block';
    contentPerfil.style.display = 'none';
    await loadPurchases();
});

// Inicializar vista
showPerfilTab();


// --- CARGAR COMPRAS ---
async function loadPurchases() {
    purchasesList.innerHTML = '<p style="text-align: center; padding: 3rem; opacity: 0.5;">Consultando base de datos...</p>';
    
    try {
        const orders = await apiFetch(`/pedidos/user/${userId}`);
        
        if (!orders || orders.length === 0) {
            purchasesList.innerHTML = '<p style="text-align: center; padding: 3rem; opacity: 0.5;">No se han encontrado registros de compra.</p>';
            return;
        }

        purchasesList.innerHTML = '';
        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'product-select-item';
            
            // Lógica de colores y estados refinada
            const status = order.status || 'paid';
            let statusColor = '#90ee90'; 
            let statusText = 'PAGADO';
            let trackingInfo = '';

            if (status === 'preparing') { 
                statusColor = '#fff3cd'; 
                statusText = 'EN PREPARACIÓN'; 
            }
            if (status === 'ready') { 
                statusColor = '#bbf7d0'; 
                statusText = 'LISTO PARA RECOGER'; 
            }
            if (status === 'shipped') { 
                statusColor = '#d1e3ff'; 
                statusText = 'ENVIADO'; 
                if (order.tracking_number) {
                    trackingInfo = `<div style="font-size: 0.65rem; margin-top: 4px; color: #000080; font-family: monospace;">SEG: ${order.tracking_number}</div>`;
                }
            }
            if (status === 'completed') { 
                statusColor = '#e2e2e2'; 
                statusText = 'ENTREGADO'; 
            }

            card.style.borderLeft = `6px solid ${statusColor}`;
            
            const date = new Date(order.created_at).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            card.innerHTML = `
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px; flex-wrap: wrap;">
                        <span style="font-size: 0.6rem; background: ${statusColor}; color: #000; padding: 2px 6px; font-weight: bold; border: 1px solid #000; text-transform: uppercase;">${statusText}</span>
                        <strong style="font-size: 0.95rem;">${order.products.name}</strong>
                    </div>
                    <span style="font-size: 0.75rem; opacity: 0.7;">Pedido #${order.id.slice(0,8).toUpperCase()} - ${date}</span>
                    ${trackingInfo}
                </div>
                <div style="text-align: right; display: flex; flex-direction: column; gap: 5px; justify-content: center;">
                    <span style="font-weight: bold; color: var(--clr-accent);">${order.total_amount}€</span>
                    <button class="retro-button btn-invoice" style="font-size: 0.6rem; padding: 2px 8px;">VER FACTURA</button>
                </div>
            `;

            card.querySelector('.btn-invoice').addEventListener('click', () => showInvoice(order));
            purchasesList.appendChild(card);
        });

    } catch (err) {
        console.error("Error al cargar compras:", err);
        purchasesList.innerHTML = '<p style="color: red; text-align: center;">Error al conectar con el servidor.</p>';
    }
}

// --- MOSTRAR FACTURA (LEGAL) ---
function showInvoice(order) {
    const modal = document.getElementById('invoice-modal');
    const metaTop = document.getElementById('invoice-meta-top');
    const clientData = document.getElementById('invoice-client-data');
    const invoiceItems = document.getElementById('invoice-items');
    
    // 1. Metadatos
    const date = new Date(order.created_at).toLocaleDateString('es-ES');
    const orderId = order.id.slice(0,12).toUpperCase();
    metaTop.innerHTML = `
        <strong>FACTURA Nº:</strong> ${orderId}<br>
        <strong>FECHA:</strong> ${date}<br>
        <strong>REF. INTERNA:</strong> ${order.id.slice(0,8)}
    `;

    // 2. Datos del Cliente (Los sacamos del formulario actual)
    const name = form.querySelector('[name="name"]').value + ' ' + form.querySelector('[name="last_name"]').value;
    const dni = form.querySelector('[name="dni"]').value;
    const address = form.querySelector('[name="address"]').value;
    
    clientData.innerHTML = `
        <h3 style="font-size: 0.9rem; border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 5px;">DATOS DEL RECEPTOR</h3>
        <strong>${name.toUpperCase()}</strong><br>
        DNI/NIF: ${dni || '[NO_REGISTRADO]'}<br>
        Dirección: ${address || '[DIRECCIÓN_FALTANTE]'}<br>
        País: España
    `;

    // 3. Cálculos de Impuestos (21% IVA incluido en total)
    const total = parseFloat(order.total_amount);
    const shipping = order.total_amount - order.products.price;
    const baseTotal = total / 1.21;
    const ivaTotal = total - baseTotal;

    // Desglose del producto
    const productPrice = parseFloat(order.products.price);
    const productBase = productPrice / 1.21;
    const productIva = productPrice - productBase;

    // Desglose de envío
    const shippingPrice = parseFloat(shipping);
    const shippingBase = shippingPrice / 1.21;
    const shippingIva = shippingPrice - shippingBase;

    invoiceItems.innerHTML = `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 15px 10px;">
                <strong>${order.products.name}</strong><br>
                <span style="font-size: 0.75rem; color: #666;">Pieza de colección única.</span>
            </td>
            <td style="padding: 15px 10px; text-align: right;">${productBase.toFixed(2)}€</td>
            <td style="padding: 15px 10px; text-align: right;">21%</td>
            <td style="padding: 15px 10px; text-align: right;">${productPrice.toFixed(2)}€</td>
        </tr>
        <tr>
            <td style="padding: 15px 10px;">
                <strong>Gastos de Envío / Gestión</strong><br>
                <span style="font-size: 0.75rem; color: #666;">Modalidad: ${order.shipping_method}</span>
            </td>
            <td style="padding: 15px 10px; text-align: right;">${shippingBase.toFixed(2)}€</td>
            <td style="padding: 15px 10px; text-align: right;">21%</td>
            <td style="padding: 15px 10px; text-align: right;">${shippingPrice.toFixed(2)}€</td>
        </tr>
    `;

    // 4. Totales finales
    document.getElementById('invoice-base-total').textContent = baseTotal.toFixed(2) + '€';
    document.getElementById('invoice-iva-total').textContent = ivaTotal.toFixed(2) + '€';
    document.getElementById('invoice-grand-total').textContent = total.toFixed(2) + '€';

    modal.style.display = 'flex';
}

// --- FUNCIÓN DE DESCARGA DIRECTA A PDF ---
window.downloadPDF = function() {
    const element = document.getElementById('invoice-print-area');
    const invoiceId = document.getElementById('invoice-meta-top').innerText.split('\n')[0].split(': ')[1];
    
    const opt = {
        margin:       10,
        filename:     `Factura_${invoiceId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, logging: false, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Ejecutar la descarga
    html2pdf().set(opt).from(element).save();
}

// 1. CARGAR DATOS AL INICIAR
window.addEventListener('DOMContentLoaded', async () => {
    // --- LOGICA DE RETORNO DE PAGO ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
        const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder'));
        if (pendingOrder) {
            try {
                await apiFetch('/pedidos', {
                    method: 'POST',
                    body: JSON.stringify(pendingOrder)
                });
                localStorage.removeItem('pendingOrder');
                showNotification('PAGO CONFIRMADO. El artículo ya es suyo.', 'success');
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (err) {
                console.error('Error al finalizar pedido:', err);
            }
        }
    }

    // CARGAR DATOS DEL USUARIO
    try {
        const user = await apiFetch(`/users/${userId}`);
        Object.keys(user).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = user[key];
        });
    } catch (err) {
        console.warn("Error al cargar perfil:", err.message);
    }
});

// 2. ACTUALIZACIÓN DE DATOS (PUT)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    try {
        await apiFetch(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        showNotification('TUS DATOS HAN SIDO ACTUALIZADOS', 'success');
    } catch (err) {
        showNotification('Error al actualizar: ' + err.message, 'error');
    }
});

// 3. LÓGICA DE CIERRE DE SESIÓN
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../../index.html';
    });
}


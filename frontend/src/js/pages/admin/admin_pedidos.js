import { apiFetch, showNotification } from '../../utils.js';
import { supabase } from '../../lib/supabase.js';

let allOrders = [];
let activeOrderId = null;

export async function initPedidos() {
    await loadOrders();
    subscribeToNewOrders();
}

export async function loadOrders() {
    try {
        allOrders = await apiFetch('/pedidos/admin/all');
        renderOrderList(allOrders);
        updateNewOrdersBadge();
    } catch (err) {
        console.error('Error al cargar pedidos:', err);
    }
}

function renderOrderList(orders) {
    const container = document.getElementById('orders-list');
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = '<p class="order-detail-empty">[ SIN REGISTROS DE PEDIDOS ]</p>';
        return;
    }

    container.innerHTML = orders.map(o => {
        const { cssClass, label } = getStatusInfo(o.status);
        const date = new Date(o.created_at).toLocaleDateString('es-ES');
        const clientName = o.users
            ? `${o.users.name} ${o.users.last_name}`.toUpperCase()
            : 'CLIENTE DESCONOCIDO';

        return `
            <div class="order-list-item ${activeOrderId === o.id ? 'active' : ''}"
                 onclick="window.selectOrder('${o.id}')"
                 id="order-item-${o.id}"
                 style="border-left: 5px solid var(--order-status-color-${o.status}, #ccc);">
                <div class="order-list-item-header">
                    <strong class="order-list-item-name">${o.products?.name?.toUpperCase() || 'PRODUCTO'}</strong>
                    <span class="order-status-badge ${cssClass}">${label}</span>
                </div>
                <div class="order-list-item-meta">${clientName} · ${date}</div>
                ${o.status === 'paid' ? '<span class="order-new-label">● NUEVO</span>' : ''}
            </div>
        `;
    }).join('');
}

window.selectOrder = function(orderId) {
    activeOrderId = orderId;
    document.querySelectorAll('.order-list-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById(`order-item-${orderId}`);
    if (activeEl) activeEl.classList.add('active');

    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    renderOrderDetail(order);

    const layout = document.getElementById('orders-layout');
    if (layout) layout.classList.add('detail-active');
};

function renderOrderDetail(order) {
    const panel = document.getElementById('order-detail-panel');
    if (!panel) return;

    const { cssClass, label } = getStatusInfo(order.status);
    const date = new Date(order.created_at).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const user = order.users || {};
    const product = order.products || {};
    const total = parseFloat(order.total_amount || 0);
    const productPrice = parseFloat(product.price || 0);
    const shippingPrice = total - productPrice;

    panel.innerHTML = `
        <div class="order-detail-header">
            <div>
                <div class="order-detail-id">PEDIDO #${order.id.slice(0,8).toUpperCase()}</div>
                <h3 class="order-detail-title">${product.name?.toUpperCase() || 'PRODUCTO'}</h3>
                <div class="order-detail-date">${date}</div>
            </div>
            <span class="order-status-badge ${cssClass}">${label}</span>
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h4 class="order-section-title">Detalle del Pedido</h4>
            <div class="order-line">
                <span>${product.name || '—'}</span>
                <strong>${productPrice.toFixed(2)}€</strong>
            </div>
            <div class="order-line">
                <span>Envío: <em>${order.shipping_method || '—'}</em></span>
                <strong>${shippingPrice.toFixed(2)}€</strong>
            </div>
            <div class="order-total-line">
                <span>TOTAL</span>
                <span style="color: var(--clr-accent);">${total.toFixed(2)}€</span>
            </div>
            ${order.tracking_number ? `
                <div class="order-tracking-box">🚚 TRACKING: <strong>${order.tracking_number}</strong></div>
            ` : ''}
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h4 class="order-section-title">Datos del Cliente</h4>
            <div class="order-client-data">
                <div><strong>NOMBRE:</strong> ${user.name || '—'} ${user.last_name || ''}</div>
                <div><strong>DNI/NIF:</strong> ${user.dni || '—'}</div>
                <div><strong>DIRECCIÓN:</strong> ${user.address || '—'}</div>
                <div><strong>TELÉFONO:</strong> ${user.phone || '—'}</div>
                <div><strong>EMAIL:</strong> ${user.email || '—'}</div>
            </div>
        </div>

        <div id="order-action-buttons" class="order-action-buttons">
            ${getActionButtons(order)}
        </div>

        <button onclick="window.closeOrderDetail()" class="retro-button btn-back-orders"
            id="btn-back-orders" style="width: 100%; margin-top: 1rem; background: #eee; display: none;">
            ← VOLVER AL LISTADO
        </button>
    `;

    if (window.innerWidth < 850) {
        const btnBack = document.getElementById('btn-back-orders');
        if (btnBack) btnBack.style.display = 'block';
    }
}

function getActionButtons(order) {
    const isPickup = order.shipping_method &&
        (order.shipping_method.toLowerCase().includes('recog') ||
         order.shipping_method.toLowerCase().includes('tienda') ||
         order.shipping_method.toLowerCase().includes('local'));

    if (order.status === 'paid') {
        return `
            <button onclick="window.changeOrderStatus('${order.id}', 'preparing')"
                class="retro-button order-action-btn order-action-btn-preparing">
                🔧 EMPEZAR A PREPARAR
            </button>`;
    }
    if (order.status === 'preparing') {
        if (isPickup) {
            return `
                <button onclick="window.changeOrderStatus('${order.id}', 'ready')"
                    class="retro-button order-action-btn order-action-btn-ready">
                    ✅ LISTO PARA RECOGIDA
                </button>`;
        } else {
            return `
                <button onclick="window.promptTracking('${order.id}')"
                    class="retro-button order-action-btn order-action-btn-shipped">
                    📦 MARCAR COMO ENVIADO
                </button>`;
        }
    }
    if (order.status === 'ready' || order.status === 'shipped') {
        return `
            <button onclick="window.changeOrderStatus('${order.id}', 'completed')"
                class="retro-button order-action-btn order-action-btn-completed">
                🏁 CONFIRMAR ENTREGA
            </button>`;
    }
    if (order.status === 'completed') {
        return `<div class="order-completed-notice">✓ PEDIDO COMPLETADO — SIN ACCIONES PENDIENTES</div>`;
    }
    return '';
}

window.promptTracking = function(orderId) {
    const btnArea = document.getElementById('order-action-buttons');
    if (!btnArea) return;

    btnArea.innerHTML = `
        <div class="order-tracking-form">
            <label>CÓDIGO DE SEGUIMIENTO (obligatorio):</label>
            <input type="text" id="tracking-input" class="retro-input" placeholder="Ej: ES123456789CN">
            <div class="order-tracking-actions">
                <button onclick="window.confirmShipment('${orderId}')"
                    class="retro-button order-action-btn order-action-btn-shipped" style="flex: 1;">
                    ✓ CONFIRMAR ENVÍO
                </button>
                <button onclick="window.selectOrder('${orderId}')"
                    class="retro-button" style="background: #eee;">
                    CANCELAR
                </button>
            </div>
        </div>`;
    document.getElementById('tracking-input').focus();
};

window.confirmShipment = async function(orderId) {
    const input = document.getElementById('tracking-input');
    const tracking = input ? input.value.trim().toUpperCase() : '';
    if (!tracking) {
        showNotification('El código de seguimiento es obligatorio', 'error');
        if (input) input.style.borderColor = 'red';
        return;
    }
    await changeStatus(orderId, 'shipped', tracking);
};

window.changeOrderStatus = async function(orderId, newStatus) {
    await changeStatus(orderId, newStatus, null);
};

async function changeStatus(orderId, newStatus, trackingNumber) {
    try {
        const body = { status: newStatus };
        if (trackingNumber) body.tracking_number = trackingNumber;

        await apiFetch(`/pedidos/admin/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });

        showNotification('Estado actualizado correctamente', 'success');
        await loadOrders();
        const updatedOrder = allOrders.find(o => o.id === orderId);
        if (updatedOrder) renderOrderDetail(updatedOrder);
    } catch (err) {
        showNotification('Error al actualizar estado: ' + err.message, 'error');
    }
}

async function updateNewOrdersBadge() {
    const newOrders = allOrders.filter(o => o.status === 'paid').length;
    const badge = document.getElementById('orders-badge');
    if (!badge) return;
    badge.textContent = newOrders;
    badge.style.display = newOrders > 0 ? 'inline-flex' : 'none';
}

function subscribeToNewOrders() {
    supabase.channel('public:orders')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async () => {
            await loadOrders();
            showNotification('🛒 ¡Nuevo pedido recibido!', 'success');
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, async () => {
            await loadOrders();
            if (activeOrderId) {
                const updated = allOrders.find(o => o.id === activeOrderId);
                if (updated) renderOrderDetail(updated);
            }
        })
        .subscribe();
}

function getStatusInfo(status) {
    const map = {
        paid:       { cssClass: 'order-status-paid',       label: 'PAGADO' },
        preparing:  { cssClass: 'order-status-preparing',  label: 'EN PREPARACIÓN' },
        ready:      { cssClass: 'order-status-ready',      label: 'LISTO P. RECOGER' },
        shipped:    { cssClass: 'order-status-shipped',     label: 'ENVIADO' },
        completed:  { cssClass: 'order-status-completed',   label: 'ENTREGADO' },
    };
    return map[status] || { cssClass: '', label: status?.toUpperCase() || '—' };
}

window.closeOrderDetail = function() {
    const layout = document.getElementById('orders-layout');
    if (layout) layout.classList.remove('detail-active');
    activeOrderId = null;
};
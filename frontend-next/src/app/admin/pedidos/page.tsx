'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { showNotification } from '@/components/Notification';
import type { Order } from '@/types';

const STATUS_FLOW: Record<string, string[]> = {
  paid: ['preparing'],
  preparing: ['ready', 'shipped'],
  ready: ['completed'],
  shipped: ['completed'],
  completed: [],
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pagado', preparing: 'Preparando', ready: 'Listo',
  shipped: 'Enviado', completed: 'Completado',
};

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    try {
      const data = await apiFetch<Order[]>('/pedidos/admin/all');
      setOrders(data || []);
    } catch {
      showNotification('Error al cargar pedidos', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, status: string) {
    const trackingNumber = tracking[orderId];
    if (status === 'shipped' && !trackingNumber) {
      showNotification('Introduce el número de seguimiento antes de marcar como enviado', 'error');
      return;
    }
    try {
      await apiFetch(`/pedidos/admin/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, tracking_number: trackingNumber }),
      });
      showNotification('Estado actualizado', 'success');
      loadOrders();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  }

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <div className="retro-window">
        <div className="retro-titlebar"><span>📦 GESTIÓN DE PEDIDOS</span></div>
        <div className="retro-window-body" style={{ padding: '1rem' }}>
          {loading ? (
            <p style={{ fontFamily: 'var(--font-accent)' }}>[ CARGANDO PEDIDOS... ]</p>
          ) : orders.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-accent)', opacity: 0.6 }}>[ SIN PEDIDOS ]</p>
          ) : orders.map(o => {
            const nextStatuses = STATUS_FLOW[o.status] || [];
            return (
              <div key={o.id} style={{ border: '2px outset #fff', marginBottom: '1rem', background: '#f9f9f9' }}>
                <div style={{ background: '#000080', color: '#fff', padding: '4px 8px', fontFamily: 'var(--font-accent)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>PEDIDO #{o.id.substring(0, 8).toUpperCase()}</span>
                  <span className={`product-card-status status-${o.status}`} style={{ margin: 0, fontSize: '0.7rem' }}>{STATUS_LABELS[o.status]}</span>
                </div>
                <div style={{ padding: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontFamily: 'var(--font-accent)', fontSize: '0.8rem' }}>
                  <div><strong>PRODUCTO:</strong> {o.products?.name}</div>
                  <div><strong>IMPORTE:</strong> <span style={{ color: 'var(--clr-accent)' }}>{Number(o.total_amount).toFixed(2)} €</span></div>
                  <div><strong>CLIENTE:</strong> {o.users?.name} {o.users?.last_name}</div>
                  <div><strong>ENVÍO:</strong> {o.shipping_method}</div>
                  <div style={{ gridColumn: '1/-1' }}><strong>DIRECCIÓN:</strong> {o.users?.address || '–'}</div>
                  {o.tracking_number && (
                    <div style={{ gridColumn: '1/-1' }}><strong>TRACKING:</strong> {o.tracking_number}</div>
                  )}
                  <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                    {nextStatuses.includes('shipped') && (
                      <input
                        className="retro-input"
                        placeholder="Número de seguimiento"
                        value={tracking[o.id] || ''}
                        onChange={e => setTracking(p => ({ ...p, [o.id]: e.target.value }))}
                        style={{ fontSize: '0.75rem', flex: 1, minWidth: 150 }}
                      />
                    )}
                    {nextStatuses.map(s => (
                      <button key={s} className="retro-button" style={{ fontSize: '0.7rem' }} onClick={() => updateStatus(o.id, s)}>
                        → {STATUS_LABELS[s].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

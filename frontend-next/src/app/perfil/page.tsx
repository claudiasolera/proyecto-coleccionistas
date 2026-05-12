'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { showNotification } from '@/components/Notification';
import type { User, Order } from '@/types';

function PerfilContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { auth, isLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', last_name: '', email: '', dni: '', address: '', phone: '' });
  const [tab, setTab] = useState<'info' | 'pedidos'>('info');

  useEffect(() => {
    if (isLoading) return;
    if (!auth?.userId) { router.push('/login'); return; }
    if (params.get('success') === 'true') {
      showNotification('Pago completado con éxito', 'success');
      window.history.replaceState({}, '', '/perfil');
    }
    loadData();
  }, [auth, isLoading]);

  async function loadData() {
    if (!auth?.userId) return;
    const [u, o] = await Promise.all([
      apiFetch<User>(`/users/${auth.userId}`),
      apiFetch<Order[]>(`/pedidos/user/${auth.userId}`).catch(() => []),
    ]);
    setUser(u);
    setOrders(o);
    setForm({ name: u.name, last_name: u.last_name || '', email: u.email, dni: u.dni || '', address: u.address || '', phone: u.phone || '' });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch(`/users/${auth!.userId}`, { method: 'PUT', body: JSON.stringify(form) });
      showNotification('Perfil actualizado', 'success');
      setEditing(false);
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  }

  const STATUS_LABELS: Record<string, string> = {
    paid: 'Pagado', preparing: 'Preparando', ready: 'Listo para recoger',
    shipped: 'Enviado', completed: 'Completado',
  };

  if (!user) return <div style={{ padding: '2rem', fontFamily: 'var(--font-accent)' }}>[ CARGANDO EXPEDIENTE... ]</div>;

  const initials = user.name?.[0]?.toUpperCase() || '?';

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      {/* Header */}
      <div className="retro-window" style={{ marginBottom: '1.5rem' }}>
        <div className="retro-titlebar"><span>👤 MI_EXPEDIENTE.EXE</span></div>
        <div className="retro-window-body" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div className="seller-avatar-big">{initials}</div>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-accent)', fontSize: '1.2rem' }}>
              {user.name} {user.last_name}
            </h2>
            <p style={{ margin: '4px 0', opacity: 0.7, fontSize: '0.85rem' }}>{user.email}</p>
            <p style={{ margin: 0, fontFamily: 'var(--font-accent)', fontSize: '0.75rem' }}>
              MIEMBRO DESDE: {new Date(user.created_at).getFullYear()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem' }}>
        {(['info', 'pedidos'] as const).map(t => (
          <button key={t} className="retro-button" style={{ background: tab === t ? 'var(--clr-primary)' : undefined, color: tab === t ? 'white' : undefined }} onClick={() => setTab(t)}>
            {t === 'info' ? '📋 MIS DATOS' : '📦 MIS PEDIDOS'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="retro-window">
          <div className="retro-titlebar">
            <span>DATOS PERSONALES</span>
            <button className="retro-button" style={{ fontSize: '0.75rem' }} onClick={() => setEditing(!editing)}>
              {editing ? 'CANCELAR' : '✏️ EDITAR'}
            </button>
          </div>
          <div className="retro-window-body" style={{ padding: '1.5rem' }}>
            {editing ? (
              <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                {[
                  { field: 'name', label: 'NOMBRE' }, { field: 'last_name', label: 'APELLIDOS' },
                  { field: 'email', label: 'EMAIL' }, { field: 'dni', label: 'DNI' },
                  { field: 'phone', label: 'TELÉFONO' }, { field: 'address', label: 'DIRECCIÓN' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="retro-label">{label}:</label>
                    <input className="retro-input" value={form[field as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
                  </div>
                ))}
                <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
                  <button type="submit" className="retro-button" style={{ background: '#90ee90' }}>GUARDAR CAMBIOS</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontFamily: 'var(--font-accent)', fontSize: '0.85rem' }}>
                {[['NOMBRE', `${user.name} ${user.last_name || ''}`], ['EMAIL', user.email], ['DNI', user.dni || '-'], ['TELÉFONO', user.phone || '-'], ['DIRECCIÓN', user.address || '-']].map(([label, value]) => (
                  <div key={label}><strong>{label}:</strong> {value}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'pedidos' && (
        <div className="retro-window">
          <div className="retro-titlebar"><span>HISTORIAL DE PEDIDOS</span></div>
          <div className="retro-window-body" style={{ padding: '1rem' }}>
            {orders.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-accent)', opacity: 0.6 }}>[ SIN PEDIDOS EN EL HISTORIAL ]</p>
            ) : orders.map(o => (
              <div key={o.id} style={{ borderBottom: '1px dashed #ccc', padding: '0.8rem 0', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ fontFamily: 'var(--font-accent)', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{o.products?.name?.toUpperCase()}</div>
                  <div style={{ opacity: 0.7, fontSize: '0.75rem' }}>{new Date(o.created_at).toLocaleDateString('es-ES')}</div>
                  {o.tracking_number && <div style={{ fontSize: '0.7rem' }}>TRACKING: {o.tracking_number}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'var(--clr-accent)', fontWeight: 'bold' }}>{Number(o.total_amount).toFixed(2)} €</span>
                  <span className={`product-card-status status-${o.status}`} style={{ margin: 0, fontSize: '0.7rem' }}>
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PerfilPage() {
  return <Suspense><PerfilContent /></Suspense>;
}

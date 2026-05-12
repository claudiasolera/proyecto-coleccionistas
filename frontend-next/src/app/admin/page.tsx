'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { showNotification } from '@/components/Notification';
import type { Product } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible', reserved: 'Reservado', sold: 'Vendido',
};

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      const data = await apiFetch<Product[]>('/admin/inventory');
      setProducts(data || []);
    } catch {
      showNotification('Error al cargar inventario', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    try {
      await apiFetch(`/admin/${id}`, { method: 'DELETE' });
      showNotification('Producto eliminado', 'success');
      loadInventory();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const stats = {
    total: products.length,
    available: products.filter(p => p.status === 'available').length,
    reserved: products.filter(p => p.status === 'reserved').length,
    sold: products.filter(p => p.status === 'sold').length,
  };

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'TOTAL', num: stats.total },
          { label: 'DISPONIBLES', num: stats.available },
          { label: 'RESERVADOS', num: stats.reserved },
          { label: 'VENDIDOS', num: stats.sold },
        ].map(({ label, num }) => (
          <div key={label} className="stat-box" style={{ textAlign: 'center' }}>
            <div className="stat-number">{num}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="retro-window">
        <div className="retro-titlebar">
          <span>📦 INVENTARIO COMPLETO</span>
          <input
            className="retro-input"
            placeholder="BUSCAR..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: '0.75rem', padding: '2px 6px' }}
          />
        </div>
        <div className="retro-window-body" style={{ padding: '1rem' }}>
          {loading ? (
            <p style={{ fontFamily: 'var(--font-accent)' }}>[ CARGANDO INVENTARIO... ]</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-accent)', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#000080', color: '#fff' }}>
                  {['NOMBRE', 'PRECIO', 'ESTADO', 'PUBLICADO', 'ACCIONES'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? '#f9f9f9' : '#fff', borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '6px 8px' }}>{p.name}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--clr-accent)', fontWeight: 'bold' }}>{Number(p.price).toFixed(2)} €</td>
                    <td style={{ padding: '6px 8px' }}>
                      <span className={`product-card-status status-${p.status}`} style={{ margin: 0, fontSize: '0.7rem' }}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px', opacity: 0.7 }}>
                      {new Date(p.published_at).toLocaleDateString('es-ES')}
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <a href={`/admin/nuevo-producto?edit=${p.id}`} className="retro-button" style={{ fontSize: '0.65rem', padding: '1px 6px', textDecoration: 'none' }}>EDITAR</a>
                        <button className="retro-button" style={{ fontSize: '0.65rem', padding: '1px 6px', background: '#ffcccc' }} onClick={() => deleteProduct(p.id, p.name)}>BORRAR</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

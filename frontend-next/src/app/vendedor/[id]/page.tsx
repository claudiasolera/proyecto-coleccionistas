'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { showNotification } from '@/components/Notification';
import type { User, Product } from '@/types';

function renderStars(rating: number) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return [0, 1, 2, 3, 4].map(i => {
    if (i < full) return <span key={i} className="star star-full">★</span>;
    if (i === full && half) return <span key={i} className="star star-half">★</span>;
    return <span key={i} className="star star-empty">☆</span>;
  });
}

export default function VendedorPage() {
  const { id } = useParams<{ id: string }>();
  const [seller, setSeller] = useState<Partial<User> | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'escaparate' | 'valoraciones'>('escaparate');
  const RATING = 4.8;

  useEffect(() => {
    Promise.all([
      apiFetch<User>(`/users/public/${id}`),
      apiFetch<Product[]>('/products'),
    ]).then(([s, p]) => {
      setSeller(s);
      setProducts(p);
    }).catch(() => showNotification('Error al cargar perfil', 'error'));
  }, [id]);

  const displayName = seller?.name ? `${seller.name} ${seller.last_name || ''}`.trim() : 'El Bazar del Coleccionista';
  const initials = seller?.name?.[0]?.toUpperCase() || 'A';
  const memberYear = seller?.created_at ? new Date(seller.created_at).getFullYear() : '–';
  const activeProducts = products.filter(p => p.status === 'available');
  const soldProducts = products.filter(p => p.status === 'sold');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) && p.status !== 'sold'
  );

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      {/* Header vendedor */}
      <div className="retro-window" style={{ marginBottom: '1.5rem' }}>
        <div className="retro-titlebar"><span>🏪 FICHA_VENDEDOR.EXE — Perfil Público</span></div>
        <div className="retro-window-body" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="seller-avatar-big">{initials}</div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: 'var(--font-accent)', fontSize: '1.3rem', margin: 0 }}>{displayName.toUpperCase()}</h1>
              <div className="star-rating" style={{ margin: '4px 0' }}>
                {renderStars(RATING)}<span style={{ marginLeft: 6, fontSize: '0.85rem' }}>{RATING} / 5</span>
              </div>
              <p style={{ fontFamily: 'var(--font-accent)', fontSize: '0.75rem', margin: 0, opacity: 0.7 }}>
                MIEMBRO DESDE: {memberYear}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            {[
              { num: activeProducts.length, label: 'ARTÍCULOS ACTIVOS' },
              { num: soldProducts.length, label: 'VENTAS COMPLETADAS' },
              { num: RATING, label: 'VALORACIÓN MEDIA' },
              { num: memberYear, label: 'AÑO DE INGRESO' },
            ].map(({ num, label }) => (
              <div key={label} className="stat-box">
                <div className="stat-number">{num}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem' }}>
        <button className="retro-button" style={{ background: tab === 'escaparate' ? 'var(--clr-primary)' : undefined, color: tab === 'escaparate' ? 'white' : undefined }} onClick={() => setTab('escaparate')}>
          🏪 ESCAPARATE
        </button>
        <button className="retro-button" style={{ background: tab === 'valoraciones' ? 'var(--clr-primary)' : undefined, color: tab === 'valoraciones' ? 'white' : undefined }} onClick={() => setTab('valoraciones')}>
          ⭐ VALORACIONES
        </button>
      </div>

      {tab === 'escaparate' && (
        <>
          <input
            className="retro-input" placeholder="BUSCAR EN ESCAPARATE..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: '1rem', maxWidth: 300 }}
          />
          <div className="products-grid">
            {filtered.map(p => {
              const img = p.product_images?.[0]?.url || 'https://via.placeholder.com/300x200';
              return (
                <article key={p.id} className="product-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <a href={`/productos/${p.id}`} style={{ display: 'block', position: 'relative', borderBottom: '2px solid #000', textDecoration: 'none' }}>
                    <img src={img} alt={p.name} style={{ width: '100%', objectFit: 'cover', aspectRatio: '4/3' }} />
                    <div className={`product-card-status status-${p.status}`} style={{ position: 'absolute', top: 10, left: 10, margin: 0, fontSize: '0.7rem' }}>
                      {p.status === 'reserved' ? 'Reservado' : 'Disponible'}
                    </div>
                  </a>
                  <div className="product-card-body" style={{ padding: 15, flex: 1 }}>
                    <h2 className="product-card-title" style={{ fontSize: '1rem', margin: '0 0 8px' }}>{p.name}</h2>
                    <p style={{ color: 'var(--clr-accent)', fontWeight: 'bold', margin: 0 }}>{Number(p.price).toFixed(2)} €</p>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {tab === 'valoraciones' && (
        <div className="retro-window">
          <div className="retro-titlebar"><span>VALORACIONES DE CLIENTES</span></div>
          <div className="retro-window-body" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--clr-accent)' }}>{RATING}</div>
                <div className="star-rating">{renderStars(RATING)}</div>
                <div style={{ fontFamily: 'var(--font-accent)', fontSize: '0.75rem', marginTop: 4, opacity: 0.7 }}>VALORACIÓN GLOBAL</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['5 estrellas', 78], ['4 estrellas', 15], ['3 estrellas', 5], ['2 estrellas', 1], ['1 estrella', 1]].map(([label, pct]) => (
                  <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-accent)', fontSize: '0.7rem', width: 80, flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, height: 10, background: '#e0e0e0', border: '1px solid #999' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--clr-accent)' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-accent)', fontSize: '0.7rem', width: 35, flexShrink: 0 }}>{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-accent)', opacity: 0.5, textAlign: 'center' }}>[ SISTEMA DE RESEÑAS EN CONSTRUCCIÓN ]</p>
          </div>
        </div>
      )}
    </div>
  );
}

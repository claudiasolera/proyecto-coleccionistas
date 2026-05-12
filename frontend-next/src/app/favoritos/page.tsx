'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { showNotification } from '@/components/Notification';
import type { Favorite } from '@/types';

export default function FavoritosPage() {
  const router = useRouter();
  const { auth, isLoading } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!auth?.userId) { router.push('/login'); return; }
    apiFetch<Favorite[]>(`/favoritos/${auth.userId}`)
      .then(setFavorites)
      .catch(() => showNotification('Error al cargar favoritos', 'error'))
      .finally(() => setLoading(false));
  }, [auth, isLoading]);

  async function removeFavorite(id: string) {
    try {
      await apiFetch(`/favoritos/${id}`, { method: 'DELETE' });
      setFavorites(prev => prev.filter(f => f.id !== id));
      showNotification('Quitado de favoritos', 'success');
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  }

  if (loading) return <div style={{ padding: '2rem', fontFamily: 'var(--font-accent)' }}>[ CARGANDO FAVORITOS... ]</div>;

  const productFavs = favorites.filter(f => f.product_id && f.products);
  const categoryFavs = favorites.filter(f => f.category_id && f.categories);

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <div className="retro-window" style={{ marginBottom: '1.5rem' }}>
        <div className="retro-titlebar"><span>♥ ARCHIVOS_FAVORITOS.EXE</span></div>
      </div>

      {/* Productos favoritos */}
      <h2 style={{ fontFamily: 'var(--font-accent)', fontSize: '1rem', marginBottom: '1rem' }}>ARTÍCULOS GUARDADOS</h2>
      {productFavs.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-accent)', opacity: 0.6, marginBottom: '2rem' }}>[ SIN ARTÍCULOS FAVORITOS ]</p>
      ) : (
        <div className="products-grid" style={{ marginBottom: '2rem' }}>
          {productFavs.map(fav => {
            const p = fav.products!;
            const imgUrl = p.product_images?.[0]?.url || 'https://via.placeholder.com/300x200?text=SIN+IMAGEN';
            return (
              <article key={fav.id} className="product-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <a href={`/productos/${p.id}`} style={{ display: 'block', position: 'relative', borderBottom: '2px solid #000', textDecoration: 'none', color: 'inherit' }}>
                  <img src={imgUrl} alt={p.name} style={{ width: '100%', objectFit: 'cover', aspectRatio: '4/3' }} />
                  <div className={`product-card-status status-${p.status}`} style={{ position: 'absolute', top: 10, left: 10, margin: 0, fontSize: '0.7rem' }}>
                    {p.status === 'available' ? 'Disponible' : p.status === 'reserved' ? 'Reservado' : 'Vendido'}
                  </div>
                </a>
                <div className="product-card-body" style={{ padding: 15, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h2 className="product-card-title" style={{ fontSize: '1rem', margin: 0 }}>{p.name}</h2>
                  <p style={{ color: 'var(--clr-accent)', fontWeight: 'bold', margin: 0 }}>{Number(p.price).toFixed(2)} €</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link href={`/productos/${p.id}`} className="retro-button" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', fontSize: '0.8rem' }}>VER</Link>
                    <button className="retro-button" style={{ width: 44, fontSize: '1.1rem', color: '#d63031' }} onClick={() => removeFavorite(fav.id)}>♥</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Categorías favoritas */}
      {categoryFavs.length > 0 && (
        <>
          <h2 style={{ fontFamily: 'var(--font-accent)', fontSize: '1rem', marginBottom: '1rem' }}>CATEGORÍAS GUARDADAS</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {categoryFavs.map(fav => (
              <div key={fav.id} className="retro-window" style={{ padding: '0.5rem 1rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-accent)' }}>📁 {fav.categories?.name.toUpperCase()}</span>
                <button
                  className="retro-button"
                  style={{ fontSize: '0.7rem', padding: '1px 6px' }}
                  onClick={() => removeFavorite(fav.id)}
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

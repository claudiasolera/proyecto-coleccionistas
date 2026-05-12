'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, addToCart, isInCart } from '@/lib/api';
import { showNotification } from '@/components/Notification';
import type { Product, Category, Favorite } from '@/types';

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    available: 'Disponible', reserved: 'Reservado', sold: 'Vendido',
  };
  return labels[status] || status;
}

function renderStars(rating: number) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push(<span key={i} className="star star-full">★</span>);
    else if (i === full && half) stars.push(<span key={i} className="star star-half">★</span>);
    else stars.push(<span key={i} className="star star-empty">☆</span>);
  }
  return stars;
}

export default function CatalogPage() {
  const { auth, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '', category: '', sort: 'newest', min_price: '', max_price: '',
  });
  const [cartItems, setCartItems] = useState<string[]>([]);

  useEffect(() => {
    loadInitial();
    const onCart = () => setCartItems(JSON.parse(localStorage.getItem('cart') || '[]').map((i: any) => i.id));
    window.addEventListener('cartUpdated', onCart);
    return () => window.removeEventListener('cartUpdated', onCart);
  }, []);

  async function loadInitial() {
    try {
      const [cats] = await Promise.all([apiFetch<Category[]>('/categories')]);
      setCategories(cats);
      if (auth?.userId) {
        const favs = await apiFetch<Favorite[]>(`/favoritos/${auth.userId}`).catch(() => []);
        setFavorites(favs);
      }
    } catch {}
    await loadProducts({});
  }

  async function loadProducts(f: typeof filters | {}) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const active = { ...filters, ...f } as any;
      Object.entries(active).forEach(([k, v]) => { if (v) params.append(k, v as string); });
      const data = await apiFetch<Product[]>(`/products?${params}`);
      setProducts(data || []);
      setCartItems(JSON.parse(localStorage.getItem('cart') || '[]').map((i: any) => i.id));
    } catch {
      showNotification('Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  }

  function isFavorite(productId: string) {
    return favorites.some(f => f.product_id === productId);
  }

  async function handleFavorite(productId: string) {
    if (!auth?.userId) { window.location.href = '/login'; return; }
    const fav = favorites.find(f => f.product_id === productId);
    try {
      if (fav) {
        await apiFetch(`/favoritos/${fav.id}`, { method: 'DELETE' });
        setFavorites(prev => prev.filter(f => f.id !== fav.id));
        showNotification('Quitado de favoritos', 'success');
      } else {
        const newFav = await apiFetch<Favorite>('/favoritos', {
          method: 'POST',
          body: JSON.stringify({ user_id: auth.userId, product_id: productId }),
        });
        setFavorites(prev => [...prev, newFav]);
        showNotification('Añadido a favoritos', 'success');
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  }

  async function handleCart(product: Product) {
    if (!auth?.userId) { window.location.href = '/login'; return; }
    if (cartItems.includes(product.id)) {
      window.location.href = '/carrito';
      return;
    }
    const added = addToCart(product);
    if (added) {
      setCartItems(prev => [...prev, product.id]);
      showNotification('Añadido a la bolsa', 'success');
    }
  }

  function applyFilters() {
    loadProducts(filters);
  }

  function clearFilters() {
    const reset = { search: '', category: '', sort: 'newest', min_price: '', max_price: '' };
    setFilters(reset);
    loadProducts(reset);
  }

  return (
    <div style={{ padding: '1rem 2rem' }}>
      {/* Filtros */}
      <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
        <input
          className="retro-input" placeholder="Buscar archivo..."
          value={filters.search}
          onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
          style={{ minWidth: 160 }}
        />
        <select
          className="retro-input"
          value={filters.category}
          onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          className="retro-input"
          value={filters.sort}
          onChange={e => setFilters(p => ({ ...p, sort: e.target.value }))}
        >
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
          <option value="price_asc">Precio ↑</option>
          <option value="price_desc">Precio ↓</option>
        </select>
        <input
          className="retro-input" placeholder="Precio min" type="number"
          value={filters.min_price}
          onChange={e => setFilters(p => ({ ...p, min_price: e.target.value }))}
          style={{ width: 100 }}
        />
        <input
          className="retro-input" placeholder="Precio max" type="number"
          value={filters.max_price}
          onChange={e => setFilters(p => ({ ...p, max_price: e.target.value }))}
          style={{ width: 100 }}
        />
        <button className="retro-button" onClick={applyFilters}>FILTRAR</button>
        <button className="retro-button" onClick={clearFilters} style={{ background: '#f0f0f0' }}>LIMPIAR</button>
      </div>

      {/* Grid */}
      {loading ? (
        <p style={{ fontFamily: 'var(--font-accent)', opacity: 0.6 }}>[ CARGANDO ARCHIVO... ]</p>
      ) : products.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-accent)', opacity: 0.6 }}>[ SIN RESULTADOS EN EL ARCHIVO ]</p>
      ) : (
        <div className="products-grid">
          {products.map(p => {
            const imgUrl = p.product_images?.[0]?.url || 'https://via.placeholder.com/300x200?text=SIN+IMAGEN';
            const fav = isFavorite(p.id);
            const inCart = cartItems.includes(p.id);

            return (
              <article key={p.id} className="product-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                <a href={`/productos/${p.id}`} style={{ display: 'block', position: 'relative', borderBottom: '2px solid #000', textDecoration: 'none', color: 'inherit' }}>
                  <img src={imgUrl} alt={p.name} style={{ display: 'block', width: '100%', objectFit: 'cover', aspectRatio: '4/3' }} />
                  <div className={`product-card-status status-${p.status}`} style={{ position: 'absolute', top: 10, left: 10, margin: 0, fontSize: '0.7rem' }}>
                    {formatStatus(p.status)}
                  </div>
                </a>
                <div className="product-card-body" style={{ padding: 15, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h2 className="product-card-title" style={{ marginBottom: 5, fontSize: '1rem' }}>{p.name}</h2>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <p className="product-card-price" style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--clr-accent)', margin: 0 }}>
                      {Number(p.price).toFixed(2)} €
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'stretch', flexWrap: 'wrap' }}>
                    <a href={`/productos/${p.id}`} className="retro-button" style={{ flex: 1, fontSize: '0.8rem', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 80 }}>
                      VER DETALLES
                    </a>
                    {!isAdmin && p.status !== 'sold' && (
                      <button
                        className="retro-button"
                        style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', padding: 0, background: inCart ? '#90ee90' : '#ffffcc' }}
                        onClick={() => handleCart(p)}
                      >
                        {inCart ? '🛒' : '＋'}
                      </button>
                    )}
                    {!isAdmin && (
                      <button
                        className="retro-button"
                        style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', padding: 0, color: fav ? '#d63031' : 'inherit' }}
                        onClick={() => handleFavorite(p.id)}
                      >
                        {fav ? '♥' : '♡'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

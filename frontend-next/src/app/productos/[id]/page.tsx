'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, addToCart, isInCart } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { showNotification } from '@/components/Notification';
import type { Product } from '@/types';

function renderStars(rating: number) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return [0, 1, 2, 3, 4].map(i => {
    if (i < full) return <span key={i} className="star star-full">★</span>;
    if (i === full && half) return <span key={i} className="star star-half">★</span>;
    return <span key={i} className="star star-empty">☆</span>;
  });
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible', reserved: 'Reservado', sold: 'Vendido',
};

export default function ProductoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { auth, isAdmin } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [inCart, setInCart] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Product>(`/products/${id}`)
      .then(p => { setProduct(p); setInCart(isInCart(p.id)); })
      .catch(() => showNotification('Producto no encontrado', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCart() {
    if (!auth?.userId) { router.push('/login'); return; }
    if (inCart) { router.push('/carrito'); return; }
    if (!product) return;
    const added = addToCart(product);
    if (added) { setInCart(true); showNotification('Añadido a la bolsa', 'success'); }
  }

  async function handleChat() {
    if (!auth?.userId) { router.push('/login'); return; }
    router.push(`/chat?productId=${id}`);
  }

  if (loading) return <div style={{ padding: '2rem', fontFamily: 'var(--font-accent)' }}>[ CARGANDO REGISTRO... ]</div>;
  if (!product) return <div style={{ padding: '2rem', fontFamily: 'var(--font-accent)' }}>[ REGISTRO NO ENCONTRADO ]</div>;

  const images = product.product_images?.length
    ? product.product_images
    : [{ id: 'ph', url: 'https://via.placeholder.com/600x400?text=SIN+IMAGEN', order: 0 }];

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <Link href="/" className="retro-button" style={{ display: 'inline-block', marginBottom: '1.5rem', textDecoration: 'none', fontSize: '0.8rem' }}>
        ← VOLVER AL CATÁLOGO
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Galería */}
        <div>
          <div style={{ border: '3px outset #fff', background: '#c0c0c0' }}>
            <img src={images[activeImg]?.url} alt={product.name} style={{ width: '100%', display: 'block', objectFit: 'cover', aspectRatio: '4/3' }} />
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <img
                  key={img.id} src={img.url} alt={`Vista ${i + 1}`}
                  style={{ width: 60, height: 60, objectFit: 'cover', cursor: 'pointer', border: activeImg === i ? '3px solid var(--clr-primary)' : '2px solid #999' }}
                  onClick={() => setActiveImg(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="retro-window">
            <div className="retro-titlebar">
              <span>📦 FICHA_PRODUCTO.EXE</span>
              <span className={`product-card-status status-${product.status}`} style={{ fontSize: '0.75rem', margin: 0 }}>
                {STATUS_LABELS[product.status]}
              </span>
            </div>
            <div className="retro-window-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <h1 style={{ fontFamily: 'var(--font-accent)', fontSize: '1.3rem', margin: 0 }}>{product.name.toUpperCase()}</h1>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--clr-accent)', margin: 0 }}>
                {Number(product.price).toFixed(2)} €
              </p>
              {product.description && <p style={{ opacity: 0.8 }}>{product.description}</p>}
              <div style={{ fontFamily: 'var(--font-accent)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {product.brand && <span>MARCA: {product.brand}</span>}
                {product.year && <span>AÑO: {product.year}</span>}
                {product.dimensions && <span>DIMENSIONES: {product.dimensions}</span>}
                {product.categories && <span>CATEGORÍA: {product.categories.name}</span>}
              </div>

              {/* Vendedor */}
              <div className="seller-card" style={{ marginTop: '0.5rem' }}>
                <div className="seller-avatar">A</div>
                <div>
                  <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-accent)', fontSize: '0.85rem' }}>EL BAZAR DEL COLECCIONISTA</div>
                  <div className="star-rating">{renderStars(4.8)}<span style={{ marginLeft: 4, fontSize: '0.75rem' }}>4.8</span></div>
                </div>
              </div>

              {/* Botones */}
              {!isAdmin && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {product.status !== 'sold' && (
                    <button
                      className="retro-button"
                      style={{ flex: 1, background: inCart ? '#90ee90' : '#ffffcc' }}
                      onClick={handleCart}
                    >
                      {inCart ? '🛒 EN LA BOLSA' : '＋ AÑADIR A LA BOLSA'}
                    </button>
                  )}
                  <button className="retro-button" style={{ flex: 1 }} onClick={handleChat}>
                    💬 CONSULTAR
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

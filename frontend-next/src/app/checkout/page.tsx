'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { showNotification } from '@/components/Notification';
import type { Product, ShippingMethod } from '@/types';

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { auth, isLoading } = useAuth();
  const productId = params.get('id') || '';
  const [product, setProduct] = useState<Product | null>(null);
  const [shipping, setShipping] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!auth?.userId) { router.push('/login'); return; }
    if (!productId) { router.push('/carrito'); return; }

    Promise.all([
      apiFetch<Product>(`/products/${productId}`),
      apiFetch<ShippingMethod[]>('/shipping'),
    ]).then(([p, s]) => {
      setProduct(p);
      setShipping(s);
      if (s.length > 0) setSelectedShipping(s[0]);
    }).catch(() => showNotification('Error al cargar datos de checkout', 'error'));
  }, [auth, isLoading, productId]);

  async function handlePay() {
    if (!product || !selectedShipping || !auth?.userId) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ url: string }>('/pagos/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          name: product.name,
          price: product.price + selectedShipping.price,
          product_id: product.id,
          user_id: auth.userId,
          shipping_method: selectedShipping.name,
        }),
      });
      window.location.href = res.url;
    } catch (err: any) {
      showNotification(err.message, 'error');
      setLoading(false);
    }
  }

  if (!product) return <div style={{ padding: '2rem', fontFamily: 'var(--font-accent)' }}>[ CARGANDO CHECKOUT... ]</div>;

  const total = product.price + (selectedShipping?.price || 0);

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 700, margin: '0 auto' }}>
      <div className="retro-window">
        <div className="retro-titlebar"><span>💳 PROCESAR_PAGO.EXE</span></div>
        <div className="retro-window-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Producto */}
          <div style={{ borderBottom: '2px dashed #ccc', paddingBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-accent)', margin: '0 0 8px' }}>ARTÍCULO SELECCIONADO</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {product.product_images?.[0] && (
                <img src={product.product_images[0].url} alt={product.name} style={{ width: 80, height: 80, objectFit: 'cover', border: '2px solid #000' }} />
              )}
              <div>
                <p style={{ fontFamily: 'var(--font-accent)', fontWeight: 'bold', margin: 0 }}>{product.name.toUpperCase()}</p>
                <p style={{ color: 'var(--clr-accent)', fontWeight: 'bold', fontSize: '1.2rem', margin: '4px 0 0' }}>{Number(product.price).toFixed(2)} €</p>
              </div>
            </div>
          </div>

          {/* Envío */}
          <div style={{ borderBottom: '2px dashed #ccc', paddingBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-accent)', margin: '0 0 12px' }}>MÉTODO DE ENVÍO</h3>
            {shipping.map(s => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer', fontFamily: 'var(--font-accent)', fontSize: '0.85rem' }}>
                <input type="radio" name="shipping" checked={selectedShipping?.id === s.id} onChange={() => setSelectedShipping(s)} />
                <span style={{ flex: 1 }}>{s.name} {s.description ? `— ${s.description}` : ''}</span>
                <strong style={{ color: 'var(--clr-accent)' }}>+{Number(s.price).toFixed(2)} €</strong>
              </label>
            ))}
          </div>

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-accent)' }}>
            <span style={{ fontSize: '1.1rem' }}>TOTAL A PAGAR:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--clr-accent)' }}>{total.toFixed(2)} €</span>
          </div>

          <button className="retro-button" style={{ fontSize: '1rem', padding: '0.8rem', background: '#90ee90' }} onClick={handlePay} disabled={loading}>
            {loading ? 'PROCESANDO...' : '💳 PAGAR CON STRIPE'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense><CheckoutContent /></Suspense>;
}

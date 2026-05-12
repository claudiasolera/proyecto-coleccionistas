'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCart, saveCart } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { showNotification } from '@/components/Notification';
import type { CartItem } from '@/types';

export default function CarritoPage() {
  const router = useRouter();
  const { auth } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(getCart());
  }, []);

  function removeItem(id: string) {
    const updated = cart.filter(i => i.id !== id);
    saveCart(updated);
    setCart(updated);
    showNotification('Artículo retirado de la bolsa', 'success');
  }

  function clearCart() {
    saveCart([]);
    setCart([]);
    showNotification('Bolsa vaciada', 'success');
  }

  function handleCheckout(item: CartItem) {
    if (!auth?.userId) { router.push('/login'); return; }
    router.push(`/checkout?id=${item.id}`);
  }

  const total = cart.reduce((sum, i) => sum + i.price, 0);

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <div className="retro-window" style={{ marginBottom: '1.5rem' }}>
        <div className="retro-titlebar"><span>🛍️ BOLSA_DE_COMPRAS.EXE</span></div>
      </div>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-accent)', opacity: 0.6 }}>
          <p>[ BOLSA VACÍA - SIN ARTÍCULOS SELECCIONADOS ]</p>
          <Link href="/" className="retro-button" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
            IR AL CATÁLOGO
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items */}
          <div>
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                {item.image && (
                  <img src={item.image} alt={item.name} style={{ width: 80, height: 80, objectFit: 'cover', border: '2px solid #000', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-accent)', fontWeight: 'bold', margin: '0 0 4px' }}>{item.name.toUpperCase()}</p>
                  <p style={{ color: 'var(--clr-accent)', fontWeight: 'bold', margin: 0 }}>{Number(item.price).toFixed(2)} €</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button className="retro-button" style={{ fontSize: '0.75rem' }} onClick={() => handleCheckout(item)}>
                    COMPRAR
                  </button>
                  <button className="retro-button" style={{ fontSize: '0.75rem', background: '#ffcccc' }} onClick={() => removeItem(item.id)}>
                    QUITAR
                  </button>
                </div>
              </div>
            ))}
            <button className="retro-button" style={{ marginTop: '1rem', background: '#f0f0f0' }} onClick={clearCart}>
              VACIAR BOLSA
            </button>
          </div>

          {/* Resumen */}
          <div className="retro-window" style={{ alignSelf: 'start' }}>
            <div className="retro-titlebar"><span>RESUMEN</span></div>
            <div className="retro-window-body" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-accent)', fontSize: '0.85rem' }}>
                <span>ARTÍCULOS:</span><span>{cart.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', borderTop: '2px solid #000', paddingTop: 8 }}>
                <span>TOTAL:</span><span style={{ color: 'var(--clr-accent)' }}>{total.toFixed(2)} €</span>
              </div>
              <p style={{ fontFamily: 'var(--font-accent)', fontSize: '0.7rem', opacity: 0.7, margin: 0 }}>
                * Cada artículo se compra por separado
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, getCart } from '@/lib/api';

export default function Header() {
  const { auth, logout, isAdmin } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setCartCount(getCart().length);
    const onCartUpdate = () => setCartCount(getCart().length);
    window.addEventListener('cartUpdated', onCartUpdate);
    return () => window.removeEventListener('cartUpdated', onCartUpdate);
  }, []);

  useEffect(() => {
    if (!auth?.userId) return;
    if (isAdmin) {
      apiFetch<{ totalUnread: number }>('/messages/admin/unread-total')
        .then(d => setUnreadCount(d?.totalUnread || 0))
        .catch(() => {});
    } else {
      apiFetch<{ unreadCount: number }>(`/messages/unread/${auth.userId}`)
        .then(d => setUnreadCount(d?.unreadCount || 0))
        .catch(() => {});
    }
  }, [auth, isAdmin]);

  return (
    <header className="site-header">
      <h1 className="site-title">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          Tienda de Coleccionistas
        </Link>
      </h1>
      <nav className="site-nav">
        <Link href="/">Catálogo</Link>
        {auth ? (
          <>
            {!isAdmin && (
              <>
                <Link href="/favoritos">Favoritos</Link>
                <Link href="/carrito" style={{ position: 'relative' }}>
                  Bolsa {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>
              </>
            )}
            <Link href="/chat" style={{ position: 'relative' }}>
              Chat {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </Link>
            {isAdmin && <Link href="/admin">Admin</Link>}
            <Link href="/perfil">{auth.userName || 'Mi Perfil'}</Link>
            <button
              onClick={logout}
              className="retro-button"
              style={{ fontSize: '0.75rem', padding: '2px 10px' }}
            >
              Salir
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Entrar</Link>
            <Link href="/register">Registro</Link>
          </>
        )}
      </nav>
    </header>
  );
}

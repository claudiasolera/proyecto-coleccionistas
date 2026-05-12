'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { auth, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!auth?.userId || !isAdmin) router.push('/');
  }, [auth, isAdmin, isLoading]);

  const links = [
    { href: '/admin', label: '📊 INVENTARIO' },
    { href: '/admin/pedidos', label: '📦 PEDIDOS' },
    { href: '/admin/chat', label: '💬 MENSAJES' },
    { href: '/admin/nuevo-producto', label: '➕ NUEVO PRODUCTO' },
  ];

  return (
    <div>
      <div style={{ background: '#000080', color: '#fff', padding: '0.5rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center', fontFamily: 'var(--font-accent)', fontSize: '0.85rem' }}>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              color: pathname === l.href ? '#ffff00' : '#fff',
              textDecoration: 'none',
              padding: '2px 8px',
              border: pathname === l.href ? '1px solid #ffff00' : '1px solid transparent',
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}

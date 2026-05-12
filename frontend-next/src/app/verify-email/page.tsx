'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    apiFetch(`/users/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 1rem', minHeight: '60vh' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div className="retro-window">
          <div className="retro-titlebar"><span>✉️ VERIFICAR_EMAIL.EXE</span></div>
          <div className="retro-window-body" style={{ padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-accent)' }}>
            {status === 'loading' && <p>[ VERIFICANDO TOKEN... ]</p>}
            {status === 'success' && (
              <>
                <p style={{ color: 'green', fontWeight: 'bold' }}>[ EMAIL VERIFICADO CON ÉXITO ]</p>
                <p style={{ marginTop: '1rem' }}>
                  <Link href="/login" className="retro-button" style={{ textDecoration: 'none' }}>
                    [OK] ENTRAR AL SISTEMA
                  </Link>
                </p>
              </>
            )}
            {status === 'error' && (
              <>
                <p style={{ color: 'red', fontWeight: 'bold' }}>[ ERROR: TOKEN INVÁLIDO O EXPIRADO ]</p>
                <p style={{ marginTop: '1rem' }}>
                  <Link href="/register">Volver al registro</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailContent /></Suspense>;
}

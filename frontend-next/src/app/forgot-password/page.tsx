'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { showNotification } from '@/components/Notification';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/users/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
      showNotification('Enlace enviado a tu email', 'success');
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 1rem', minHeight: '60vh' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div className="retro-window">
          <div className="retro-titlebar"><span>🔑 RECUPERAR_CONTRASEÑA.EXE</span></div>
          <div className="retro-window-body" style={{ padding: '1.5rem' }}>
            {sent ? (
              <p style={{ fontFamily: 'var(--font-accent)', textAlign: 'center' }}>
                [ ENLACE ENVIADO ] Revisa tu bandeja de entrada.
                <br /><br />
                <Link href="/login">Volver al login</Link>
              </p>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label className="retro-label">EMAIL DE RECUPERACIÓN:</label>
                <input
                  type="email" className="retro-input" required
                  value={email} onChange={e => setEmail(e.target.value)}
                />
                <button type="submit" className="retro-button" disabled={loading}>
                  {loading ? 'ENVIANDO...' : '[>>>] ENVIAR ENLACE'}
                </button>
                <p style={{ textAlign: 'center', fontFamily: 'var(--font-accent)', fontSize: '0.75rem' }}>
                  <Link href="/login">Volver al login</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

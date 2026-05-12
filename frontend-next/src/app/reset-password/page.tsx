'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { showNotification } from '@/components/Notification';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      showNotification('Las contraseñas no coinciden', 'error');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/users/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: form.password }),
      });
      showNotification('Contraseña actualizada', 'success');
      router.push('/login');
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
          <div className="retro-titlebar"><span>🔒 NUEVA_CONTRASEÑA.EXE</span></div>
          <div className="retro-window-body" style={{ padding: '1.5rem' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="retro-label">NUEVA CONTRASEÑA:</label>
                <input type="password" className="retro-input" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div>
                <label className="retro-label">CONFIRMAR CONTRASEÑA:</label>
                <input type="password" className="retro-input" required value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
              </div>
              <button type="submit" className="retro-button" disabled={loading}>
                {loading ? 'GUARDANDO...' : '[OK] ESTABLECER CONTRASEÑA'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>;
}

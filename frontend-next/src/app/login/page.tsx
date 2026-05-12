'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { showNotification } from '@/components/Notification';
import type { User } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await apiFetch<User>('/users/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const storage = form.remember ? localStorage : sessionStorage;
      storage.setItem('userId', user.id);
      storage.setItem('userRole', user.role);
      storage.setItem('userName', user.name);
      setAuth({ userId: user.id, userRole: user.role, userName: user.name });
      showNotification('Acceso concedido', 'success');
      router.push('/');
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
          <div className="retro-titlebar">
            <span>🔐 ACCESO_SEGURO.EXE</span>
          </div>
          <div className="retro-window-body" style={{ padding: '1.5rem' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="retro-label">EMAIL:</label>
                <input
                  type="email" className="retro-input" required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="retro-label">CONTRASEÑA:</label>
                <input
                  type="password" className="retro-input" required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox" id="remember"
                  checked={form.remember}
                  onChange={e => setForm(p => ({ ...p, remember: e.target.checked }))}
                />
                <label htmlFor="remember" style={{ fontFamily: 'var(--font-accent)', fontSize: '0.8rem' }}>
                  Recordar sesión
                </label>
              </div>
              <button type="submit" className="retro-button" disabled={loading}>
                {loading ? 'CONECTANDO...' : '[OK] ENTRAR AL SISTEMA'}
              </button>
            </form>
            <div style={{ marginTop: '1rem', textAlign: 'center', fontFamily: 'var(--font-accent)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Link href="/forgot-password">¿Olvidaste tu contraseña?</Link>
              <Link href="/register">¿No tienes cuenta? Regístrate</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, validators } from '@/lib/api';
import { showNotification } from '@/components/Notification';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', last_name: '', email: '', dni: '',
    address: '', phone: '', password: '', confirm: '',
  });
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      showNotification('Las contraseñas no coinciden', 'error');
      return;
    }
    if (!validators.email(form.email)) { showNotification('Email inválido', 'error'); return; }
    if (!validators.dni(form.dni)) { showNotification('DNI inválido', 'error'); return; }
    if (!validators.phone(form.phone)) { showNotification('Teléfono inválido (9 dígitos)', 'error'); return; }

    setLoading(true);
    try {
      await apiFetch('/users/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name, last_name: form.last_name, email: form.email,
          dni: form.dni, address: form.address, phone: form.phone, password: form.password,
        }),
      });
      showNotification('Registro completado. Verifica tu email.', 'success');
      router.push('/login');
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        <div className="retro-window">
          <div className="retro-titlebar"><span>📋 NUEVO_EXPEDIENTE.EXE</span></div>
          <div className="retro-window-body" style={{ padding: '1.5rem' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {[
                { field: 'name', label: 'NOMBRE:', type: 'text' },
                { field: 'last_name', label: 'APELLIDOS:', type: 'text' },
                { field: 'email', label: 'EMAIL:', type: 'email' },
                { field: 'dni', label: 'DNI:', type: 'text' },
                { field: 'address', label: 'DIRECCIÓN:', type: 'text' },
                { field: 'phone', label: 'TELÉFONO:', type: 'tel' },
                { field: 'password', label: 'CONTRASEÑA:', type: 'password' },
                { field: 'confirm', label: 'CONFIRMAR CONTRASEÑA:', type: 'password' },
              ].map(({ field, label, type }) => (
                <div key={field}>
                  <label className="retro-label">{label}</label>
                  <input
                    type={type} className="retro-input" required
                    value={form[field as keyof typeof form]}
                    onChange={e => set(field, e.target.value)}
                  />
                </div>
              ))}
              <button type="submit" className="retro-button" disabled={loading} style={{ marginTop: '0.5rem' }}>
                {loading ? 'REGISTRANDO...' : '[OK] CREAR EXPEDIENTE'}
              </button>
            </form>
            <p style={{ marginTop: '1rem', textAlign: 'center', fontFamily: 'var(--font-accent)', fontSize: '0.75rem' }}>
              <Link href="/login">¿Ya tienes cuenta? Entra aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

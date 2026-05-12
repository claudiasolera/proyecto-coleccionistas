'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { showNotification } from '@/components/Notification';
import type { Category } from '@/types';

function NuevoProductoContent() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('edit');
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: '', description: '', price: '', category_id: '',
    brand: '', year: '', dimensions: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<Category[]>('/categories').then(setCategories).catch(() => {});
    if (editId) {
      apiFetch(`/products/${editId}`).then((p: any) => {
        setForm({
          name: p.name || '', description: p.description || '', price: String(p.price || ''),
          category_id: p.category_id || '', brand: p.brand || '',
          year: String(p.year || ''), dimensions: p.dimensions || '',
        });
      }).catch(() => {});
    }
  }, [editId]);

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price || !form.category_id) {
      showNotification('Nombre, precio y categoría son obligatorios', 'error');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(f => fd.append('images', f));

      if (editId) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/${editId}`, {
          method: 'PUT', body: fd,
        });
        showNotification('Producto actualizado', 'success');
      } else {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin`, {
          method: 'POST', body: fd,
        });
        showNotification('Producto creado', 'success');
      }
      router.push('/admin');
    } catch (err: any) {
      showNotification(err.message || 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 700, margin: '0 auto' }}>
      <div className="retro-window">
        <div className="retro-titlebar">
          <span>{editId ? '✏️ EDITAR_PRODUCTO.EXE' : '➕ NUEVO_PRODUCTO.EXE'}</span>
        </div>
        <div className="retro-window-body" style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="retro-label">NOMBRE DEL ARTÍCULO:*</label>
              <input className="retro-input" required value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="retro-label">DESCRIPCIÓN:</label>
              <textarea className="retro-input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label className="retro-label">PRECIO (€):*</label>
              <input className="retro-input" type="number" step="0.01" required value={form.price} onChange={e => set('price', e.target.value)} />
            </div>
            <div>
              <label className="retro-label">CATEGORÍA:*</label>
              <select className="retro-input" required value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                <option value="">Seleccionar...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="retro-label">MARCA:</label>
              <input className="retro-input" value={form.brand} onChange={e => set('brand', e.target.value)} />
            </div>
            <div>
              <label className="retro-label">AÑO:</label>
              <input className="retro-input" type="number" value={form.year} onChange={e => set('year', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="retro-label">DIMENSIONES:</label>
              <input className="retro-input" placeholder="ej: 30cm x 20cm x 10cm" value={form.dimensions} onChange={e => set('dimensions', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="retro-label">IMÁGENES {editId ? '(dejar vacío para no cambiar)' : ''}:</label>
              <input type="file" multiple accept="image/*" onChange={e => setImages(Array.from(e.target.files || []))} style={{ fontFamily: 'var(--font-accent)', fontSize: '0.8rem' }} />
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
              <button type="submit" className="retro-button" disabled={loading} style={{ background: '#90ee90', flex: 1 }}>
                {loading ? 'GUARDANDO...' : (editId ? '[OK] ACTUALIZAR ARTÍCULO' : '[OK] CREAR ARTÍCULO')}
              </button>
              <button type="button" className="retro-button" style={{ background: '#f0f0f0' }} onClick={() => router.push('/admin')}>
                CANCELAR
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NuevoProductoPage() {
  return <Suspense><NuevoProductoContent /></Suspense>;
}

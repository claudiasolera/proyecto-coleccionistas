'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { showNotification } from '@/components/Notification';
import type { Message, Product } from '@/types';

function ChatContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { auth, isLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeThread, setActiveThread] = useState<string>('all');
  const [text, setText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!auth?.userId) { router.push('/login'); return; }

    apiFetch(`/messages/read-user/${auth.userId}`, { method: 'PUT' }).catch(() => {});
    loadHistory();

    const productId = params.get('productId');
    if (productId) {
      setTimeout(() => autoAttach(productId), 800);
    }

    const channel = supabase.channel('chat-user').on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages',
    }, payload => {
      const msg = payload.new as any;
      if (msg.sender_id === auth.userId || msg.receiver_id === auth.userId) {
        loadHistory();
        if (msg.receiver_id === auth.userId) {
          apiFetch(`/messages/read-user/${auth.userId}`, { method: 'PUT' }).catch(() => {});
        }
      }
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [auth, isLoading]);

  useEffect(() => {
    if (chatWindowRef.current) chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
  }, [messages, activeThread]);

  async function loadHistory() {
    if (!auth?.userId) return;
    try {
      const data = await apiFetch<Message[]>(`/messages/history/${auth.userId}`);
      setMessages(data || []);
    } catch {}
  }

  async function autoAttach(productId: string) {
    try {
      const p = await apiFetch<Product>(`/products/${productId}`);
      if (p && !('error' in p)) {
        await apiFetch('/messages', {
          method: 'POST',
          body: JSON.stringify({ sender_id: auth!.userId, receiver_id: 'admin', text: 'CONSULTA DE ARTÍCULO', product_id: p.id }),
        });
        await loadHistory();
        window.history.replaceState({}, '', '/chat');
        showNotification('Consulta enviada', 'success');
        setActiveThread(productId);
      }
    } catch {}
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !auth?.userId) return;
    const productId = activeThread !== 'all' ? activeThread : undefined;
    try {
      await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          sender_id: auth.userId, receiver_id: 'admin', text,
          ...(productId && { product_id: productId }),
        }),
      });
      setText('');
      await loadHistory();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  }

  async function openProductModal() {
    setShowModal(true);
    try {
      const data = await apiFetch<Product[]>('/products');
      setProducts(data.filter(p => p.status !== 'sold'));
    } catch {}
  }

  async function sendProduct(productId: string) {
    setShowModal(false);
    try {
      await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({ sender_id: auth!.userId, receiver_id: 'admin', text: '', product_id: productId }),
      });
      await loadHistory();
      setActiveThread(productId);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  }

  // Build thread list
  const productMap: Record<string, Product> = {};
  messages.forEach(m => { if (m.product_id && m.products) productMap[m.product_id] = m.products as unknown as Product; });

  const filtered = activeThread === 'all' ? messages : messages.filter(m => m.product_id === activeThread);
  const userName = auth?.userName || 'Tú';

  const activeProduct = activeThread !== 'all' ? productMap[activeThread] : null;
  const titleText = activeThread === 'all' ? 'COM_TERMINAL.EXE - [SESIÓN_ACTIVA]'
    : activeProduct ? `EXPEDIENTE: ${activeProduct.name.toUpperCase()}` : 'COM_TERMINAL.EXE';

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 0, display: 'block' }}>
      <div className="chat-user-layout">
        {/* Thread list */}
        <aside className="chat-thread-list">
          <div className="chat-thread-list-header">📁 CONVERSACIONES</div>
          <div
            className={`thread-item ${activeThread === 'all' ? 'active' : ''}`}
            onClick={() => setActiveThread('all')}
          >
            <div className="thread-item-title">📋 GENERAL</div>
            <div className="thread-item-meta">{messages.length} mensajes</div>
          </div>
          {Object.entries(productMap).map(([pid, p]) => {
            const count = messages.filter(m => m.product_id === pid).length;
            const shortName = p.name.length > 20 ? p.name.substring(0, 20) + '…' : p.name;
            return (
              <div key={pid} className={`thread-item ${activeThread === pid ? 'active' : ''}`} onClick={() => setActiveThread(pid)}>
                <div className="thread-item-title">📦 {shortName}</div>
                <div className="thread-item-meta">{count} mensaje{count !== 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </aside>

        {/* Chat area */}
        <div className="chat-area">
          <div className="chat-titlebar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
              <span style={{ fontSize: '1.1rem', filter: 'sepia(1)' }}>📟</span>
              <span id="chat-thread-title">{titleText}</span>
            </div>
          </div>

          <div className="chat-window" ref={chatWindowRef} style={{ flex: 1, height: 'auto', minHeight: 0 }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '4rem', fontFamily: 'var(--font-accent)' }}>
                [ SIN MENSAJES EN ESTE EXPEDIENTE ]
              </p>
            ) : filtered.map(m => {
              const isMe = !m.is_from_admin && m.sender_id === auth?.userId;
              const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={m.id} className={`message-bubble ${isMe ? 'message-me' : 'message-vendedor'}`}>
                  <span className="message-header">&lt;{isMe ? userName : 'ADMIN'}&gt;</span>
                  <div className="message-text">
                    {m.text}
                    {m.products && (
                      <div className="chat-product-card" onClick={() => router.push(`/productos/${m.products!.id}`)}>
                        <div className="chat-product-card-title" style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: 4, marginBottom: 6 }}>
                          ARCHIVO: {(m.products as any).name?.toUpperCase()}
                        </div>
                        <span style={{ color: 'var(--clr-accent)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {Number((m.products as any).price).toFixed(2)} €
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="message-footer" style={{ textAlign: 'right', fontSize: '0.65rem', opacity: 0.5, marginTop: 4 }}>{time}</div>
                </div>
              );
            })}
          </div>

          <form className="chat-form" onSubmit={sendMessage}>
            <input
              type="text" className="retro-input" placeholder="Escribe tu mensaje oficial..." required
              value={text} onChange={e => setText(e.target.value)}
            />
            <button type="button" className="retro-button btn-attach" title="Adjuntar Tesoro" style={{ fontSize: '1.2rem' }} onClick={openProductModal}>📎</button>
            <button type="submit" className="retro-button" style={{ padding: '0 25px' }}>ENVIAR</button>
          </form>
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="product-modal" style={{ display: 'flex' }}>
          <div className="modal-body">
            <div className="modal-header">
              <span>SELECCIONAR REGISTRO</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)}>[X]</span>
            </div>
            <input
              type="text" className="retro-input" placeholder="BUSCAR ARCHIVO..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', marginBottom: '1rem', fontSize: '0.8rem' }}
            />
            <div>
              {filteredProducts.map(p => (
                <div key={p.id} className="product-select-item" onClick={() => sendProduct(p.id)}>
                  <span style={{ fontFamily: 'var(--font-accent)' }}>
                    {p.status === 'reserved' ? '[RESERVADO] ' : ''}ARCHIVO: {p.name.toUpperCase()}
                  </span>
                  <strong style={{ color: 'var(--clr-accent)', whiteSpace: 'nowrap' }}>{Number(p.price).toFixed(2)} €</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return <Suspense><ChatContent /></Suspense>;
}

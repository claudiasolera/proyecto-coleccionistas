'use client';

import React, { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { showNotification } from '@/components/Notification';
import type { Message, Product } from '@/types';

interface Conversation {
  id: string;
  name: string;
  email: string;
  unreadCount: number;
}

export default function AdminChatPage() {
  const { auth } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUser, setActiveUser] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    const channel = supabase.channel('admin-chat').on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages',
    }, () => {
      loadConversations();
      if (activeUser) loadHistory(activeUser.id);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (chatWindowRef.current) chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
  }, [messages]);

  async function loadConversations() {
    try {
      const data = await apiFetch<Conversation[]>('/messages/admin/conversations');
      setConversations(data || []);
    } catch {}
  }

  async function selectUser(conv: Conversation) {
    setActiveUser(conv);
    await apiFetch(`/messages/read/${conv.id}`, { method: 'PUT' }).catch(() => {});
    loadConversations();
    loadHistory(conv.id);
  }

  async function loadHistory(userId: string) {
    try {
      const data = await apiFetch<Message[]>(`/messages/history/${userId}`);
      setMessages(data || []);
    } catch {}
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !activeUser || !auth?.userId) return;
    try {
      await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({ sender_id: auth.userId, receiver_id: activeUser.id, text }),
      });
      setText('');
      loadHistory(activeUser.id);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  }

  async function reserveProduct(pId: string, pName: string) {
    if (!activeUser || !auth?.userId) return;
    try {
      await apiFetch(`/admin/${pId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'reserved', reserved_for: activeUser.id }) });
      await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          sender_id: auth.userId, receiver_id: activeUser.id,
          text: `📋 [COMUNICADO DEL SISTEMA]: Se ha reservado el registro "${pName}" para usted. Dispone de 48 horas para completar la compra.`,
        }),
      });
      showNotification('Reserva y comunicado ejecutados', 'success');
      loadHistory(activeUser.id);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  }

  async function sendProduct(pId: string) {
    setShowModal(false);
    if (!activeUser || !auth?.userId) return;
    try {
      await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({ sender_id: auth.userId, receiver_id: activeUser.id, text: '', product_id: pId }),
      });
      loadHistory(activeUser.id);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 0, display: 'block' }}>
      <div className="admin-chat-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: '75vh', margin: '1rem 2rem', gap: 0 }}>
        {/* User list */}
        <div style={{ background: '#fff', border: '3px outset #fff', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#c0c0c0', padding: '6px 10px', fontFamily: 'var(--font-accent)', fontSize: '0.8rem', borderBottom: '2px solid #999', fontWeight: 'bold' }}>
            📁 EXPEDIENTES ACTIVOS
          </div>
          {conversations.map(c => (
            <div
              key={c.id}
              className={`user-item ${activeUser?.id === c.id ? 'active' : ''}`}
              style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px dashed #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activeUser?.id === c.id ? 'var(--clr-primary)' : undefined, color: activeUser?.id === c.id ? '#fff' : undefined }}
              onClick={() => selectUser(c)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📁</span>
                <strong style={{ fontFamily: 'var(--font-accent)', fontSize: '0.85rem' }}>{c.name.toUpperCase()}</strong>
              </div>
              {c.unreadCount > 0 && (
                <span style={{ background: 'red', color: 'white', borderRadius: '50%', padding: '1px 6px', fontSize: '0.7rem', border: '2px solid #000' }}>
                  {c.unreadCount}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Chat area */}
        <div className="chat-area">
          <div className="chat-titlebar">
            <span style={{ fontSize: '0.85rem' }}>
              {activeUser ? `EXPEDIENTE: ${activeUser.name.toUpperCase()}` : 'COM_TERMINAL.EXE — PANEL ADMIN'}
            </span>
          </div>
          <div className="chat-window" ref={chatWindowRef} style={{ flex: 1, height: 'auto', minHeight: 0 }}>
            {!activeUser ? (
              <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '5rem', fontFamily: 'var(--font-accent)' }}>
                [ COMUNICACIÓN NO INICIADA ]<br />Selecciona un expediente de la izquierda
              </p>
            ) : messages.map(m => {
              const isMe = m.is_from_admin;
              const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={m.id} className={`message-bubble ${isMe ? 'message-me' : 'message-vendedor'}`}>
                  <span className="message-header">&lt;{isMe ? 'ADMIN' : activeUser.name}&gt;</span>
                  <div className="message-text">
                    {m.text}
                    {m.products && (
                      <div className="chat-product-card">
                        <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: 4, marginBottom: 6 }}>
                          ARCHIVO: {(m.products as any).name?.toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                          <span style={{ color: 'var(--clr-accent)', fontWeight: 'bold' }}>{Number((m.products as any).price).toFixed(2)} €</span>
                          {(m.products as any).status !== 'reserved' && (m.products as any).status !== 'sold' && (
                            <button className="retro-button" style={{ fontSize: '0.65rem', padding: '2px 6px' }} onClick={() => reserveProduct((m.products as any).id, (m.products as any).name)}>
                              RESERVAR
                            </button>
                          )}
                          {(m.products as any).status === 'reserved' && (
                            <span style={{ fontSize: '0.65rem', color: '#000080', border: '1px solid #000080', padding: '1px 4px' }}>YA RESERVADO</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="message-footer" style={{ textAlign: 'right', fontSize: '0.65rem', opacity: 0.5, marginTop: 4 }}>{time}</div>
                </div>
              );
            })}
          </div>
          <form className="chat-form" onSubmit={sendMessage}>
            <input type="text" className="retro-input" placeholder="Respuesta oficial..." value={text} onChange={e => setText(e.target.value)} disabled={!activeUser} />
            <button
              type="button" className="retro-button" style={{ fontSize: '1.2rem' }}
              disabled={!activeUser}
              onClick={async () => {
                if (!activeUser) return;
                setShowModal(true);
                const data = await apiFetch<Product[]>('/products');
                setProducts(data.filter(p => p.status !== 'sold'));
              }}
            >📎</button>
            <button type="submit" className="retro-button" style={{ padding: '0 25px' }} disabled={!activeUser}>ENVIAR</button>
          </form>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="product-modal" style={{ display: 'flex' }}>
          <div className="modal-body">
            <div className="modal-header">
              <span>SELECCIONAR REGISTRO</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)}>[X]</span>
            </div>
            <div style={{ background: '#fff3cd', color: '#856404', padding: 10, fontSize: '0.7rem', border: '1px solid #ffeeba', marginBottom: 10, textAlign: 'center', fontFamily: 'var(--font-accent)' }}>
              ⚠️ LAS RESERVAS TIENEN UNA VALIDEZ DE 48 HORAS
            </div>
            <input className="retro-input" placeholder="BUSCAR..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', marginBottom: '0.5rem', fontSize: '0.8rem' }} />
            {filteredProducts.map(p => (
              <div key={p.id} className="product-select-item" onClick={() => sendProduct(p.id)}>
                <span style={{ fontFamily: 'var(--font-accent)' }}>
                  {p.status === 'reserved' ? '[RESERVADO] ' : ''}ARCHIVO: {p.name.toUpperCase()}
                </span>
                <strong style={{ color: 'var(--clr-accent)' }}>{Number(p.price).toFixed(2)} €</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

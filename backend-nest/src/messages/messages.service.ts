import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MessagesService {
  constructor(private supabase: SupabaseService) {}

  private async resolveAdminId(): Promise<string> {
    const { data, error } = await this.supabase.db
      .from('users').select('id').ilike('role', 'admin').limit(1).single();
    if (error || !data) throw new Error("No existe ningún usuario con rol 'admin'.");
    return data.id;
  }

  async send(dto: { sender_id: string; receiver_id: string; text: string; product_id?: string }) {
    let { sender_id, receiver_id, text, product_id } = dto;

    if (receiver_id === 'admin') receiver_id = await this.resolveAdminId();
    if (sender_id === 'admin') sender_id = await this.resolveAdminId();

    const { data, error } = await this.supabase.db
      .from('messages')
      .insert([{ sender_id, receiver_id, text, product_id }])
      .select();
    if (error) throw error;
    return data[0];
  }

  async getAdminConversations() {
    const { data: messages, error } = await this.supabase.db
      .from('messages')
      .select(`
        sender_id, receiver_id, created_at, is_read,
        users_sender:users!sender_id(id, name, email, role),
        users_receiver:users!receiver_id(id, name, email, role)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const conversationMap: Record<string, any> = {};
    messages.forEach((m: any) => {
      const senderIsAdmin = m.users_sender?.role?.toLowerCase() === 'admin';
      const receiverIsAdmin = m.users_receiver?.role?.toLowerCase() === 'admin';
      let otherUser = null;
      if (senderIsAdmin && !receiverIsAdmin) otherUser = m.users_receiver;
      if (!senderIsAdmin && receiverIsAdmin) otherUser = m.users_sender;
      if (otherUser?.id) {
        if (!conversationMap[otherUser.id]) {
          conversationMap[otherUser.id] = {
            id: otherUser.id, name: otherUser.name || 'Usuario Desconocido',
            email: otherUser.email, unreadCount: 0,
          };
        }
        if (receiverIsAdmin && !m.is_read) conversationMap[otherUser.id].unreadCount++;
      }
    });
    return Object.values(conversationMap);
  }

  async getHistory(userId: string) {
    const { data, error } = await this.supabase.db
      .from('messages')
      .select(`
        *, users_sender:users!sender_id(role),
        users_receiver:users!receiver_id(role),
        products:products!product_id(id, name, price, status, product_images(url))
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data.map((m: any) => ({
      ...m, is_from_admin: m.users_sender?.role?.toLowerCase() === 'admin',
    }));
  }

  async markAsRead(senderId: string) {
    const adminId = await this.resolveAdminId();
    const { error } = await this.supabase.db
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', adminId)
      .eq('is_read', false);
    if (error) throw error;
    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await this.supabase.db
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return { unreadCount: count || 0 };
  }

  async markAsReadByUser(userId: string) {
    const { error } = await this.supabase.db
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return { success: true };
  }

  async getAdminUnreadTotal() {
    const adminId = await this.resolveAdminId();
    const { count, error } = await this.supabase.db
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', adminId)
      .eq('is_read', false);
    if (error) throw error;
    return { totalUnread: count || 0 };
  }
}

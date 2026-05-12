import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PedidosService {
  constructor(private supabase: SupabaseService) {}

  async create(dto: { user_id: string; product_id: string; shipping_method: string; total_amount: number }) {
    const { data: orderData, error: orderError } = await this.supabase.db
      .from('orders')
      .insert([{ ...dto, status: 'paid' }])
      .select();
    if (orderError) throw orderError;

    const { error: stockError } = await this.supabase.db
      .from('products')
      .update({ status: 'sold', sold_at: new Date() })
      .eq('id', dto.product_id);
    if (stockError) throw stockError;

    return orderData[0];
  }

  async findByUser(userId: string) {
    const { data, error } = await this.supabase.db
      .from('orders')
      .select('*, products(name, price)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.db
      .from('orders')
      .select('*, products(id, name, price), users(id, name, last_name, dni, address, phone, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getNewCount() {
    const { count, error } = await this.supabase.db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'paid');
    if (error) throw error;
    return { count };
  }

  async updateStatus(id: string, status: string, tracking_number?: string) {
    const { data: order, error: fetchError } = await this.supabase.db
      .from('orders')
      .select('*, products(name), users(id)')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;

    const productName = order.products?.name || 'tu producto';
    const userId = order.users?.id || order.user_id;

    const updateData: any = { status };
    if (tracking_number) updateData.tracking_number = tracking_number;

    const { data: updatedOrder, error: updateError } = await this.supabase.db
      .from('orders').update(updateData).eq('id', id).select().single();
    if (updateError) throw updateError;

    const messages: Record<string, string> = {
      preparing: `[SISTEMA] ¡Buenas noticias! Tu pedido de '${productName}' ya se está preparando en nuestras instalaciones.`,
      ready: `[SISTEMA] ¡Tu pedido de '${productName}' ya está listo para recoger!`,
      shipped: `[SISTEMA] ¡Tu pedido de '${productName}' ya ha sido enviado! Código de seguimiento: ${tracking_number}`,
      completed: `[SISTEMA] Tu pedido de '${productName}' ha sido entregado correctamente. ¡Gracias por confiar en El Bazar del Coleccionista!`,
    };

    if (messages[status] && userId) {
      await this.supabase.db.from('messages').insert([{
        sender_id: null, receiver_id: userId, text: messages[status], is_from_admin: true,
      }]);
    }

    return updatedOrder;
  }
}

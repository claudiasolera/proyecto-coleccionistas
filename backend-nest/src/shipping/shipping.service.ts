import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ShippingService {
  constructor(private supabase: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabase.db
      .from('shipping_methods').select('*').order('price', { ascending: true });
    if (error) throw error;
    return data;
  }

  async create(dto: { name: string; description?: string; price: number }) {
    const { data, error } = await this.supabase.db
      .from('shipping_methods').insert([{ ...dto, price: parseFloat(String(dto.price)) }]).select();
    if (error) throw error;
    return data[0];
  }

  async update(id: string, dto: { name: string; description?: string; price: number }) {
    const { data, error } = await this.supabase.db
      .from('shipping_methods')
      .update({ ...dto, price: parseFloat(String(dto.price)) })
      .eq('id', id).select();
    if (error) throw error;
    return data[0];
  }

  async remove(id: string) {
    const { error } = await this.supabase.db.from('shipping_methods').delete().eq('id', id);
    if (error) throw error;
    return { message: 'Método de envío eliminado' };
  }
}

import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FavoritosService {
  constructor(private supabase: SupabaseService) {}

  async findByUser(userId: string) {
    const { data, error } = await this.supabase.db
      .from('favorites')
      .select(`id, product_id, category_id, products(*, product_images(url)), categories(*)`)
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }

  async add(dto: { user_id: string; product_id?: string; category_id?: string }) {
    const { data, error } = await this.supabase.db
      .from('favorites').insert([dto]).select();
    if (error) throw error;
    return data[0];
  }

  async remove(id: string) {
    const { error } = await this.supabase.db.from('favorites').delete().eq('id', id);
    if (error) throw error;
  }
}

import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface ProductFilters {
  category?: string;
  search?: string;
  sort?: string;
  min_price?: string;
  max_price?: string;
}

@Injectable()
export class ProductsService {
  constructor(private supabase: SupabaseService) {}

  async checkExpiredReservations(): Promise<void> {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await this.supabase.db
      .from('products')
      .update({ status: 'available', reserved_for: null, reserved_at: null })
      .eq('status', 'reserved')
      .lt('reserved_at', fortyEightHoursAgo);
  }

  async findAll(filters: ProductFilters) {
    await this.checkExpiredReservations();
    const { category, search, sort, min_price, max_price } = filters;

    let query = this.supabase.db
      .from('active_products')
      .select('*, product_images(*), categories(name)');

    if (category) query = query.eq('category_id', category);
    if (search) query = query.ilike('name', `%${search}%`);
    if (min_price) query = query.gte('price', parseFloat(min_price));
    if (max_price) query = query.lte('price', parseFloat(max_price));

    if (sort === 'oldest') {
      query = query.order('published_at', { ascending: true });
    } else if (sort === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('published_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    await this.checkExpiredReservations();
    const { data, error } = await this.supabase.db
      .from('products')
      .select('*, product_images(*), categories(name)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }
}

import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CategoriesService {
  constructor(private supabase: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabase.db
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  }

  async create(name: string, description?: string) {
    const { data, error } = await this.supabase.db
      .from('categories')
      .insert([{ name, description }])
      .select();
    if (error) throw error;
    return data[0];
  }

  async update(id: string, name: string, description?: string) {
    const { data, error } = await this.supabase.db
      .from('categories')
      .update({ name, description })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  }

  async remove(id: string) {
    const { count, error: countError } = await this.supabase.db
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);
    if (countError) throw countError;
    if (count > 0) {
      throw new Error(`No se puede borrar: hay ${count} productos asociados a esta categoría.`);
    }
    const { error } = await this.supabase.db.from('categories').delete().eq('id', id);
    if (error) throw error;
    return { message: 'Categoría eliminada con éxito' };
  }
}

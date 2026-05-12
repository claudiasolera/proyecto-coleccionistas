import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AdminService {
  constructor(private supabase: SupabaseService) {}

  async createProduct(dto: {
    name: string; description?: string; price: number; category_id: string;
    brand?: string; year?: number; dimensions?: string;
  }, imageFiles: Express.Multer.File[]) {
    const sanitized = {
      name: dto.name,
      description: dto.description || null,
      price: !isNaN(dto.price) ? dto.price : 0,
      category_id: dto.category_id,
      brand: dto.brand || null,
      year: dto.year && !isNaN(dto.year) ? dto.year : null,
      dimensions: dto.dimensions || null,
      status: 'available',
      published_at: new Date(),
    };

    const { data: product, error: pError } = await this.supabase.db
      .from('products').insert([sanitized]).select().single();
    if (pError) throw pError;

    const imageUrls: string[] = [];
    for (const file of imageFiles || []) {
      const fileName = `${product.id}/${Date.now()}-${file.originalname}`;
      const { error: uploadError } = await this.supabase.db.storage
        .from('product-images')
        .upload(fileName, file.buffer, { contentType: file.mimetype });
      if (uploadError) throw uploadError;
      const { data: urlData } = this.supabase.db.storage
        .from('product-images').getPublicUrl(fileName);
      imageUrls.push(urlData.publicUrl);
    }

    if (imageUrls.length > 0) {
      const imageData = imageUrls.map((url, i) => ({ product_id: product.id, url, order: i }));
      const { error: iError } = await this.supabase.db.from('product_images').insert(imageData);
      if (iError) throw iError;
    }

    return product;
  }

  async getInventory() {
    const { data, error } = await this.supabase.db
      .from('products')
      .select('*, product_images(*), categories(name)')
      .order('published_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async updateProduct(id: string, dto: any, imageFiles: Express.Multer.File[]) {
    const sanitized = {
      name: dto.name,
      description: dto.description || null,
      price: !isNaN(parseFloat(dto.price)) ? parseFloat(dto.price) : 0,
      category_id: dto.category_id,
      brand: dto.brand || null,
      year: !isNaN(parseInt(dto.year)) ? parseInt(dto.year) : null,
      dimensions: dto.dimensions || null,
    };

    const { data: product, error: pError } = await this.supabase.db
      .from('products').update(sanitized).eq('id', id).select().single();
    if (pError) throw pError;
    return product;
  }

  async deleteProduct(id: string) {
    const { error } = await this.supabase.db.from('products').delete().eq('id', id);
    if (error) throw error;
    return { message: 'Producto eliminado' };
  }

  async updateStatus(id: string, status: string, reserved_for?: string) {
    const { data, error } = await this.supabase.db
      .from('products')
      .update({
        status,
        reserved_for: reserved_for || null,
        reserved_at: status === 'reserved' ? new Date() : null,
      })
      .eq('id', id).select();
    if (error) throw error;
    return data[0];
  }
}

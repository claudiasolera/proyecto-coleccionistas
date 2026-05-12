export interface ProductImage {
  id: string;
  url: string;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  status: 'available' | 'reserved' | 'sold';
  category_id: string;
  brand?: string;
  year?: number;
  dimensions?: string;
  published_at: string;
  sold_at?: string;
  reserved_for?: string;
  reserved_at?: string;
  product_images?: ProductImage[];
  categories?: Category;
}

export interface User {
  id: string;
  name: string;
  last_name?: string;
  email: string;
  dni?: string;
  address?: string;
  phone?: string;
  role: 'user' | 'admin';
  created_at: string;
  email_verified?: boolean;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  product_id?: string;
  is_read: boolean;
  is_from_admin?: boolean;
  created_at: string;
  products?: Product;
}

export interface Favorite {
  id: string;
  product_id?: string;
  category_id?: string;
  products?: Product;
  categories?: Category;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  shipping_method: string;
  total_amount: number;
  status: string;
  tracking_number?: string;
  created_at: string;
  products?: { name: string; price: number };
  users?: Partial<User>;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  status: string;
}

export interface AuthUser {
  userId: string;
  userRole: 'user' | 'admin';
  userName: string;
}

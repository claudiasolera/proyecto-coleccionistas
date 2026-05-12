const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const defaultOptions: RequestInit = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(`${API_URL}/api${endpoint}`, defaultOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error en la petición' }));
    throw new Error(error.message || 'Error en la petición');
  }

  if (response.status === 204) return null as T;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

export const validators = {
  email: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  dni: (dni: string) => /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(dni),
  phone: (phone: string) => /^[0-9]{9}$/.test(phone),
};

export function getAuth() {
  if (typeof window === 'undefined') return null;
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
  const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName');
  if (!userId) return null;
  return { userId, userRole: userRole as 'user' | 'admin', userName: userName || '' };
}

export function clearAuth() {
  ['userId', 'userRole', 'userName'].forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

export function getCart(): import('../types').CartItem[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

export function saveCart(cart: import('../types').CartItem[]) {
  localStorage.setItem('cart', JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

export function addToCart(product: import('../types').Product): boolean {
  const cart = getCart();
  if (cart.find(i => i.id === product.id)) return false;
  cart.push({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.product_images?.[0]?.url,
    status: product.status,
  });
  saveCart(cart);
  return true;
}

export function isInCart(productId: string): boolean {
  return getCart().some(i => i.id === productId);
}

export function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: cart.length } }));
}

export function addToCart(product) {
    const cart = getCart();
    if (cart.find(p => p.id === product.id)) return false;
    cart.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.product_images?.[0]?.url || '',
        status: product.status
    });
    saveCart(cart);
    return true;
}

export function removeFromCart(productId) {
    saveCart(getCart().filter(p => p.id !== productId));
}

export function isInCart(productId) {
    return getCart().some(p => p.id === productId);
}

export function getCartCount() {
    return getCart().length;
}

export function clearCart() {
    saveCart([]);
}

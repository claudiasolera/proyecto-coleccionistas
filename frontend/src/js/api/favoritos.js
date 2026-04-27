const API_URL = 'http://localhost:3000/api';

export async function addFavorite(productId, categoryId) {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId')
    if (!userId) {
        window.location.href = `/login.html?redirect=${window.location.pathname}`
        return
    }

    try {
        const res = await fetch(`${API_URL}/favoritos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                product_id: productId || null,
                category_id: categoryId || null
            })
        });
        
        if (!res.ok) throw new Error('Error al guardar favorito');
        
        // Eliminado el alert invasivo para una mejor experiencia
        return await res.json();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

export async function getFavorites() {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId')
    if (!userId) return []

    const res = await fetch(`${API_URL}/favoritos/${userId}`)
    if (!res.ok) return []
    return res.json()
}

export async function removeFavorite(favoriteId) {
    const res = await fetch(`${API_URL}/favoritos/${favoriteId}`, {
        method: 'DELETE'
    })
    return res.ok
}

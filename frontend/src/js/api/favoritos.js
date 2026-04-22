const API_URL = 'http://localhost:3000/api';

export async function addFavorite(productId, categoryId) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('ℹ️ ACCESO DENEGADO: Por favor, identifícate en tu PERFIL para guardar tesoros.');
        return;
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
        
        alert('✨ AÑADIDO A TUS TESOROS');
        return await res.json();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

export async function getFavorites() {
    const userId = localStorage.getItem('userId')
    if (!userId) return []

    const res = await fetch(`${API_URL}/favoritos/${userId}`)
    if (!res.ok) return []
    return res.json()
}

const API_URL = 'http://localhost:3000/api'

export async function getProducts(filters = {}) {
    const params = new URLSearchParams(filters)
    const res = await fetch(`${API_URL}/products?${params}`)
    return res.json()
}

export async function getProduct(id) {
    const res = await fetch(`${API_URL}/products/${id}`)
    return res.json()
}
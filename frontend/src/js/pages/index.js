import { getProducts } from '../api/productos.js'
import { addFavorite, getFavorites } from '../api/favoritos.js'

const grid = document.getElementById('products-grid')
const btnFilter = document.getElementById('btn-filter')
const btnClear = document.getElementById('btn-clear')

let userFavorites = []

function formatStatus(status) {
    const labels = {
        available: 'Disponible',
        reserved: 'Reservado',
        sold: 'Vendido'
    }
    return labels[status] || status
}

function isFavorite(productId) {
    return userFavorites.some(f => f.product_id === productId)
}

function renderProducts(products) {
    if (products.length === 0) {
        grid.innerHTML = '<p>No se han encontrado productos.</p>'
        return
    }

    grid.innerHTML = products.map(p => {
        const fav = isFavorite(p.id)
        return `
        <article class="product-card" 
                tabindex="0"
                role="button"
                aria-label="Ver producto ${p.name}, precio ${Number(p.price).toFixed(2)} euros"
                onclick="location.href='/src/pages/producto.html?id=${p.id}'"
                onkeydown="if(event.key==='Enter') location.href='/src/pages/producto.html?id=${p.id}'">
            <img 
                src="${p.product_images?.[0]?.url || 'https://via.placeholder.com/150'}" 
                alt="${p.name}"
            >
            <div class="product-card-body">
                <h2 class="product-card-title">${p.name}</h2>
                <p class="product-card-price">${Number(p.price).toFixed(2)} €</p>
                <span class="product-card-status status-${p.status}">${formatStatus(p.status)}</span>
                <button 
                    class="retro-button btn-favourite ${fav ? 'fav-active' : ''}"
                    aria-label="${fav ? 'Quitar' : 'Añadir'} ${p.name} de favoritos"
                    onclick="event.stopPropagation(); window.handleFavorite('${p.id}')">
                    ${fav ? '♥ En Favoritos' : '♡ Favorito'}
                </button>
            </div>
        </article>
    `}).join('')
}

window.handleFavorite = async (productId) => {
    await addFavorite(productId)
    userFavorites = await getFavorites()
    const products = await getProducts()
    renderProducts(products)
}

async function loadProducts(filters = {}) {
    grid.innerHTML = '<p>Cargando productos...</p>'
    const products = await getProducts(filters)
    renderProducts(products)
}

async function loadCategories() {
    const res = await fetch('http://localhost:3000/api/categories')
    const categories = await res.json()
    const select = document.getElementById('category')
    categories.forEach(cat => {
        const option = document.createElement('option')
        option.value = cat.id
        option.textContent = cat.name
        select.appendChild(option)
    })
}

btnFilter.addEventListener('click', () => {
    const filters = {}
    const category = document.getElementById('category').value
    const search = document.getElementById('search').value
    const sort = document.getElementById('sort').value

    if (category) filters.category = category
    if (search) filters.search = search
    if (sort) filters.sort = sort

    loadProducts(filters)
})

btnClear.addEventListener('click', () => {
    document.getElementById('category').value = ''
    document.getElementById('search').value = ''
    document.getElementById('sort').value = 'newest'
    loadProducts({ sort: 'newest' })
})

async function init() {
    userFavorites = await getFavorites()
    await loadProducts()
    await loadCategories()
}

init()
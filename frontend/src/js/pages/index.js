import { getProducts } from '../api/products.js'
import { addFavorite } from '../api/favoritos.js'

const grid = document.getElementById('products-grid')
const btnFilter = document.getElementById('btn-filter')
const btnClear = document.getElementById('btn-clear')

function renderProducts(products) {
    if (products.length === 0) {
        grid.innerHTML = '<p>No se han encontrado productos.</p>'
        return
    }

    grid.innerHTML = products.map(p => `
        <article class="product-card" onclick="location.href='/frontend/src/pages/producto.html?id=${p.id}'">
            <img 
                src="${p.product_images?.[0]?.url || 'https://via.placeholder.com/150'}" 
                alt="${p.name}"
            >
            <div class="product-card-body">
                <h2 class="product-card-title">${p.name}</h2>
                <p class="product-card-price">${Number(p.price).toFixed(2)} €</p>
                <span class="product-card-status status-${p.status}">${p.status}</span>
                <button 
                    class="retro-button btn-favourite"
                    aria-label="Añadir página a favoritos"
                    onclick="event.stopPropagation(); window.handleFavorite('${p.id}')">
                    ♡ Favorito
                </button>
            </div>
        </article>
    `).join('')
}

window.handleFavorite = async (productId) => {
    await addFavorite(productId);
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
    const from = document.getElementById('from').value
    const to = document.getElementById('to').value

    if (category) filters.category = category
    if (from) filters.from = from
    if (to) filters.to = to

    loadProducts(filters)
})

btnClear.addEventListener('click', () => {
    document.getElementById('category').value = ''
    document.getElementById('from').value = ''
    document.getElementById('to').value = ''
    loadProducts()
})

loadProducts()

loadCategories()
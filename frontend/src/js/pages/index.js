import { getProducts } from '../api/productos.js'
import { addFavorite, getFavorites, removeFavorite } from '../api/favoritos.js'

const grid = document.getElementById('products-grid')
const btnFilter = document.getElementById('btn-filter')
const btnClear = document.getElementById('btn-clear')
const selectCategory = document.getElementById('category')
const btnFavCategory = document.getElementById('btn-fav-category')

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

function isCategoryFavorite(catId) {
    return userFavorites.some(f => f.category_id === catId)
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
    const fav = userFavorites.find(f => f.product_id === productId)
    
    if (fav) {
        await removeFavorite(fav.id)
    } else {
        await addFavorite(productId)
    }
    
    userFavorites = await getFavorites()
    updateCategoryFavUI()
    await loadProducts({ category: selectCategory.value })
}

// Lógica de Favoritos para CATEGORÍAS
function updateCategoryFavUI() {
    const catId = selectCategory.value
    if (!catId) {
        btnFavCategory.style.display = 'none'
        return
    }

    btnFavCategory.style.display = 'inline-block'
    const isFav = isCategoryFavorite(catId)
    btnFavCategory.innerHTML = isFav ? '♥' : '♡'
    btnFavCategory.style.background = isFav ? '#ffcccc' : ''
}

selectCategory.addEventListener('change', updateCategoryFavUI)

btnFavCategory.addEventListener('click', async () => {
    const catId = selectCategory.value
    if (!catId) return

    const fav = userFavorites.find(f => f.category_id === catId)
    if (fav) {
        await removeFavorite(fav.id)
    } else {
        await addFavorite(null, catId)
    }

    userFavorites = await getFavorites()
    updateCategoryFavUI()
})

async function loadProducts(filters = {}) {
    grid.innerHTML = '<p>Cargando productos...</p>'
    const products = await getProducts(filters)
    renderProducts(products)
}

async function loadCategories() {
    const res = await fetch('http://localhost:3000/api/categories')
    const categories = await res.json()
    categories.forEach(cat => {
        const option = document.createElement('option')
        option.value = cat.id
        option.textContent = cat.name
        selectCategory.appendChild(option)
    })
}

btnFilter.addEventListener('click', () => {
    const filters = {}
    const category = selectCategory.value
    const search = document.getElementById('search').value
    const sort = document.getElementById('sort').value

    if (category) filters.category = category
    if (search) filters.search = search
    if (sort) filters.sort = sort

    loadProducts(filters)
})

btnClear.addEventListener('click', () => {
    selectCategory.value = ''
    document.getElementById('search').value = ''
    document.getElementById('sort').value = 'newest'
    updateCategoryFavUI()
    loadProducts({ sort: 'newest' })
})

async function init() {
    userFavorites = await getFavorites()
    
    // Leer parámetros de la URL
    const params = new URLSearchParams(window.location.search)
    const categoryParam = params.get('category')

    await loadCategories()
    
    if (categoryParam) {
        selectCategory.value = categoryParam
        await loadProducts({ category: categoryParam })
    } else {
        await loadProducts()
    }
    
    updateCategoryFavUI()
}

init()
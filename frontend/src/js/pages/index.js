import { getProducts } from '../api/productos.js'
import { addFavorite, getFavorites, removeFavorite } from '../api/favoritos.js'
import { showNotification } from '../utils.js'

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
    const userRole = localStorage.getItem('userRole');
    if (products.length === 0) {
        grid.innerHTML = '<p>No se han encontrado productos.</p>'
        return
    }

    grid.innerHTML = products.map(p => {
        const fav = isFavorite(p.id)
        const imgUrl = p.product_images?.[0]?.url || 'https://via.placeholder.com/150'
        
        // El admin no ve el botón de favoritos
        const favButton = userRole === 'admin' ? '' : `
            <button class="retro-button" 
                    style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: ${fav ? '#d63031' : 'inherit'}; padding: 0;"
                    onclick="event.stopPropagation(); window.handleFavorite('${p.id}')">
                ${fav ? '♥' : '♡'}
            </button>
        `;

        return `
        <article class="product-card" 
                tabindex="0"
                role="button"
                onclick="location.href='/src/pages/producto.html?id=${p.id}'">
            
            <div style="position: relative; width: 100%; border-bottom: 2px solid #000;">
                <img src="${imgUrl}" alt="${p.name}" style="display: block; width: 100%; object-fit: cover;">
                
                <div class="product-card-status status-${p.status}" 
                     style="position: absolute; top: 10px; left: 10px; margin: 0; font-size: 0.7rem; z-index: 2;">
                    ${formatStatus(p.status)}
                </div>
            </div>

            <div class="product-card-body" style="padding: 15px; flex: 1; display: flex; flex-direction: column;">
                <h2 class="product-card-title" style="margin-bottom: 5px;">${p.name}</h2>
                <p class="product-card-price" style="font-weight: bold; font-size: 1.2rem; margin-bottom: 15px;">${Number(p.price).toFixed(2)} €</p>
                
                <div style="display: flex; gap: 8px; margin-top: auto;">
                    <button class="retro-button" style="flex: 1; font-size: 0.8rem; padding: 12px;">
                        VER DETALLES
                    </button>
                    ${favButton}
                </div>
            </div>
        </article>
    `}).join('')
}

window.handleFavorite = async (productId) => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') return; // Seguridad extra
    
    const fav = userFavorite = Array.isArray(userFavorites) ? userFavorites.find(f => f.product_id === productId) : null;
    const btn = document.querySelector(`[onclick*="window.handleFavorite('${productId}')"]`)
    
    try {
        if (fav) {
            await removeFavorite(fav.id)
            if (btn) {
                btn.innerHTML = '♡'
                btn.style.color = 'inherit'
            }
            showNotification('Elemento retirado del archivo', 'success')
        } else {
            await addFavorite(productId)
            if (btn) {
                btn.innerHTML = '♥'
                btn.style.color = '#d63031'
            }
            showNotification('Objeto archivado correctamente', 'success')
        }
        
        userFavorites = await getFavorites()
        updateCategoryFavUI()
    } catch (err) {
        showNotification('Error en la ficha de archivo: ' + err.message, 'error')
    }
}

// Lógica de Favoritos para CATEGORÍAS
function updateCategoryFavUI() {
    const userRole = localStorage.getItem('userRole');
    const catId = selectCategory.value
    
    if (!catId || userRole === 'admin') {
        btnFavCategory.style.display = 'none'
        return
    }

    btnFavCategory.style.display = 'inline-block'
    const isFav = isCategoryFavorite(catId)
    btnFavCategory.innerHTML = isFav ? '♥' : '♡'
    btnFavCategory.style.color = isFav ? '#d63031' : 'inherit'
}

selectCategory.addEventListener('change', updateCategoryFavUI)

btnFavCategory.addEventListener('click', async () => {
    const catId = selectCategory.value
    if (!catId) return

    const fav = userFavorites.find(f => f.category_id === catId)
    try {
        if (fav) {
            await removeFavorite(fav.id)
            showNotification('Categoría retirada del índice', 'success')
        } else {
            await addFavorite(null, catId)
            showNotification('Colección guardada en favoritos', 'success')
        }

        userFavorites = await getFavorites()
        updateCategoryFavUI()
    } catch (err) {
        showNotification('Fallo al actualizar índice: ' + err.message, 'error')
    }
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
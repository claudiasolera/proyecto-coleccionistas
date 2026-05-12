import { getProducts } from '../api/productos.js'
import { addFavorite, getFavorites, removeFavorite } from '../api/favoritos.js'
import { showNotification } from '../utils.js'
import { addToCart, isInCart } from '../carrito.js'

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
        <article class="product-card" style="display: flex; flex-direction: column; min-height: 100%;">
            
            <a href="/src/pages/producto.html#id=${p.id}" style="display: block; position: relative; width: 100%; border-bottom: 2px solid #000; text-decoration: none; color: inherit;">
                <img src="${imgUrl}" alt="${p.name}" style="display: block; width: 100%; object-fit: cover;">
                
                <div class="product-card-status status-${p.status}" 
                    style="position: absolute; top: 10px; left: 10px; margin: 0; font-size: 0.7rem; z-index: 2;">
                    ${formatStatus(p.status)}
                </div>
            </a>
 
            <div class="product-card-body" style="padding: 15px; flex: 1; display: flex; flex-direction: column; min-height: 140px;">
                <h2 class="product-card-title" style="margin-bottom: 5px; font-size: 1rem; line-height: 1.2;">${p.name}</h2>
                
                <!-- El precio se centra verticalmente en el espacio sobrante -->
                <div style="flex: 1; display: flex; align-items: center;">
                    <p class="product-card-price" style="font-weight: bold; font-size: 1.2rem; color: var(--clr-accent); margin: 0;">
                        ${Number(p.price).toFixed(2)} €
                    </p>
                </div>
                
                <div style="display: flex; gap: 8px; margin-top: 10px; align-items: stretch; flex-wrap:wrap;">
                    <a href="/src/pages/producto.html#id=${p.id}" class="retro-button" style="flex: 1; font-size: 0.8rem; padding: 0; height: 44px; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center; box-sizing: border-box; min-width:80px;">
                        VER DETALLES
                    </a>
                    ${userRole === 'admin' ? '' : `
                        ${p.status !== 'sold' ? `
                        <button class="retro-button btn-add-cart-${p.id}"
                                style="width:44px; height:44px; display:flex; align-items:center; justify-content:center; font-size:1.1rem; padding:0; flex-shrink:0; box-sizing:border-box; background:${isInCart(p.id) ? '#90ee90' : '#ffffcc'}; title='${isInCart(p.id) ? 'En bolsa' : 'Añadir a la bolsa'}';"
                                onclick="event.stopPropagation(); window.handleCart('${p.id}', this)">
                            ${isInCart(p.id) ? '🛒' : '＋'}
                        </button>
                        ` : ''}
                        <button class="retro-button"
                                style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: ${fav ? '#d63031' : 'inherit'}; padding: 0; flex-shrink: 0; box-sizing: border-box;"
                                onclick="event.stopPropagation(); window.handleFavorite('${p.id}')">
                            ${fav ? '♥' : '♡'}
                        </button>
                    `}
                </div>
            </div>
        </article>
    `}).join('')
}

window.handleCart = async (productId, btn) => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') return;
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!userId) {
        window.location.href = `/login.html?redirect=${window.location.pathname}`;
        return;
    }
    try {
        const res = await fetch(`http://localhost:3000/api/products/${productId}`);
        const product = await res.json();
        const added = addToCart(product);
        if (added) {
            btn.textContent = '🛒';
            btn.style.background = '#90ee90';
            showNotification('Añadido a la bolsa', 'success');
        } else {
            window.location.href = '/src/pages/carrito.html';
        }
    } catch (err) {
        showNotification('Error al añadir al carrito', 'error');
    }
};

window.handleFavorite = async (productId) => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') return;
    
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId')
    if (!userId) {
        window.location.href = `/login.html?redirect=${window.location.pathname}`
        return
    }

    const fav = Array.isArray(userFavorites) ? userFavorites.find(f => f.product_id === productId) : null;
    const btn = document.querySelector(`[onclick*="window.handleFavorite('${productId}')"]`)
    
    try {
        if (fav) {
            await removeFavorite(fav.id)
            if (btn) {
                btn.innerHTML = '♡'
                btn.style.color = 'inherit'
            }
            showNotification('Quitado de favoritos', 'success')
        } else {
            await addFavorite(productId)
            if (btn) {
                btn.innerHTML = '♥'
                btn.style.color = '#d63031'
            }
            showNotification('Añadido a favoritos', 'success')
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
            showNotification('Quitado de favoritos', 'success')
        } else {
            await addFavorite(null, catId)
            showNotification('Añadido a favoritos', 'success')
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
    const minPrice = document.getElementById('price-min').value
    const maxPrice = document.getElementById('price-max').value

    if (category) filters.category = category
    if (search) filters.search = search
    if (sort) filters.sort = sort
    if (minPrice) filters.min_price = minPrice
    if (maxPrice) filters.max_price = maxPrice

    loadProducts(filters)
})

btnClear.addEventListener('click', () => {
    selectCategory.value = ''
    document.getElementById('search').value = ''
    document.getElementById('sort').value = 'newest'
    document.getElementById('price-min').value = ''
    document.getElementById('price-max').value = ''
    updateCategoryFavUI()
    loadProducts({ sort: 'newest' })
})

async function init() {
    try {
        userFavorites = await getFavorites()
    } catch (err) {
        console.warn("No se pudieron cargar los favoritos, continuando carga general...");
        userFavorites = []
    }
    
    // 1. Mirar si venimos de Favoritos con una categoría guardada (Navegación Invisible)
    let categoryParam = localStorage.getItem('filterCategory')
    if (categoryParam) {
        localStorage.removeItem('filterCategory') // Limpiamos para que no se repita
    } else {
        // Fallback: Leer de la URL solo si es necesario (aunque el usuario prefiere URL limpia)
        const params = new URLSearchParams(window.location.search)
        categoryParam = params.get('category')
        if (!categoryParam && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            categoryParam = hashParams.get('category')
        }
    }

    await loadCategories()
    
    if (categoryParam) {
        selectCategory.value = categoryParam
        await loadProducts({ category: categoryParam })
        
        // Si venía por URL (raro ahora), limpiamos la barra
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        await loadProducts()
    }
    
    updateCategoryFavUI()
}

init()
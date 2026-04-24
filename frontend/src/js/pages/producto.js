import { getProduct } from '../api/productos.js'
import { addFavorite, getFavorites, removeFavorite } from '../api/favoritos.js'

const params = new URLSearchParams(window.location.search)
const id = params.get('id')

if (!id) window.location.href = '../../index.html'

async function loadProduct() {
    const product = await getProduct(id)

    if (!product || product.error) {
        document.querySelector('.product-detail-layout').innerHTML = '<p>Product not found.</p>'
        return
    }

    // Galería con carrusel
    const images = product.product_images
    let currentIndex = 0

    const mainImage = document.getElementById('main-image')
    mainImage.src = images[0]?.url || '/public/placeholder.jpg'
    mainImage.alt = product.name

    const thumbnails = document.getElementById('thumbnails')
    thumbnails.innerHTML = images.map((img, i) => `
        <img 
            src="${img.url}" 
            alt="${product.name} imagen ${i + 1}"
            class="thumbnail ${i === 0 ? 'active' : ''}"
            onclick="goToImage(${i})"
        >
    `).join('')

    window.goToImage = (index) => {
        currentIndex = index
        mainImage.src = images[currentIndex].url
        document.querySelectorAll('.thumbnail').forEach((t, i) => {
            t.classList.toggle('active', i === currentIndex)
        })
    }

    document.querySelector('.carousel-prev').onclick = () => {
        if (images.length <= 1) return
        currentIndex = (currentIndex - 1 + images.length) % images.length
        goToImage(currentIndex)
    }

    document.querySelector('.carousel-next').onclick = () => {
        if (images.length <= 1) return
        currentIndex = (currentIndex + 1) % images.length
        goToImage(currentIndex)
    }

    // Info
    document.getElementById('product-name').textContent = product.name
    document.getElementById('product-price').textContent = `${Number(product.price).toFixed(2)} €`
    document.getElementById('product-description').textContent = product.description || ''
    document.getElementById('product-brand').textContent = product.brand || '—'
    document.getElementById('product-year').textContent = product.year || '—'
    document.getElementById('product-dimensions').textContent = product.dimensions || '—'
    document.getElementById('product-category').textContent = product.categories?.name || '—'
    document.getElementById('product-published').textContent = new Date(product.published_at).toLocaleDateString('en-GB')

    // Status
    const statusEl = document.getElementById('product-status')
    const statusLabels = {
        available: 'Disponible',
        reserved: 'Reservado',
        sold: 'Vendido'
    }
    statusEl.textContent = statusLabels[product.status] || product.status
    statusEl.classList.add(`status-${product.status}`)

    // Lógica de botones según Sesión
    const btnBuy = document.getElementById('btn-buy');
    const btnFav = document.getElementById('btn-favourite');
    const btnChat = document.getElementById('btn-chat');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    if (userRole === 'admin') {
        // El administrador no compra, ni pregunta, ni guarda favoritos
        btnBuy.style.display = 'none';
        btnFav.style.display = 'none';
        btnChat.style.display = 'none';
        
        // Podríamos añadir un botón de "EDITAR" aquí en el futuro
    } else if (!userId) {
        btnBuy.innerText = 'ENTRA PARA COMPRAR'
        btnBuy.onclick = () => window.location.href = `/login.html?redirect=${window.location.pathname}`
        btnFav.onclick = () => window.location.href = `/login.html?redirect=${window.location.pathname}`
        btnChat.onclick = () => window.location.href = `/login.html?redirect=${window.location.pathname}`
    } else {
        const favorites = await getFavorites()
        const favEntry = favorites.find(f => f.product_id === product.id)
        let isFav = !!favEntry

        btnFav.textContent = isFav ? '♥ En Favoritos' : '♡ Añadir a Favoritos'
        btnFav.classList.toggle('fav-active', isFav)

        btnFav.onclick = async () => {
            if (isFav) {
                await removeFavorite(favEntry.id)
                isFav = false
                btnFav.textContent = '♡ Añadir a Favoritos'
                btnFav.classList.remove('fav-active')
            } else {
                await addFavorite(product.id)
                isFav = true
                btnFav.textContent = '♥ En Favoritos'
                btnFav.classList.add('fav-active')
            }
        }

        btnChat.onclick = () => location.href = `chat.html?productId=${product.id}`;

        if (product.status === 'sold') {
            btnBuy.disabled = true;
            btnBuy.style.background = '#ccc';
            btnBuy.innerText = 'PRODUCTO VENDIDO';
        } else if (product.status === 'reserved') {
            if (userId === product.reserved_for) {
                btnBuy.innerText = 'COMPRAR MI RESERVA';
                btnBuy.style.background = 'var(--clr-primary)';
                btnBuy.onclick = () => location.href = `checkout.html?id=${product.id}`;
            } else {
                btnBuy.disabled = true;
                btnBuy.style.background = 'orange';
                btnBuy.innerText = 'PRODUCTO RESERVADO';
            }
        } else {
            btnBuy.onclick = () => location.href = `checkout.html?id=${product.id}`;
        }
    }

    document.title = `${product.name} — Tienda de Coleccionistas`
}

loadProduct()
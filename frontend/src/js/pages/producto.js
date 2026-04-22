import { getProduct } from '../api/productos.js'

const params = new URLSearchParams(window.location.search)
const id = params.get('id')

if (!id) window.location.href = '../../index.html'

async function loadProduct() {
    const product = await getProduct(id)

    if (!product || product.error) {
        document.querySelector('.product-detail-layout').innerHTML = '<p>Product not found.</p>'
        return
    }

    // Main image
    const mainImage = document.getElementById('main-image')
    mainImage.src = product.product_images[0]?.url || '/public/placeholder.jpg'
    mainImage.alt = product.name

    // Thumbnails
    const thumbnails = document.getElementById('thumbnails')
    thumbnails.innerHTML = product.product_images.map((img, i) => `
        <img 
            src="${img.url}" 
            alt="${product.name} image ${i + 1}"
            class="thumbnail ${i === 0 ? 'active' : ''}"
            onclick="document.getElementById('main-image').src = '${img.url}'"
        >
    `).join('')

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

    if (!userId) {
        // Invitado
        btnBuy.innerText = 'ENTRA PARA COMPRAR';
        btnBuy.onclick = () => window.location.href = '../../login.html';
        btnFav.style.display = 'none';
        btnChat.style.display = 'none';
    } else {
        // Configurar botón de CHAT (Solo navegación)
        btnChat.onclick = () => {
            location.href = 'chat.html';
        };

        if (product.status === 'sold') {
        btnBuy.disabled = true;
        btnBuy.style.background = '#ccc';
        btnBuy.innerText = 'PRODUCTO VENDIDO';
    } else if (product.status === 'reserved') {
        // ¿Soy yo el afortunado?
        if (userId === product.reserved_for) {
            btnBuy.innerText = 'COMPRAR MI RESERVA';
            btnBuy.style.background = 'var(--clr-primary)';
            btnBuy.onclick = () => {
                location.href = `checkout.html?id=${product.id}`;
            };
        } else {
            btnBuy.disabled = true;
            btnBuy.style.background = 'orange';
            btnBuy.innerText = 'PRODUCTO RESERVADO';
        }
    } else {
        btnBuy.onclick = () => {
            location.href = `checkout.html?id=${product.id}`;
        };
    }

    // Page title
    document.title = `${product.name} — Tienda de Coleccionistas`
}

loadProduct()
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
    statusEl.textContent = product.status
    statusEl.classList.add(`status-${product.status}`)

    // Lógica del botón COMPRAR
    const btnBuy = document.getElementById('btn-buy')
    if (product.status !== 'available') {
        btnBuy.disabled = true;
        btnBuy.style.background = '#ccc';
        btnBuy.innerText = 'PRODUCTO VENDIDO';
    } else {
        btnBuy.onclick = () => {
            location.href = `checkout.html?id=${product.id}`;
        };
    }

    // Page title
    document.title = `${product.name} — Tienda de Coleccionistas`
}

loadProduct()
import { getProduct } from '../api/productos.js'
import { addFavorite, getFavorites, removeFavorite } from '../api/favoritos.js'
import { showNotification, apiFetch } from '../utils.js'
import { addToCart, isInCart } from '../carrito.js'

// Intentamos obtener el ID de la query (?) o del hash (#)
const params = new URLSearchParams(window.location.search)
let id = params.get('id')
let isSuccess = params.get('success') === 'true'

if (window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    if (!id) id = hashParams.get('id')
    if (!isSuccess) isSuccess = hashParams.get('success') === 'true'
}

async function checkSuccess() {
    if (isSuccess && id) {
        try {
            // Forzamos el estado a vendido si venimos de un pago exitoso
            await apiFetch(`/admin/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'sold' })
            });
            showNotification('¡COMPRA REALIZADA CON ÉXITO! EL ARTÍCULO ES SUYO.', 'success');
            // Limpiamos el éxito de la URL para no repetir el proceso
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash.split('&')[0]);
        } catch (err) {
            console.error("Error al confirmar venta:", err);
        }
    }
}

async function loadProduct() {
    await checkSuccess(); // Verificamos si acabamos de comprarlo
    if (!id) {
        document.querySelector('.product-detail-layout').innerHTML = `
            <div style="text-align:center; padding: 40px; font-family: var(--font-accent);">
                <h2 style="color: #d63031;">ERROR DE IDENTIFICACIÓN</h2>
                <p>No se ha detectado el ID en la URL. Ruta actual: ${window.location.pathname}</p>
                <p style="font-size: 0.8rem; opacity: 0.6;">Query: ${window.location.search || '(vacío)'} | Hash: ${window.location.hash || '(vacío)'}</p>
                <button class="retro-button" onclick="location.href='/index.html'" style="margin-top: 20px;">VOLVER AL CATÁLOGO</button>
            </div>
        `
        return
    }
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
    const btnCartEl = document.getElementById('btn-cart');
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    // Sección vendedor (siempre visible)
    loadSellerInfo(product);

    if (userRole === 'admin') {
        btnBuy.style.display = 'none';
        btnFav.style.display = 'none';
        btnChat.style.display = 'none';
        if (btnCartEl) btnCartEl.style.display = 'none';
    } else if (!userId) {
        // Usuario no logueado: Ocultar acciones reales y mostrar aviso de login
        const authActions = document.getElementById('auth-actions');
        const guestActions = document.getElementById('guest-actions');
        const btnLoginToBuy = document.getElementById('btn-login-to-buy');

        if (authActions) authActions.style.display = 'none';
        if (guestActions) guestActions.style.display = 'block';

        if (btnLoginToBuy) {
            btnLoginToBuy.onclick = () => {
                // Guardamos dónde estábamos para volver después
                // Usamos location.href completo por si hay hashes o queries
                sessionStorage.setItem('redirectAfterLogin', window.location.href);
                window.location.href = '/login.html';
            };
        }
    } else {
        const favorites = await getFavorites()
        const favEntry = favorites.find(f => f.product_id === product.id)
        let isFav = !!favEntry

        btnFav.textContent = isFav ? '♥ En Favoritos' : '♡ Añadir a Favoritos'
        btnFav.classList.toggle('fav-active', isFav)

        btnFav.onclick = async () => {
            try {
                if (isFav) {
                    const favorites = await getFavorites();
                    const currentFav = favorites.find(f => f.product_id === product.id);
                    if (currentFav) {
                        await removeFavorite(currentFav.id);
                        isFav = false;
                        btnFav.textContent = '♡ Añadir a Favoritos';
                        btnFav.classList.remove('fav-active');
                        showNotification('Quitado de favoritos', 'success');
                    }
                } else {
                    await addFavorite(product.id);
                    isFav = true;
                    btnFav.textContent = '♥ En Favoritos';
                    btnFav.classList.add('fav-active');
                    showNotification('Añadido a favoritos', 'success');
                }
            } catch (err) {
                showNotification('Error en el archivo: ' + err.message, 'error');
            }
        }

        btnChat.onclick = () => location.href = `chat.html#productId=${product.id}`;

        // Botón carrito
        if (btnCartEl) {
            const updateCartBtn = () => {
                const inCart = isInCart(product.id);
                btnCartEl.textContent = inCart ? '🛒 EN TU BOLSA' : '＋ AÑADIR A LA BOLSA';
                btnCartEl.style.background = inCart ? '#90ee90' : '#ffffcc';
            };
            updateCartBtn();
            btnCartEl.onclick = () => {
                if (isInCart(product.id)) {
                    window.location.href = '/src/pages/carrito.html';
                } else {
                    addToCart(product);
                    showNotification('Añadido a la bolsa', 'success');
                    updateCartBtn();
                }
            };
            window.addEventListener('cartUpdated', updateCartBtn);
        }

        if (product.status === 'sold') {
            btnBuy.disabled = true;
            btnBuy.style.background = '#ccc';
            btnBuy.innerText = 'PRODUCTO VENDIDO';
        } else if (product.status === 'reserved') {
            if (userId === product.reserved_for) {
                btnBuy.innerText = '🛒 COMPRAR MI RESERVA';
                btnBuy.style.background = '#90ee90';
                btnBuy.onclick = () => location.href = `checkout.html#id=${product.id}`;
            } else {
                btnBuy.disabled = true;
                btnBuy.style.background = 'orange';
                btnBuy.innerText = 'PRODUCTO RESERVADO';
            }
        } else {
            btnBuy.onclick = () => location.href = `checkout.html#id=${product.id}`;
        }
    }

    document.title = `${product.name} — Tienda de Coleccionistas`
}

async function loadSellerInfo(product) {
    const section = document.getElementById('seller-section');
    if (!section) return;

    try {
        // Buscar el admin (el vendedor de la tienda)
        const res = await fetch('http://localhost:3000/api/users?role=admin');
        let sellerId = null;
        let sellerName = 'El Bazar del Coleccionista';

        if (res.ok) {
            const users = await res.json();
            const admin = users.find(u => u.role === 'admin');
            if (admin) {
                sellerId = admin.id;
                sellerName = admin.name ? `${admin.name} ${admin.last_name || ''}`.trim() : sellerName;
            }
        }

        document.getElementById('seller-name').textContent = sellerName;
        document.getElementById('seller-stars').innerHTML = renderStars(4.8);
        document.getElementById('seller-reviews').textContent = 'Vendedor verificado · Miembro fundador';

        if (sellerId) {
            document.getElementById('seller-link').href = `/src/pages/vendedor.html?id=${sellerId}`;
        } else {
            document.getElementById('seller-link').style.display = 'none';
        }

        section.style.display = 'block';
    } catch (err) {
        console.warn('No se pudo cargar la info del vendedor');
    }
}

function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let html = '';
    for (let i = 0; i < 5; i++) {
        if (i < full) html += '<span class="star star-full">★</span>';
        else if (i === full && half) html += '<span class="star star-half">★</span>';
        else html += '<span class="star star-empty">☆</span>';
    }
    html += `<span style="font-family:var(--font-accent); font-size:0.75rem; margin-left:6px; vertical-align:middle;">${rating.toFixed(1)}</span>`;
    return html;
}

loadProduct()
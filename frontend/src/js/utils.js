/**
 * utils.js - Cajón de Herramientas compartido
 */

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

export const validators = {
    email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    dni: (dni) => /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(dni),
    phone: (phone) => /^[0-9]{9}$/.test(phone)
};

export const apiFetch = async (endpoint, options = {}) => {
    const API_URL = 'http://localhost:3000/api';
    const defaultOptions = {
        headers: { 'Content-Type': 'application/json' },
        ...options
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, defaultOptions);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error en la petición');
        }
        // Si no hay contenido (status 204) o el body está vacío, devolvemos null
        if (response.status === 204) return null;
        
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
};

/**
 * Muestra una notificación retro en pantalla
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - 'success' o 'error'
 */
export const showNotification = (message, type = 'success') => {
    let container = document.querySelector('.retro-notification-container');
    
    // Crear el contenedor si no existe
    if (!container) {
        container = document.createElement('div');
        container.className = 'retro-notification-container';
        document.body.appendChild(container);
    }

    // Crear la notificación
    const notification = document.createElement('div');
    notification.className = `retro-notification ${type}`;
    
    const icon = type === 'success' ? '📎' : '⚠️'; // Iconos de oficina retro
    
    notification.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <span style="letter-spacing: 1px;">- ${message.toUpperCase()} -</span>
    `;

    container.appendChild(notification);

    // Auto-eliminar con efecto fade-out
    setTimeout(() => {
        notification.classList.add('retro-notification-fade-out');
        notification.addEventListener('animationend', () => {
            notification.remove();
            // Limpiar contenedor si está vacío
            if (container.childNodes.length === 0) {
                container.remove();
            }
        });
    }, 4000);
};

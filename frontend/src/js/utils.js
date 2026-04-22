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

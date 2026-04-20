import { apiFetch, validators } from './utils.js';

const form = document.getElementById('profile-form');

// 1. CARGAR DATOS AL INICIAR
window.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
        console.log('Intentando cargar perfil del usuario:', userId);
        try {
            const user = await apiFetch(`/users/${userId}`);
            // Rellenar cada campo del formulario dinámicamente si existe en la respuesta
            Object.keys(user).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) input.value = user[key];
            });
        } catch (err) {
            console.warn("No se pudo cargar el perfil previo:", err.message);
        }
    }
});

// 2. LOGICA DE REGISTRO / ACTUALIZACIÓN
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validaciones de seguridad y negocio
    if (!validators.email(data.email)) return alert('Error: El formato del e-mail no es válido.');
    if (!validators.dni(data.dni)) return alert('Error: El DNI debe tener 8 números y una letra.');
    if (!validators.phone(data.phone)) return alert('Error: El teléfono debe tener 9 dígitos.');

    try {
        const result = await apiFetch('/users/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        // Guardar ID en localStorage para futuras visitas
        localStorage.setItem('userId', result.id);
        alert('¡DATOS GUARDADOS EN EL BAZAR CON ÉXITO!');
        
    } catch (err) {
        alert('Error al procesar el registro: ' + err.message);
    }
});

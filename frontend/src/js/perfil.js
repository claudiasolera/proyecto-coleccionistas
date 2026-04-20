import { apiFetch, validators } from './utils.js';

const form = document.getElementById('profile-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validaciones
    if (!validators.email(data.email)) return alert('Email no válido');
    if (!validators.dni(data.dni)) return alert('DNI no válido');

    try {
        const result = await apiFetch('/users/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        alert('Perfil guardado con éxito. ID: ' + result.id);
        localStorage.setItem('userId', result.id);
    } catch (err) {
        alert('Error: ' + err.message);
    }
});

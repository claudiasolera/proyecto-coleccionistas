const SUPABASE_URL = 'https://spbxbltadppuduvhphsy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwYnhibHRhZHBwdWR1dmhwaHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDg2MTUsImV4cCI6MjA5MTg4NDYxNX0.NcaP85vdzoA9rJUkt6V0R_hYCYYt3s_XGInu4FyetwU';

const { createClient } = window.supabase; 
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const messagesContainer = document.getElementById('messages');

const userName = localStorage.getItem('userId') ? 'Coleccionista_' + localStorage.getItem('userId').slice(0,4) : 'Invitado_90s';

const channel = client.channel('bazar-chat', {
    config: { broadcast: { self: true } }
});

channel
    .on('broadcast', { event: 'new_msg' }, ({ payload }) => {
        renderMessage(payload);
    })
    .subscribe((status) => {
        console.log('Estado del chat:', status);
    });

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    try {
        const payload = {
            user: userName,
            text: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAdmin: false
        };

        await channel.send({
            type: 'broadcast',
            event: 'new_msg',
            payload: payload
        });

        chatInput.value = '';
    } catch (err) {
        console.error('Error al enviar:', err);
    }
});

function renderMessage(payload) {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = `
        <span class="msg-time">[${payload.timestamp}]</span>
        <span class="${payload.isAdmin ? 'msg-admin' : 'msg-user'}">${payload.isAdmin ? 'ADMIN' : payload.user}:</span>
        <span class="msg-text">${payload.text}</span>
    `;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Simulamos bienvenida del admin
setTimeout(() => {
    renderMessage({
        user: 'Admin',
        text: '¡Hola! Bienvenido al Bazar. ¿En qué te puedo ayudar?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAdmin: true
    });
}, 1500);

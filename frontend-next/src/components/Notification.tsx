'use client';

export function showNotification(message: string, type: 'success' | 'error' = 'success') {
  if (typeof document === 'undefined') return;

  let container = document.querySelector('.retro-notification-container') as HTMLElement;
  if (!container) {
    container = document.createElement('div');
    container.className = 'retro-notification-container';
    document.body.appendChild(container);
  }

  const notification = document.createElement('div');
  notification.className = `retro-notification ${type}`;
  const icon = type === 'success' ? '📎' : '⚠️';
  notification.innerHTML = `
    <span style="font-size:1.2rem;">${icon}</span>
    <span style="letter-spacing:1px;">- ${message.toUpperCase()} -</span>
  `;
  container.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('retro-notification-fade-out');
    notification.addEventListener('animationend', () => {
      notification.remove();
      if (container.childNodes.length === 0) container.remove();
    });
  }, 4000);
}

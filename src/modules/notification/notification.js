/**
 * Notification Module
 * showNotification, showError
 */

export function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: var(--accent);
    color: white;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1001;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

export function showError(title, message) {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="welcome" style="color: var(--accent);">
      <h2>${title}</h2>
      <p>${message}</p>
    </div>
  `;
}

/**
 * 토스트 알림 컴포넌트
 */

let toastContainer = null;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * 토스트 표시
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} duration
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = ensureContainer();

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${icons[type]}</span>
    <span class="toast__message">${message}</span>
    <button class="toast__close" aria-label="닫기">✕</button>
  `;

  // 닫기 버튼
  toast.querySelector('.toast__close').addEventListener('click', () => {
    removeToast(toast);
  });

  container.appendChild(toast);

  // 자동 제거
  setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
  toast.classList.add('removing');
  setTimeout(() => toast.remove(), 300);
}

/**
 * 모달 컴포넌트
 */
export function openModal({ title, content, onClose, size = 'md' }) {
  // 기존 모달 제거
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';

  const sizeClass = size === 'lg' ? 'modal--lg' : size === 'sm' ? 'modal--sm' : '';

  overlay.innerHTML = `
    <div class="modal ${sizeClass}" id="modal">
      <div class="modal__header">
        <h2 class="modal__title">${title}</h2>
        <button class="modal__close" id="modal-close" aria-label="닫기">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="modal__body" id="modal-body"></div>
    </div>
  `;

  const body = overlay.querySelector('#modal-body');
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }

  // 닫기 이벤트
  const close = () => {
    overlay.classList.add('closing');
    setTimeout(() => {
      overlay.remove();
      if (onClose) onClose();
    }, 200);
  };

  overlay.querySelector('#modal-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // ESC 키로 닫기
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  document.body.appendChild(overlay);

  // 애니메이션 트리거
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  return { close, body };
}

/**
 * 모달 닫기
 */
export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.add('closing');
    setTimeout(() => overlay.remove(), 200);
  }
}

/**
 * 확인 다이얼로그
 */
export function confirmDialog({ title, message, confirmText = '확인', cancelText = '취소', danger = false }) {
  return new Promise((resolve) => {
    const content = document.createElement('div');
    content.innerHTML = `
      <p style="margin-bottom: var(--space-lg); color: var(--text-secondary); font-size: var(--font-size-sm);">${message}</p>
      <div style="display: flex; justify-content: flex-end; gap: var(--space-sm);">
        <button class="btn btn-ghost" id="confirm-cancel">${cancelText}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${confirmText}</button>
      </div>
    `;

    const { close } = openModal({ title, content, size: 'sm' });

    content.querySelector('#confirm-cancel').addEventListener('click', () => {
      close();
      resolve(false);
    });

    content.querySelector('#confirm-ok').addEventListener('click', () => {
      close();
      resolve(true);
    });
  });
}

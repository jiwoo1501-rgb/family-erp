import { NAV_ITEMS } from '../utils/constants.js';

/**
 * 사이드바 네비게이션 컴포넌트
 */
export function createSidebar(currentView, onNavigate) {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';

  sidebar.innerHTML = `
    <div class="sidebar__header">
      <div class="sidebar__logo">
        <span class="sidebar__logo-icon">🏡</span>
        <span class="sidebar__logo-text">우리가족 ERP</span>
      </div>
      <button class="sidebar__toggle" id="sidebar-toggle" aria-label="사이드바 토글">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>
    </div>

    <nav class="sidebar__nav">
      ${NAV_ITEMS.map(
        (item) => `
        <button class="sidebar__nav-item ${currentView === item.id ? 'active' : ''}" 
                data-view="${item.id}"
                id="nav-${item.id}">
          <span class="sidebar__nav-icon">${item.icon}</span>
          <span class="sidebar__nav-label">${item.label}</span>
        </button>
      `
      ).join('')}
    </nav>

    <div class="sidebar__footer">
      <div class="sidebar__theme-toggle" id="theme-toggle">
        <span class="sidebar__theme-icon" id="theme-icon">☀️</span>
        <span class="sidebar__theme-label">라이트 모드</span>
      </div>
    </div>
  `;

  // 네비게이션 이벤트
  sidebar.querySelectorAll('.sidebar__nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      onNavigate(view);
    });
  });

  // 사이드바 토글 (모바일)
  const toggleBtn = sidebar.querySelector('#sidebar-toggle');
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    document.querySelector('.main-content')?.classList.toggle('expanded');
  });

  // 테마 토글
  const themeToggle = sidebar.querySelector('#theme-toggle');
  themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);

    const icon = sidebar.querySelector('#theme-icon');
    const label = sidebar.querySelector('.sidebar__theme-label');
    icon.textContent = next === 'dark' ? '🌙' : '☀️';
    label.textContent = next === 'dark' ? '다크 모드' : '라이트 모드';

    localStorage.setItem('family-erp-theme', next);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: next }));
  });

  return sidebar;
}

/**
 * 사이드바 활성 상태 업데이트
 */
export function updateSidebarActive(view) {
  document.querySelectorAll('.sidebar__nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

// 모바일 오버레이 닫기
export function closeSidebarMobile() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar && window.innerWidth <= 768) {
    sidebar.classList.add('collapsed');
  }
}

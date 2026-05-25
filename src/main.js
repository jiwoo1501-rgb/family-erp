import './styles/index.css';
import './styles/components.css';
import './styles/dashboard.css';
import './styles/transactions.css';
import './styles/pdf-upload.css';
import './styles/categories.css';

import { createSidebar, updateSidebarActive, closeSidebarMobile } from './components/sidebar.js';
import { renderDashboard } from './views/dashboard.js';
import { renderTransactions } from './views/transactions.js';
import { renderPdfUpload } from './views/pdf-upload.js';
import { renderCategories } from './views/categories.js';
import { renderSettings } from './views/settings.js';
import { backgroundSync } from './utils/supabase-service.js';

// 현재 뷰
let currentView = 'dashboard';

/**
 * 앱 초기화
 */
function initApp() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  // 테마 복원
  const savedTheme = localStorage.getItem('family-erp-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // 사이드바 생성
  const sidebar = createSidebar(currentView, navigateTo);
  app.appendChild(sidebar);

  // 메인 컨텐츠 영역
  const main = document.createElement('main');
  main.className = 'main-content';
  main.id = 'main-content';
  app.appendChild(main);

  // 모바일 메뉴 버튼
  const mobileHeader = document.createElement('div');
  mobileHeader.className = 'mobile-header';
  mobileHeader.id = 'mobile-header';
  mobileHeader.innerHTML = `
    <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="메뉴">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12h18M3 6h18M3 18h18"/>
      </svg>
    </button>
    <span class="mobile-header__title">🏠 우리가족 ERP</span>
  `;
  app.appendChild(mobileHeader);

  mobileHeader.querySelector('#mobile-menu-btn').addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // 네비게이션 이벤트 (커스텀)
  window.addEventListener('navigate', (e) => {
    navigateTo(e.detail);
  });

  // 테마 변경 이벤트 (차트 등 리렌더링을 위해)
  window.addEventListener('theme-change', () => {
    renderView(currentView);
  });

  // 백그라운드 클라우드 데이터 동기화
  backgroundSync();

  // 초기 뷰 렌더
  renderView(currentView);
}

/**
 * 뷰 네비게이션
 */
function navigateTo(view) {
  currentView = view;
  updateSidebarActive(view);
  closeSidebarMobile();
  renderView(view);
}

/**
 * 뷰 렌더링
 */
function renderView(view) {
  const main = document.getElementById('main-content');
  if (!main) return;

  // 페이지 전환 애니메이션
  main.style.opacity = '0';
  main.style.transform = 'translateY(10px)';

  setTimeout(() => {
    switch (view) {
      case 'dashboard':
        renderDashboard(main);
        break;
      case 'transactions':
        renderTransactions(main);
        break;
      case 'pdf-upload':
        renderPdfUpload(main);
        break;
      case 'categories':
        renderCategories(main);
        break;
      case 'settings':
        renderSettings(main);
        break;
      default:
        renderDashboard(main);
    }

    // 페이지 전환 애니메이션 완료
    requestAnimationFrame(() => {
      main.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      main.style.opacity = '1';
      main.style.transform = 'translateY(0)';
    });
  }, 150);
}

// DOM 준비 후 초기화
document.addEventListener('DOMContentLoaded', initApp);

import { store } from '../store/store.js';
import { formatCurrency } from '../utils/formatters.js';
import { EMOJI_LIST, COLOR_PALETTE } from '../utils/constants.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';

/**
 * 카테고리 관리 뷰 렌더링
 */
export function renderCategories(container) {
  const categories = store.getCategories();
  const now = new Date();
  const stats = store.getMonthlyStats(now.getFullYear(), now.getMonth());

  let activeTab = 'expense';

  container.innerHTML = `
    <div class="page-header">
      <h1>카테고리</h1>
      <p>수입/지출 카테고리를 관리하세요</p>
    </div>

    <div class="categories-tabs">
      <button class="tab active" data-tab="expense" id="tab-expense">💸 지출 카테고리</button>
      <button class="tab" data-tab="income" id="tab-income">💰 수입 카테고리</button>
    </div>

    <div class="categories-grid" id="categories-grid">
      <!-- 동적 렌더링 -->
    </div>
  `;

  function renderGrid() {
    const filteredCats = categories.filter((c) => c.type === activeTab);
    const grid = document.getElementById('categories-grid');

    grid.innerHTML =
      filteredCats
        .map((cat) => {
          const monthlyAmount = stats.byCategory[cat.name]?.[activeTab] || 0;

          return `
          <div class="category-card animate-fade-in" data-id="${cat.id}">
            <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: ${cat.color}; border-radius: 2px;"></div>
            <div class="category-card__header">
              <div class="category-card__icon" style="background: ${cat.color}20;">
                ${cat.icon}
              </div>
              <div class="category-card__actions">
                <button class="btn-icon tx-action-btn" data-action="edit" data-id="${cat.id}" title="수정">✏️</button>
                <button class="btn-icon tx-action-btn tx-action-btn--delete" data-action="delete" data-id="${cat.id}" title="삭제">🗑️</button>
              </div>
            </div>
            <div class="category-card__name">${cat.name}</div>
            <div class="category-card__amount">
              이번 달: <span class="${activeTab === 'income' ? 'text-income' : 'text-expense'}">${formatCurrency(monthlyAmount)}</span>
            </div>
          </div>
        `;
        })
        .join('') +
      `
      <div class="category-card category-card--add" id="btn-add-category">
        <div class="category-card--add__icon">➕</div>
        <div class="category-card--add__text">카테고리 추가</div>
      </div>
    `;

    // 이벤트
    grid.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cat = categories.find((c) => c.id === btn.dataset.id);
        if (cat) openCategoryForm(cat);
      });
    });

    grid.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = await confirmDialog({
          title: '카테고리 삭제',
          message: '이 카테고리를 삭제하시겠습니까? 기존 거래 내역의 카테고리는 유지됩니다.',
          confirmText: '삭제',
          danger: true,
        });
        if (confirmed) {
          store.deleteCategory(btn.dataset.id);
          // 로컬 배열 업데이트
          const idx = categories.findIndex((c) => c.id === btn.dataset.id);
          if (idx !== -1) categories.splice(idx, 1);
          showToast('카테고리가 삭제되었습니다', 'info');
          renderGrid();
        }
      });
    });

    document.getElementById('btn-add-category').addEventListener('click', () => {
      openCategoryForm(null);
    });
  }

  function openCategoryForm(editCat) {
    const isEdit = !!editCat;
    const title = isEdit ? '카테고리 수정' : '카테고리 추가';

    let selectedIcon = editCat?.icon || '📦';
    let selectedColor = editCat?.color || COLOR_PALETTE[0];

    const content = document.createElement('div');
    content.innerHTML = `
      <form id="cat-form">
        <div class="form-group">
          <label class="form-label">카테고리 이름 *</label>
          <input type="text" class="form-input" id="cat-name" placeholder="카테고리 이름" value="${editCat?.name || ''}" required>
        </div>

        <div class="form-group">
          <label class="form-label">유형</label>
          <select class="form-select" id="cat-type" ${isEdit ? 'disabled' : ''}>
            <option value="expense" ${activeTab === 'expense' || editCat?.type === 'expense' ? 'selected' : ''}>지출</option>
            <option value="income" ${activeTab === 'income' || editCat?.type === 'income' ? 'selected' : ''}>수입</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">아이콘</label>
          <div class="emoji-picker" id="emoji-picker">
            ${EMOJI_LIST.map(
              (emoji) =>
                `<button type="button" class="emoji-option ${emoji === selectedIcon ? 'selected' : ''}" data-emoji="${emoji}">${emoji}</button>`
            ).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">색상</label>
          <div class="color-picker" id="color-picker">
            ${COLOR_PALETTE.map(
              (color) =>
                `<button type="button" class="color-option ${color === selectedColor ? 'selected' : ''}" data-color="${color}" style="background: ${color}"></button>`
            ).join('')}
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg);">
          <button type="button" class="btn btn-ghost" id="cat-cancel">취소</button>
          <button type="submit" class="btn btn-primary">${isEdit ? '수정' : '추가'}</button>
        </div>
      </form>
    `;

    const { close } = openModal({ title, content });

    // 이모지 선택
    content.querySelectorAll('.emoji-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.emoji-option').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedIcon = btn.dataset.emoji;
      });
    });

    // 색상 선택
    content.querySelectorAll('.color-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.color-option').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedColor = btn.dataset.color;
      });
    });

    content.querySelector('#cat-cancel').addEventListener('click', close);

    content.querySelector('#cat-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const catData = {
        name: document.getElementById('cat-name').value.trim(),
        type: document.getElementById('cat-type').value,
        icon: selectedIcon,
        color: selectedColor,
      };

      if (isEdit) {
        store.updateCategory(editCat.id, catData);
        const idx = categories.findIndex((c) => c.id === editCat.id);
        if (idx !== -1) categories[idx] = { ...categories[idx], ...catData };
        showToast('카테고리가 수정되었습니다', 'success');
      } else {
        const newCat = store.addCategory(catData);
        categories.push(newCat);
        showToast('카테고리가 추가되었습니다', 'success');
      }

      close();
      renderGrid();
    });
  }

  // 탭 이벤트
  container.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      renderGrid();
    });
  });

  renderGrid();
}

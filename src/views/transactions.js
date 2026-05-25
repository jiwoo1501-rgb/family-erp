import { store } from '../store/store.js';
import { formatCurrency, getToday } from '../utils/formatters.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';

const PAGE_SIZE = 20;
let currentPage = 1;
let currentFilters = {};

/**
 * 수입/지출 내역 뷰 렌더링
 */
export function renderTransactions(container) {
  currentPage = 1;
  currentFilters = {};

  const categories = store.getCategories();
  const members = store.getMembers();

  container.innerHTML = `
    <div class="page-header">
      <div class="transactions-header">
        <div>
          <h1>수입/지출</h1>
          <p>거래 내역을 관리하세요</p>
        </div>
        <div class="transactions-actions">
          <button class="btn btn-income" id="btn-add-income">
            <span>+</span> 수입 추가
          </button>
          <button class="btn btn-expense" id="btn-add-expense">
            <span>+</span> 지출 추가
          </button>
        </div>
      </div>
    </div>

    <!-- 필터 -->
    <div class="filters-bar" id="filters-bar">
      <input type="text" class="filter-input" id="filter-search" placeholder="🔍 검색 (설명, 메모)">
      <select class="filter-select" id="filter-type">
        <option value="">전체 유형</option>
        <option value="income">수입</option>
        <option value="expense">지출</option>
      </select>
      <select class="filter-select" id="filter-category">
        <option value="">전체 카테고리</option>
        ${categories.map((c) => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('')}
      </select>
      <select class="filter-select" id="filter-member">
        <option value="">전체 구성원</option>
        ${members.map((m) => `<option value="${m.name}">${m.avatar} ${m.name}</option>`).join('')}
      </select>
      <input type="date" class="filter-date" id="filter-start" title="시작일">
      <input type="date" class="filter-date" id="filter-end" title="종료일">
    </div>

    <!-- 거래 내역 목록 -->
    <div class="transaction-list" id="transaction-list">
      <!-- 동적 렌더링 -->
    </div>

    <!-- 페이지네이션 -->
    <div class="pagination" id="pagination"></div>
  `;

  // 기본 날짜 범위 (이번 달)
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  document.getElementById('filter-start').value = startOfMonth;
  currentFilters.startDate = startOfMonth;

  // 이벤트 리스너
  bindFilterEvents();
  bindAddButtons();

  // 초기 렌더
  refreshList();
}

function bindFilterEvents() {
  const searchInput = document.getElementById('filter-search');
  const typeSelect = document.getElementById('filter-type');
  const categorySelect = document.getElementById('filter-category');
  const memberSelect = document.getElementById('filter-member');
  const startDate = document.getElementById('filter-start');
  const endDate = document.getElementById('filter-end');

  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentFilters.search = searchInput.value;
      currentPage = 1;
      refreshList();
    }, 300);
  });

  typeSelect.addEventListener('change', () => {
    currentFilters.type = typeSelect.value || undefined;
    currentPage = 1;
    refreshList();
  });

  categorySelect.addEventListener('change', () => {
    currentFilters.category = categorySelect.value || undefined;
    currentPage = 1;
    refreshList();
  });

  memberSelect.addEventListener('change', () => {
    currentFilters.member = memberSelect.value || undefined;
    currentPage = 1;
    refreshList();
  });

  startDate.addEventListener('change', () => {
    currentFilters.startDate = startDate.value || undefined;
    currentPage = 1;
    refreshList();
  });

  endDate.addEventListener('change', () => {
    currentFilters.endDate = endDate.value || undefined;
    currentPage = 1;
    refreshList();
  });
}

function bindAddButtons() {
  document.getElementById('btn-add-income').addEventListener('click', () => {
    openTransactionForm('income');
  });
  document.getElementById('btn-add-expense').addEventListener('click', () => {
    openTransactionForm('expense');
  });
}

function refreshList() {
  const allTxs = store.getTransactions(currentFilters);
  const totalPages = Math.ceil(allTxs.length / PAGE_SIZE) || 1;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageTxs = allTxs.slice(start, start + PAGE_SIZE);

  const categories = store.getCategories();
  const listEl = document.getElementById('transaction-list');

  if (pageTxs.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">거래 내역이 없습니다</div>
        <div class="empty-state-desc">위 버튼으로 수입/지출을 추가하세요</div>
      </div>
    `;
  } else {
    // 합계
    const totalIncome = allTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = allTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    listEl.innerHTML =
      pageTxs
        .map((tx, idx) => {
          const cat = categories.find((c) => c.name === tx.category);
          const icon = cat?.icon || '📦';
          const sign = tx.type === 'income' ? '+' : '-';
          const amountClass = tx.type === 'income' ? 'tx-amount--income' : 'tx-amount--expense';

          return `
          <div class="transaction-row" style="animation-delay: ${idx * 0.03}s" data-id="${tx.id}">
            <div class="tx-category-icon" style="background: ${cat?.color || '#636E72'}15;">
              ${icon}
            </div>
            <div class="tx-info">
              <div class="tx-description">${tx.description}</div>
              <div class="tx-meta">
                <span>${tx.date}</span>
                <span class="tx-meta-dot"></span>
                <span>${tx.category}</span>
                ${tx.memo ? `<span class="tx-meta-dot"></span><span>${tx.memo}</span>` : ''}
              </div>
            </div>
            <div class="tx-member">
              ${tx.member || '—'}
            </div>
            <div class="tx-amount ${amountClass}">
              ${sign}${formatCurrency(tx.amount)}
            </div>
            <div class="tx-actions">
              <button class="tx-action-btn" data-action="edit" data-id="${tx.id}" title="수정">✏️</button>
              <button class="tx-action-btn tx-action-btn--delete" data-action="delete" data-id="${tx.id}" title="삭제">🗑️</button>
            </div>
          </div>
        `;
        })
        .join('') +
      `<div class="transaction-summary">
        <div>총 ${allTxs.length}건</div>
        <div>
          <span class="text-income">수입 ${formatCurrency(totalIncome)}</span>
          &nbsp;·&nbsp;
          <span class="text-expense">지출 ${formatCurrency(totalExpense)}</span>
          &nbsp;·&nbsp;
          <span>잔액 ${formatCurrency(totalIncome - totalExpense)}</span>
        </div>
      </div>`;
  }

  // 수정/삭제 이벤트
  listEl.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => editTransaction(btn.dataset.id));
  });
  listEl.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', () => deleteTransaction(btn.dataset.id));
  });

  // 페이지네이션
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const el = document.getElementById('pagination');
  if (totalPages <= 1) {
    el.innerHTML = '';
    return;
  }

  let html = `<button class="pagination-btn" ${currentPage <= 1 ? 'disabled' : ''} data-page="${currentPage - 1}">← 이전</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 3 && i < totalPages - 2 && Math.abs(i - currentPage) > 1) {
      if (i === 4) html += '<span class="pagination-info">...</span>';
      continue;
    }
    html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  html += `<button class="pagination-btn" ${currentPage >= totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">다음 →</button>`;

  el.innerHTML = html;
  el.querySelectorAll('.pagination-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page);
      if (page >= 1 && page <= totalPages) {
        currentPage = page;
        refreshList();
        document.getElementById('transaction-list').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/**
 * 거래 추가/수정 폼
 */
function openTransactionForm(type, editData = null) {
  const categories = store.getCategories(type);
  const members = store.getMembers();
  const isEdit = !!editData;
  const title = isEdit ? '거래 수정' : type === 'income' ? '수입 추가' : '지출 추가';

  const content = document.createElement('div');
  content.innerHTML = `
    <form id="tx-form">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">날짜 *</label>
          <input type="date" class="form-input" id="tx-date" value="${editData?.date || getToday()}" required>
        </div>
        <div class="form-group">
          <label class="form-label">금액 *</label>
          <input type="number" class="form-input" id="tx-amount" placeholder="금액을 입력하세요" value="${editData?.amount || ''}" required min="1">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">설명 *</label>
        <input type="text" class="form-input" id="tx-desc" placeholder="거래 내용을 입력하세요" value="${editData?.description || ''}" required>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">카테고리 *</label>
          <select class="form-select" id="tx-category" required>
            ${categories.map((c) => `<option value="${c.name}" ${editData?.category === c.name ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">구성원</label>
          <select class="form-select" id="tx-member">
            <option value="">선택 안함</option>
            ${members.map((m) => `<option value="${m.name}" ${editData?.member === m.name ? 'selected' : ''}>${m.avatar} ${m.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">메모</label>
        <textarea class="form-textarea" id="tx-memo" placeholder="메모 (선택사항)">${editData?.memo || ''}</textarea>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg);">
        <button type="button" class="btn btn-ghost" id="tx-cancel">취소</button>
        <button type="submit" class="btn ${type === 'income' ? 'btn-income' : 'btn-expense'}">
          ${isEdit ? '수정' : '추가'}
        </button>
      </div>
    </form>
  `;

  const { close } = openModal({ title, content });

  content.querySelector('#tx-cancel').addEventListener('click', close);

  content.querySelector('#tx-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const txData = {
      type,
      date: document.getElementById('tx-date').value,
      amount: parseInt(document.getElementById('tx-amount').value, 10),
      description: document.getElementById('tx-desc').value.trim(),
      category: document.getElementById('tx-category').value,
      member: document.getElementById('tx-member').value,
      memo: document.getElementById('tx-memo').value.trim(),
    };

    if (isEdit) {
      store.updateTransaction(editData.id, txData);
      showToast('거래가 수정되었습니다', 'success');
    } else {
      store.addTransaction(txData);
      showToast(`${type === 'income' ? '수입' : '지출'}이 추가되었습니다`, 'success');
    }

    close();
    refreshList();
  });
}

function editTransaction(id) {
  const txs = store.getTransactions({});
  const tx = txs.find((t) => t.id === id);
  if (tx) {
    openTransactionForm(tx.type, tx);
  }
}

async function deleteTransaction(id) {
  const confirmed = await confirmDialog({
    title: '거래 삭제',
    message: '이 거래 내역을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.',
    confirmText: '삭제',
    danger: true,
  });

  if (confirmed) {
    store.deleteTransaction(id);
    showToast('거래가 삭제되었습니다', 'info');
    refreshList();
  }
}

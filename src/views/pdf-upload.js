import { store } from '../store/store.js';
import { formatCurrency } from '../utils/formatters.js';
import { extractTextFromPdf, parseTransactions } from '../utils/pdf-parser.js';
import { showToast } from '../components/toast.js';

/**
 * PDF 업로드 및 분석 뷰 렌더링
 */
export function renderPdfUpload(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>PDF 분석</h1>
      <p>카드 영수증/이용내역서 PDF를 업로드하면 자동으로 거래 내역을 추출합니다</p>
    </div>

    <div id="pdf-content">
      <div class="pdf-upload-zone" id="pdf-drop-zone">
        <div class="pdf-upload-zone__content">
          <span class="pdf-upload-zone__icon">📄</span>
          <div class="pdf-upload-zone__title">PDF 파일을 여기에 드래그 앤 드롭하세요</div>
          <div class="pdf-upload-zone__desc">또는 아래 버튼을 클릭하여 파일을 선택하세요<br>카드사 이용내역서, 매출전표 등의 PDF를 지원합니다</div>
          <button class="pdf-upload-zone__btn" id="pdf-select-btn">📁 파일 선택</button>
          <input type="file" class="pdf-upload-input" id="pdf-file-input" accept=".pdf">
        </div>
      </div>
    </div>
  `;

  setupDragDrop();
}

function setupDragDrop() {
  const dropZone = document.getElementById('pdf-drop-zone');
  const fileInput = document.getElementById('pdf-file-input');
  const selectBtn = document.getElementById('pdf-select-btn');

  selectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      handleFile(file);
    } else {
      showToast('PDF 파일만 업로드할 수 있습니다', 'error');
    }
  });
}

async function handleFile(file) {
  const content = document.getElementById('pdf-content');

  // 처리 중 표시
  content.innerHTML = `
    <div class="card pdf-processing">
      <div class="spinner" style="margin: 0 auto;"></div>
      <h3 style="margin-top: var(--space-lg);">PDF 분석 중...</h3>
      <div class="pdf-processing__progress">
        <div class="pdf-processing__progress-bar" id="progress-bar" style="width: 0%"></div>
      </div>
      <div class="pdf-processing__status" id="progress-status">파일을 읽고 있습니다...</div>
    </div>
  `;

  try {
    // 텍스트 추출
    const progressBar = document.getElementById('progress-bar');
    const statusEl = document.getElementById('progress-status');

    statusEl.textContent = '텍스트 추출 중...';

    const text = await extractTextFromPdf(file, (progress) => {
      progressBar.style.width = `${progress}%`;
      statusEl.textContent = `텍스트 추출 중... ${progress}%`;
    });

    statusEl.textContent = '거래 내역 분석 중...';
    progressBar.style.width = '100%';

    // 약간의 딜레이 (UX)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 파싱
    const transactions = parseTransactions(text);

    // 결과 표시
    showResults(file.name, text, transactions);
  } catch (error) {
    console.error('PDF 처리 오류:', error);
    content.innerHTML = `
      <div class="card" style="text-align: center; padding: var(--space-2xl);">
        <div style="font-size: 3rem; margin-bottom: var(--space-md);">❌</div>
        <h3 style="margin-bottom: var(--space-sm);">PDF 처리 중 오류가 발생했습니다</h3>
        <p style="color: var(--text-muted); margin-bottom: var(--space-lg);">${error.message}</p>
        <button class="btn btn-primary" id="retry-btn">다시 시도</button>
      </div>
    `;
    document.getElementById('retry-btn').addEventListener('click', () => {
      renderPdfUpload(document.querySelector('.main-content'));
    });
  }
}

function showResults(fileName, rawText, transactions) {
  const content = document.getElementById('pdf-content');
  const members = store.getMembers();
  const categories = store.getCategories('expense');
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  content.innerHTML = `
    <div class="pdf-results">
      <div class="pdf-results__header">
        <div>
          <h2 style="font-size: var(--font-size-xl); margin-bottom: var(--space-xs);">분석 결과</h2>
          <p style="color: var(--text-muted); font-size: var(--font-size-sm);">📄 ${fileName}</p>
        </div>
        <div style="display: flex; gap: var(--space-sm);">
          <button class="btn btn-ghost" id="btn-new-upload">새 파일 업로드</button>
          <button class="btn btn-primary" id="btn-save-all" ${transactions.length === 0 ? 'disabled' : ''}>
            ✅ 선택 항목 저장 (${transactions.length}건)
          </button>
        </div>
      </div>

      <div class="pdf-results__summary">
        <div class="pdf-results__stat">
          <span class="pdf-results__stat-label">추출된 거래</span>
          <span class="pdf-results__stat-value">${transactions.length}건</span>
        </div>
        <div class="pdf-results__stat">
          <span class="pdf-results__stat-label">총 금액</span>
          <span class="pdf-results__stat-value text-expense">${formatCurrency(totalAmount)}</span>
        </div>
      </div>

      ${
        transactions.length > 0
          ? `
        <div style="margin-bottom: var(--space-sm); display: flex; align-items: center; justify-content: space-between;">
          <label style="font-size: var(--font-size-sm); color: var(--text-secondary); display: flex; align-items: center; gap: var(--space-sm);">
            <input type="checkbox" id="select-all" checked style="accent-color: var(--accent-primary);"> 전체 선택
          </label>
          <div style="display: flex; align-items: center; gap: var(--space-sm);">
            <label class="form-label" style="margin-bottom: 0;">구성원:</label>
            <select class="filter-select" id="bulk-member" style="min-width: 120px;">
              <option value="">선택 안함</option>
              ${members.map((m) => `<option value="${m.name}">${m.avatar} ${m.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="parsed-list">
          ${transactions
            .map(
              (tx, idx) => `
            <div class="parsed-tx-item" data-index="${idx}">
              <input type="checkbox" class="parsed-tx-check" data-index="${idx}" ${tx.selected ? 'checked' : ''}>
              <div class="parsed-tx-info">
                <div class="parsed-tx-desc">${tx.description}</div>
                <div class="parsed-tx-date">${tx.date}</div>
              </div>
              <div class="parsed-tx-category">
                <select data-index="${idx}" class="parsed-cat-select">
                  ${categories.map((c) => `<option value="${c.name}" ${tx.category === c.name ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="parsed-tx-amount text-expense">-${formatCurrency(tx.amount)}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `
          : `
        <div class="card empty-state" style="margin-top: var(--space-lg);">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">거래 내역을 찾지 못했습니다</div>
          <div class="empty-state-desc">
            이 PDF에서 거래 내역 패턴을 인식하지 못했습니다.<br>
            아래 원본 텍스트를 확인하고 수동으로 입력해주세요.
          </div>
        </div>
      `
      }

      <!-- 원본 텍스트 -->
      <div class="pdf-raw-text">
        <details>
          <summary style="cursor: pointer; color: var(--text-secondary); font-size: var(--font-size-sm); padding: var(--space-sm) 0;">
            📝 원본 추출 텍스트 보기
          </summary>
          <div class="pdf-raw-text__content">${escapeHtml(rawText)}</div>
        </details>
      </div>
    </div>
  `;

  // 이벤트 바인딩
  const parsedTransactions = [...transactions];

  // 전체 선택
  document.getElementById('select-all')?.addEventListener('change', (e) => {
    const checked = e.target.checked;
    document.querySelectorAll('.parsed-tx-check').forEach((cb) => {
      cb.checked = checked;
      parsedTransactions[parseInt(cb.dataset.index)].selected = checked;
    });
    updateSaveButton(parsedTransactions);
  });

  // 개별 선택
  document.querySelectorAll('.parsed-tx-check').forEach((cb) => {
    cb.addEventListener('change', () => {
      parsedTransactions[parseInt(cb.dataset.index)].selected = cb.checked;
      updateSaveButton(parsedTransactions);
    });
  });

  // 카테고리 변경
  document.querySelectorAll('.parsed-cat-select').forEach((sel) => {
    sel.addEventListener('change', () => {
      parsedTransactions[parseInt(sel.dataset.index)].category = sel.value;
    });
  });

  // 새 파일 업로드
  document.getElementById('btn-new-upload').addEventListener('click', () => {
    renderPdfUpload(document.querySelector('.main-content'));
  });

  // 저장
  document.getElementById('btn-save-all')?.addEventListener('click', () => {
    const member = document.getElementById('bulk-member')?.value || '';
    const selected = parsedTransactions.filter((t) => t.selected);

    if (selected.length === 0) {
      showToast('저장할 항목을 선택해주세요', 'warning');
      return;
    }

    const toSave = selected.map((t) => ({
      type: t.type,
      date: t.date,
      amount: t.amount,
      description: t.description,
      category: t.category,
      member: member,
      memo: 'PDF 자동 등록',
    }));

    store.addTransactions(toSave);
    showToast(`${toSave.length}건의 거래가 저장되었습니다`, 'success');

    // 업로드 화면으로 돌아가기
    renderPdfUpload(document.querySelector('.main-content'));
  });
}

function updateSaveButton(transactions) {
  const btn = document.getElementById('btn-save-all');
  const count = transactions.filter((t) => t.selected).length;
  if (btn) {
    btn.textContent = `✅ 선택 항목 저장 (${count}건)`;
    btn.disabled = count === 0;
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

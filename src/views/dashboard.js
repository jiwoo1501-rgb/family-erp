import { store } from '../store/store.js';
import { formatCurrency, calcChangePercent } from '../utils/formatters.js';
import { createDoughnutChart, createBarChart, destroyChart } from '../components/chart.js';
import { getAiAnalysis } from '../utils/ai-analyst.js';

let barChart = null;
let doughnutChart = null;

// AI 분석 결과 메모리 캐시 (대시보드 재진입 시 중복 호출 방지)
let cachedAiAnalysis = null;
let isAiLoading = false;
let aiError = null;

/**
 * 대시보드 뷰 렌더링
 */
export function renderDashboard(container) {
  // 차트 인스턴스 정리
  destroyChart(barChart);
  destroyChart(doughnutChart);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const stats = store.getMonthlyStats(currentYear, currentMonth);
  const prevStats = store.getMonthlyStats(
    currentMonth === 0 ? currentYear - 1 : currentYear,
    currentMonth === 0 ? 11 : currentMonth - 1
  );
  const multiMonth = store.getMultiMonthStats(6);

  const incomeChange = calcChangePercent(stats.totalIncome, prevStats.totalIncome);
  const expenseChange = calcChangePercent(stats.totalExpense, prevStats.totalExpense);

  const categories = store.getCategories('expense');

  // 최근 거래 10건
  const recentTxs = store.getTransactions({}).slice(0, 10);

  container.innerHTML = `
    <div class="page-header">
      <h1>대시보드</h1>
      <p>${currentYear}년 ${currentMonth + 1}월 가계부 요약</p>
    </div>

    <div class="dashboard-grid">
      <!-- AI 분석 & 미니 요약 카드 상단 배치 -->
      <div class="dashboard-top-row">
        <!-- AI 가계 분석 카드 -->
        <div class="ai-card animate-fade-in stagger-1" id="ai-analysis-card">
          ${renderAiAnalysisContent()}
        </div>

        <!-- 미니 요약 카드 (수입 / 지출만 유지) -->
        <div class="summary-cards-mini">
          <div class="summary-card summary-card--income animate-fade-in stagger-2" id="card-income">
            <div class="summary-card__header-row">
              <span class="summary-card__label">이번 달 수입</span>
              <div class="summary-card__icon">📈</div>
            </div>
            <div class="summary-card__value">${formatCurrency(stats.totalIncome)}</div>
            <div class="summary-card__change ${incomeChange >= 0 ? 'summary-card__change--up' : 'summary-card__change--down'}">
              ${incomeChange >= 0 ? '▲' : '▼'} ${Math.abs(incomeChange)}% 전월 대비
            </div>
          </div>

          <div class="summary-card summary-card--expense animate-fade-in stagger-3" id="card-expense">
            <div class="summary-card__header-row">
              <span class="summary-card__label">이번 달 지출</span>
              <div class="summary-card__icon">📉</div>
            </div>
            <div class="summary-card__value">${formatCurrency(stats.totalExpense)}</div>
            <div class="summary-card__change ${expenseChange >= 0 ? 'summary-card__change--up' : 'summary-card__change--down'}">
              ${expenseChange >= 0 ? '▲' : '▼'} ${Math.abs(expenseChange)}% 전월 대비
            </div>
          </div>
        </div>
      </div>

      <!-- 차트 영역 (월별 수입/지출 추이, 카테고리 지출) 상단 이동 -->
      <div class="charts-row">
        <div class="chart-card animate-fade-in stagger-3">
          <div class="card-header">
            <h3>월별 수입/지출 추이</h3>
          </div>
          <div class="chart-wrapper">
            <canvas id="chart-bar"></canvas>
          </div>
        </div>

        <div class="chart-card animate-fade-in stagger-4">
          <div class="card-header">
            <h3>카테고리별 지출</h3>
          </div>
          <div class="chart-wrapper">
            <canvas id="chart-doughnut"></canvas>
          </div>
        </div>
      </div>

      <!-- 최근 거래 내역 (하단 전체 배치) -->
      <div class="recent-row-single">
        <div class="card animate-fade-in stagger-4">
          <div class="card-header">
            <h3>최근 거래</h3>
            <button class="btn btn-ghost btn-sm" data-action="view-all-tx">전체 보기 →</button>
          </div>
          <div id="recent-transactions">
            ${renderRecentTransactions(recentTxs, categories)}
          </div>
        </div>
      </div>
    </div>
  `;

  // 차트 렌더링
  renderCharts(multiMonth, stats, categories);

  // 이벤트 바인딩
  bindDashboardEvents(container);

  // AI 분석 로드 시작 (캐시가 없을 경우에만 자동 분석 실행)
  if (!cachedAiAnalysis && !isAiLoading && !aiError) {
    fetchAiReport(container);
  }
}

/**
 * AI 분석 렌더러
 */
function renderAiAnalysisContent() {
  if (isAiLoading) {
    return `
      <div class="ai-card__loading">
        <div class="ai-card__spinner">🧠</div>
        <span>가계 데이터를 분석하고 있어요... ✨</span>
      </div>
    `;
  }

  if (aiError) {
    return `
      <div class="ai-card__error">
        <span class="ai-card__error-icon">⚠️</span>
        <span>AI 분석을 불러오지 못했습니다.<br><small style="color: var(--text-muted);">${aiError.message || ''}</small></span>
        <button class="btn btn-ghost btn-sm" style="margin-top: 10px;" id="btn-retry-ai">다시 시도 🔄</button>
      </div>
    `;
  }

  // 마크다운 줄바꿈 변환 헬퍼
  const formattedContent = cachedAiAnalysis
    ? cachedAiAnalysis.replace(/\n/g, '<br>')
    : '가계 통계 데이터가 부족하여 분석을 시작할 수 없습니다.';

  return `
    <div class="ai-card__header">
      <div class="ai-card__bot-profile">
        <span class="ai-card__avatar">🧙</span>
        <div>
          <span class="ai-card__name">AI 지니의 가계 진단</span>
          <span class="ai-card__badge">Local AI</span>
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" id="btn-refresh-ai" title="AI 재분석 요청">새로고침 🔄</button>
    </div>
    <div class="ai-card__content">
      ${formattedContent}
    </div>
  `;
}

/**
 * AI 분석 API 비동기 fetch
 */
async function fetchAiReport(container) {
  isAiLoading = true;
  aiError = null;
  cachedAiAnalysis = null;
  
  updateAiCardDOM(container);

  try {
    const report = await getAiAnalysis();
    cachedAiAnalysis = report;
  } catch (err) {
    aiError = err;
  } finally {
    isAiLoading = false;
    updateAiCardDOM(container);
  }
}

/**
 * AI 카드 부분 DOM 동적 업데이트
 */
function updateAiCardDOM(container) {
  const aiCard = container.querySelector('#ai-analysis-card');
  if (aiCard) {
    aiCard.innerHTML = renderAiAnalysisContent();
    // 렌더링 후 이벤트 바인딩 다시 처리
    aiCard.querySelector('#btn-retry-ai')?.addEventListener('click', () => fetchAiReport(container));
    aiCard.querySelector('#btn-refresh-ai')?.addEventListener('click', () => fetchAiReport(container));
  }
}

/**
 * 이벤트 바인딩
 */
function bindDashboardEvents(container) {
  // 전체 보기 클릭
  container.querySelector('[data-action="view-all-tx"]')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'transactions' }));
  });

  // AI 연동 수동 클릭 리스너들
  container.querySelector('#btn-retry-ai')?.addEventListener('click', () => fetchAiReport(container));
  container.querySelector('#btn-refresh-ai')?.addEventListener('click', () => fetchAiReport(container));
}

function renderCharts(multiMonth, stats, categories) {
  // 막대 차트
  const barData = {
    labels: multiMonth.map((m) => m.label),
    income: multiMonth.map((m) => m.totalIncome),
    expense: multiMonth.map((m) => m.totalExpense),
  };
  barChart = createBarChart('chart-bar', barData);

  // 도넛 차트 - 카테고리별 지출
  const categoryData = [];
  for (const [catName, amounts] of Object.entries(stats.byCategory)) {
    if (amounts.expense > 0) {
      const cat = categories.find((c) => c.name === catName);
      categoryData.push({
        label: catName,
        value: amounts.expense,
        color: cat?.color || '#636E72',
      });
    }
  }

  // 금액 기준 정렬
  categoryData.sort((a, b) => b.value - a.value);

  if (categoryData.length > 0) {
    doughnutChart = createDoughnutChart('chart-doughnut', {
      labels: categoryData.map((d) => d.label),
      values: categoryData.map((d) => d.value),
      colors: categoryData.map((d) => d.color),
    });
  } else {
    const canvas = document.getElementById('chart-doughnut');
    if (canvas) {
      const wrapper = canvas.parentElement;
      wrapper.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-title">데이터가 없습니다</div>
          <div class="empty-state-desc">이번 달 지출 내역을 추가하면 차트가 표시됩니다</div>
        </div>
      `;
    }
  }
}

function renderRecentTransactions(txs, categories) {
  if (txs.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">거래 내역이 없습니다</div>
        <div class="empty-state-desc">수입/지출을 추가해보세요</div>
      </div>
    `;
  }

  return txs
    .map((tx) => {
      const cat = categories.find((c) => c.name === tx.category);
      const icon = cat?.icon || '📦';
      const amountClass = tx.type === 'income' ? 'text-income' : 'text-expense';
      const sign = tx.type === 'income' ? '+' : '-';

      return `
        <div class="recent-tx-item">
          <div class="recent-tx-item__icon">${icon}</div>
          <div class="recent-tx-item__info">
            <div class="recent-tx-item__name">${tx.description}</div>
            <div class="recent-tx-item__meta">
              <span>${tx.date}</span>
              <span>${tx.category}</span>
            </div>
          </div>
          <div class="recent-tx-item__amount ${amountClass}">
            ${sign}${formatCurrency(tx.amount)}
          </div>
        </div>
      `;
    })
    .join('');
}

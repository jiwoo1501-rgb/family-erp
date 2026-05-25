/**
 * 숫자를 한국 원화 형식으로 포맷팅
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const absAmount = Math.abs(amount);
  return new Intl.NumberFormat('ko-KR').format(absAmount) + '원';
}

/**
 * 숫자를 부호와 함께 원화 형식으로 포맷팅
 * @param {number} amount
 * @param {string} type - 'income' | 'expense'
 * @returns {string}
 */
export function formatSignedCurrency(amount, type) {
  const formatted = formatCurrency(amount);
  return type === 'income' ? `+${formatted}` : `-${formatted}`;
}

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param {string} dateStr - YYYY-MM-DD 형식
 * @returns {string}
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 날짜를 짧은 형식으로 포맷팅
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateShort(dateStr) {
  const date = new Date(dateStr);
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 * @returns {string}
 */
export function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * 현재 월의 시작일과 종료일 반환
 * @param {number} year
 * @param {number} month - 0-indexed
 * @returns {{ start: string, end: string }}
 */
export function getMonthRange(year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * UUID 생성
 * @returns {string}
 */
export function generateId() {
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

/**
 * 퍼센트 변화율 계산
 * @param {number} current
 * @param {number} previous
 * @returns {number}
 */
export function calcChangePercent(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * 금액 축약 표현 (만원 단위)
 * @param {number} amount
 * @returns {string}
 */
export function formatCompact(amount) {
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(1) + '억';
  }
  if (amount >= 10000) {
    return (amount / 10000).toFixed(0) + '만';
  }
  return amount.toLocaleString();
}

/**
 * 디바운스 함수
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

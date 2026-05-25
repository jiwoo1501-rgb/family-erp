// 기본 지출 카테고리
export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'cat-e-1', name: '식비', type: 'expense', icon: '🍽️', color: '#FF6B6B' },
  { id: 'cat-e-2', name: '교통비', type: 'expense', icon: '🚗', color: '#4ECDC4' },
  { id: 'cat-e-3', name: '주거비', type: 'expense', icon: '🏠', color: '#45B7D1' },
  { id: 'cat-e-4', name: '통신비', type: 'expense', icon: '📱', color: '#96CEB4' },
  { id: 'cat-e-5', name: '의료비', type: 'expense', icon: '🏥', color: '#FFEAA7' },
  { id: 'cat-e-6', name: '교육비', type: 'expense', icon: '📚', color: '#DDA0DD' },
  { id: 'cat-e-7', name: '문화/여가', type: 'expense', icon: '🎬', color: '#74B9FF' },
  { id: 'cat-e-8', name: '의류', type: 'expense', icon: '👕', color: '#FD79A8' },
  { id: 'cat-e-9', name: '생활용품', type: 'expense', icon: '🧴', color: '#A29BFE' },
  { id: 'cat-e-10', name: '보험', type: 'expense', icon: '🛡️', color: '#00B894' },
  { id: 'cat-e-11', name: '저축/투자', type: 'expense', icon: '💰', color: '#FDCB6E' },
  { id: 'cat-e-12', name: '기타지출', type: 'expense', icon: '📦', color: '#636E72' },
];

// 기본 수입 카테고리
export const DEFAULT_INCOME_CATEGORIES = [
  { id: 'cat-i-1', name: '급여', type: 'income', icon: '💼', color: '#00B894' },
  { id: 'cat-i-2', name: '부수입', type: 'income', icon: '💵', color: '#00CEC9' },
  { id: 'cat-i-3', name: '용돈', type: 'income', icon: '🎁', color: '#6C5CE7' },
  { id: 'cat-i-4', name: '이자수입', type: 'income', icon: '🏦', color: '#0984E3' },
  { id: 'cat-i-5', name: '기타수입', type: 'income', icon: '✨', color: '#A29BFE' },
];

// 기본 가족 구성원
export const DEFAULT_MEMBERS = [
  { id: 'member-1', name: '아빠', avatar: '👨', color: '#6C5CE7' },
  { id: 'member-2', name: '엄마', avatar: '👩', color: '#FD79A8' },
  { id: 'member-3', name: '자녀1', avatar: '👦', color: '#00B894' },
  { id: 'member-4', name: '자녀2', avatar: '👧', color: '#FDCB6E' },
];

// 이모지 팔레트
export const EMOJI_LIST = [
  '🍽️', '🚗', '🏠', '📱', '🏥', '📚', '🎬', '👕', '🧴', '🛡️', '💰', '📦',
  '💼', '💵', '🎁', '🏦', '✨', '🎵', '🎮', '⚽', '✈️', '🎂', '☕', '🍕',
  '🛒', '💊', '🔧', '🎓', '💻', '📰', '🏋️', '🐕', '👶', '💍', '🎪', '🌊',
  '🍺', '🧹', '⛽', '🅿️', '💇', '🎨', '📮', '🔌', '💡', '🚿', '🧊', '🌱',
];

// 색상 팔레트
export const COLOR_PALETTE = [
  '#FF6B6B', '#FD79A8', '#FDCB6E', '#FFEAA7',
  '#00B894', '#00CEC9', '#4ECDC4', '#74B9FF',
  '#0984E3', '#6C5CE7', '#A29BFE', '#DDA0DD',
  '#45B7D1', '#96CEB4', '#636E72', '#2D3436',
];

// 월 이름
export const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
];

// 네비게이션 메뉴
export const NAV_ITEMS = [
  { id: 'dashboard', label: '대시보드', icon: '📊' },
  { id: 'transactions', label: '수입/지출', icon: '💳' },
  { id: 'pdf-upload', label: 'PDF 분석', icon: '📄' },
  { id: 'categories', label: '카테고리', icon: '🏷️' },
  { id: 'settings', label: '설정', icon: '⚙️' },
];

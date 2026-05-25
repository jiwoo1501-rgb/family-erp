import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_MEMBERS,
} from '../utils/constants.js';
import { generateId } from '../utils/formatters.js';
import { syncMutation } from '../utils/supabase-service.js';

const STORAGE_KEY = 'family-erp-data';

/**
 * LocalStorage 기반 데이터 스토어
 */
class Store {
  constructor() {
    this.data = this._load();
    this._listeners = [];
  }

  /**
   * LocalStorage에서 데이터 로드
   */
  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('데이터 로드 실패:', e);
    }
    return this._getDefaultData();
  }

  /**
   * 기본 데이터 구조
   */
  _getDefaultData() {
    return {
      transactions: [],
      categories: [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES],
      members: [...DEFAULT_MEMBERS],
      settings: {
        theme: 'light',
        currency: 'KRW',
        ollamaEndpoint: '/api/ollama',
        ollamaModel: 'gemma4:e2b',
        supabaseUrl: '',
        supabaseKey: '',
      },
    };
  }

  /**
   * LocalStorage에 저장
   */
  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this._notify();
    } catch (e) {
      console.error('데이터 저장 실패:', e);
    }
  }

  /**
   * 변경 리스너 등록
   */
  subscribe(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== fn);
    };
  }

  /**
   * 변경 알림
   */
  _notify() {
    this._listeners.forEach((fn) => fn(this.data));
  }

  // ========== 거래 내역 ==========

  getTransactions(filters = {}) {
    let items = [...this.data.transactions];

    if (filters.type) {
      items = items.filter((t) => t.type === filters.type);
    }
    if (filters.category) {
      items = items.filter((t) => t.category === filters.category);
    }
    if (filters.member) {
      items = items.filter((t) => t.member === filters.member);
    }
    if (filters.startDate) {
      items = items.filter((t) => t.date >= filters.startDate);
    }
    if (filters.endDate) {
      items = items.filter((t) => t.date <= filters.endDate);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (t.memo && t.memo.toLowerCase().includes(q))
      );
    }

    // 기본 정렬: 최신순
    items.sort((a, b) => {
      if (filters.sortBy === 'amount') {
        return filters.sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      return filters.sortDir === 'asc'
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date);
    });

    return items;
  }

  addTransaction(transaction) {
    const newTx = {
      ...transaction,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    this.data.transactions.push(newTx);
    this._save();
    syncMutation('transactions', 'insert', null, newTx);
    return newTx;
  }

  addTransactions(transactions) {
    const newTxs = transactions.map((t) => ({
      ...t,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }));
    this.data.transactions.push(...newTxs);
    this._save();
    syncMutation('transactions', 'insert', null, newTxs);
    return newTxs;
  }

  updateTransaction(id, updates) {
    const idx = this.data.transactions.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.data.transactions[idx] = { ...this.data.transactions[idx], ...updates };
      this._save();
      syncMutation('transactions', 'update', id, this.data.transactions[idx]);
      return this.data.transactions[idx];
    }
    return null;
  }

  deleteTransaction(id) {
    this.data.transactions = this.data.transactions.filter((t) => t.id !== id);
    this._save();
    syncMutation('transactions', 'delete', id, null);
  }

  // ========== 카테고리 ==========

  getCategories(type) {
    if (type) {
      return this.data.categories.filter((c) => c.type === type);
    }
    return [...this.data.categories];
  }

  getCategoryByName(name) {
    return this.data.categories.find((c) => c.name === name);
  }

  addCategory(category) {
    const newCat = { ...category, id: generateId() };
    this.data.categories.push(newCat);
    this._save();
    syncMutation('categories', 'insert', null, newCat);
    return newCat;
  }

  updateCategory(id, updates) {
    const idx = this.data.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
      this._save();
      syncMutation('categories', 'update', id, this.data.categories[idx]);
      return this.data.categories[idx];
    }
    return null;
  }

  deleteCategory(id) {
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    this._save();
    syncMutation('categories', 'delete', id, null);
  }

  // ========== 가족 구성원 ==========

  getMembers() {
    return [...this.data.members];
  }

  addMember(member) {
    const newMember = { ...member, id: generateId() };
    this.data.members.push(newMember);
    this._save();
    syncMutation('members', 'insert', null, newMember);
    return newMember;
  }

  updateMember(id, updates) {
    const idx = this.data.members.findIndex((m) => m.id === id);
    if (idx !== -1) {
      this.data.members[idx] = { ...this.data.members[idx], ...updates };
      this._save();
      syncMutation('members', 'update', id, this.data.members[idx]);
      return this.data.members[idx];
    }
    return null;
  }

  deleteMember(id) {
    this.data.members = this.data.members.filter((m) => m.id !== id);
    this._save();
    syncMutation('members', 'delete', id, null);
  }

  // ========== 설정 ==========

  getSettings() {
    return {
      theme: 'light',
      currency: 'KRW',
      ollamaEndpoint: '/api/ollama',
      ollamaModel: 'gemma4:e2b',
      supabaseUrl: '',
      supabaseKey: '',
      ...this.data.settings,
    };
  }

  updateSettings(updates) {
    this.data.settings = { ...this.data.settings, ...updates };
    this._save();
  }

  // ========== 통계 ==========

  getMonthlyStats(year, month) {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;

    const monthTxs = this.data.transactions.filter(
      (t) => t.date >= startDate && t.date <= endDate
    );

    const totalIncome = monthTxs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthTxs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // 카테고리별 합계
    const byCategory = {};
    monthTxs.forEach((t) => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = { income: 0, expense: 0 };
      }
      byCategory[t.category][t.type] += t.amount;
    });

    // 구성원별 합계
    const byMember = {};
    monthTxs.forEach((t) => {
      if (!byMember[t.member]) {
        byMember[t.member] = { income: 0, expense: 0 };
      }
      byMember[t.member][t.type] += t.amount;
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byCategory,
      byMember,
      transactionCount: monthTxs.length,
    };
  }

  getMultiMonthStats(months = 6) {
    const now = new Date();
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const stats = this.getMonthlyStats(d.getFullYear(), d.getMonth());
      results.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: `${d.getMonth() + 1}월`,
        ...stats,
      });
    }

    return results;
  }

  // ========== 데이터 관리 ==========

  exportData() {
    return JSON.stringify(this.data, null, 2);
  }

  importData(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.transactions && parsed.categories && parsed.members) {
        this.data = parsed;
        this._save();
        return true;
      }
      return false;
    } catch (e) {
      console.error('데이터 가져오기 실패:', e);
      return false;
    }
  }

  resetData() {
    this.data = this._getDefaultData();
    this._save();
  }
}

// 싱글턴 인스턴스
export const store = new Store();

import { store } from '../store/store.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { EMOJI_LIST, COLOR_PALETTE } from '../utils/constants.js';
import { pushLocalToCloud, pullCloudToLocal } from '../utils/supabase-service.js';

/**
 * 설정 뷰 렌더링
 */
export function renderSettings(container) {
  const members = store.getMembers();
  const settings = store.getSettings();

  container.innerHTML = `
    <div class="page-header">
      <h1>설정</h1>
      <p>가족 구성원 및 데이터를 관리하세요</p>
    </div>

    <div style="display: grid; gap: var(--space-lg); max-width: 800px;">

      <!-- 로컬 AI (Ollama) 설정 -->
      <div class="card animate-fade-in stagger-1">
        <div class="card-header">
          <h2>🧙 로컬 AI (Ollama) 설정</h2>
        </div>
        <div style="display: flex; flex-direction: column; gap: var(--space-md);">
          <div class="form-group">
            <label class="form-label">Ollama API 주소</label>
            <input type="url" class="form-input" id="ollama-endpoint" value="${settings.ollamaEndpoint || ''}" placeholder="예: http://localhost:11434 또는 /api/ollama">
            <span style="font-size: var(--font-size-xs); color: var(--text-muted); display: block; margin-top: 4px;">아이폰 앱 빌드 시 맥북의 IP 주소를 입력해야 통신이 가능합니다. (예: http://192.168.0.5:11434)</span>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Ollama 모델명</label>
            <input type="text" class="form-input" id="ollama-model" value="${settings.ollamaModel || ''}" placeholder="예: gemma4:e2b 또는 gemma2:2b">
          </div>
          <div style="display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-sm);">
            <button class="btn btn-ghost btn-sm" id="btn-test-ollama">연동 테스트 🔄</button>
            <button class="btn btn-primary btn-sm" id="btn-save-ollama">저장하기 💾</button>
          </div>
        </div>
      </div>

      <!-- 실시간 클라우드 DB 연동 (Supabase) -->
      <div class="card animate-fade-in stagger-2">
        <div class="card-header">
          <h2>☁️ 실시간 클라우드 DB 연동 (Supabase)</h2>
        </div>
        <div style="display: flex; flex-direction: column; gap: var(--space-md);">
          <div class="form-group">
            <label class="form-label">Supabase URL</label>
            <input type="url" class="form-input" id="supabase-url" value="${settings.supabaseUrl || ''}" placeholder="예: https://xxxx.supabase.co">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Supabase Anon Key</label>
            <input type="password" class="form-input" id="supabase-key" value="${settings.supabaseKey || ''}" placeholder="API Key 입력">
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-sm); gap: var(--space-sm); flex-wrap: wrap;">
            <div style="display: flex; gap: var(--space-xs);">
              <button class="btn btn-ghost btn-sm" id="btn-push-db" title="로컬 데이터를 클라우드로 일방 저장">클라우드로 밀어넣기 📤</button>
              <button class="btn btn-ghost btn-sm" id="btn-pull-db" title="클라우드 데이터를 로컬로 가져오기">클라우드에서 가져오기 📥</button>
            </div>
            <div style="display: flex; gap: var(--space-xs);">
              <button class="btn btn-ghost btn-sm" id="btn-test-supabase">연동 테스트 🔄</button>
              <button class="btn btn-primary btn-sm" id="btn-save-supabase">저장하기 💾</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 가족 구성원 -->
      <div class="card animate-fade-in stagger-3">
        <div class="card-header">
          <h2>👨‍👩‍👧‍👦 가족 구성원</h2>
          <button class="btn btn-primary btn-sm" id="btn-add-member">+ 추가</button>
        </div>
        <div id="members-list">
          ${renderMembersList(members)}
        </div>
      </div>

      <!-- 데이터 관리 -->
      <div class="card animate-fade-in stagger-2">
        <div class="card-header">
          <h2>💾 데이터 관리</h2>
        </div>
        <div style="display: flex; flex-direction: column; gap: var(--space-md);">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-md); background: var(--bg-glass); border-radius: var(--radius-sm);">
            <div>
              <div style="font-weight: 500; font-size: var(--font-size-sm);">데이터 내보내기</div>
              <div style="font-size: var(--font-size-xs); color: var(--text-muted);">모든 거래, 카테고리, 구성원 데이터를 JSON 파일로 저장합니다</div>
            </div>
            <button class="btn btn-ghost btn-sm" id="btn-export">📥 내보내기</button>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-md); background: var(--bg-glass); border-radius: var(--radius-sm);">
            <div>
              <div style="font-weight: 500; font-size: var(--font-size-sm);">데이터 가져오기</div>
              <div style="font-size: var(--font-size-xs); color: var(--text-muted);">이전에 내보낸 JSON 파일에서 데이터를 복원합니다</div>
            </div>
            <button class="btn btn-ghost btn-sm" id="btn-import">📤 가져오기</button>
            <input type="file" id="import-file" accept=".json" style="display: none;">
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-md); background: rgba(255, 107, 107, 0.05); border: 1px solid rgba(255, 107, 107, 0.1); border-radius: var(--radius-sm);">
            <div>
              <div style="font-weight: 500; font-size: var(--font-size-sm); color: var(--color-expense);">데이터 초기화</div>
              <div style="font-size: var(--font-size-xs); color: var(--text-muted);">모든 데이터를 삭제하고 기본값으로 초기화합니다</div>
            </div>
            <button class="btn btn-danger btn-sm" id="btn-reset">⚠️ 초기화</button>
          </div>
        </div>
      </div>

      <!-- 샘플 데이터 -->
      <div class="card animate-fade-in stagger-3">
        <div class="card-header">
          <h2>🧪 샘플 데이터</h2>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-md); background: var(--bg-glass); border-radius: var(--radius-sm);">
          <div>
            <div style="font-weight: 500; font-size: var(--font-size-sm);">샘플 데이터 생성</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-muted);">테스트용 샘플 거래 데이터를 생성합니다 (최근 3개월)</div>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-sample">🎲 생성</button>
        </div>
      </div>

      <!-- 앱 정보 -->
      <div class="card animate-fade-in stagger-4">
        <div class="card-header">
          <h2>ℹ️ 앱 정보</h2>
        </div>
        <div style="font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 2;">
          <div><strong>우리가족 ERP</strong> v1.0.0</div>
          <div>데이터 저장: 브라우저 LocalStorage</div>
          <div>총 거래 수: ${store.getTransactions({}).length}건</div>
          <div>카테고리 수: ${store.getCategories().length}개</div>
        </div>
      </div>
    </div>
  `;

  // AI 설정 저장
  document.getElementById('btn-save-ollama').addEventListener('click', () => {
    const endpoint = document.getElementById('ollama-endpoint').value.trim();
    const model = document.getElementById('ollama-model').value.trim();
    
    if (!endpoint || !model) {
      showToast('주소와 모델명을 모두 입력해주세요', 'warning');
      return;
    }
    
    store.updateSettings({
      ollamaEndpoint: endpoint,
      ollamaModel: model
    });
    
    showToast('AI 설정이 저장되었습니다', 'success');
  });

  // AI 연동 테스트
  document.getElementById('btn-test-ollama').addEventListener('click', async () => {
    let endpoint = document.getElementById('ollama-endpoint').value.trim();
    const model = document.getElementById('ollama-model').value.trim();
    
    if (!endpoint || !model) {
      showToast('주소와 모델명을 모두 입력해주세요', 'warning');
      return;
    }
    
    const testBtn = document.getElementById('btn-test-ollama');
    testBtn.disabled = true;
    testBtn.textContent = '테스트 중...';
    
    if (endpoint.endsWith('/')) {
      endpoint = endpoint.slice(0, -1);
    }
    
    try {
      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: 'Hi',
          stream: false
        })
      });
      
      if (response.ok) {
        showToast('Ollama AI와 성공적으로 연결되었습니다!', 'success');
      } else {
        showToast(`연결 실패: HTTP ${response.status}`, 'error');
      }
    } catch (err) {
      showToast('연결 실패: 주소 및 Ollama 실행 여부를 확인하세요', 'error');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = '연동 테스트 🔄';
    }
  });

  // Supabase 설정 저장
  document.getElementById('btn-save-supabase').addEventListener('click', () => {
    const url = document.getElementById('supabase-url').value.trim();
    const key = document.getElementById('supabase-key').value.trim();

    store.updateSettings({
      supabaseUrl: url,
      supabaseKey: key
    });

    showToast('클라우드 DB 설정이 저장되었습니다', 'success');
  });

  // Supabase 연동 테스트
  document.getElementById('btn-test-supabase').addEventListener('click', async () => {
    const url = document.getElementById('supabase-url').value.trim();
    const key = document.getElementById('supabase-key').value.trim();

    if (!url || !key) {
      showToast('URL과 API Key를 모두 입력해주세요', 'warning');
      return;
    }

    const testBtn = document.getElementById('btn-test-supabase');
    testBtn.disabled = true;
    testBtn.textContent = '테스트 중...';

    let cleanUrl = url;
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }

    try {
      const response = await fetch(`${cleanUrl}/rest/v1/transactions?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });

      if (response.ok) {
        showToast('클라우드 DB 연결 성공!', 'success');
      } else {
        showToast(`연결 실패: HTTP ${response.status}`, 'error');
      }
    } catch (err) {
      showToast('연결 실패: 주소 및 키값을 확인하세요', 'error');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = '연동 테스트 🔄';
    }
  });

  // 클라우드로 밀어넣기
  document.getElementById('btn-push-db').addEventListener('click', async () => {
    const confirmed = await confirmDialog({
      title: '데이터 업로드 (Push)',
      message: '현재 로컬 가계부 데이터가 클라우드 DB에 통째로 덮어씌워집니다. 계속하시겠습니까?',
      confirmText: '업로드',
    });

    if (confirmed) {
      const pushBtn = document.getElementById('btn-push-db');
      pushBtn.disabled = true;
      pushBtn.textContent = '업로드 중...';
      try {
        await pushLocalToCloud();
        showToast('로컬 데이터를 성공적으로 클라우드에 업로드했습니다!', 'success');
      } catch (err) {
        showToast(`업로드 실패: ${err.message}`, 'error');
      } finally {
        pushBtn.disabled = false;
        pushBtn.textContent = '클라우드로 밀어넣기 📤';
      }
    }
  });

  // 클라우드에서 가져오기
  document.getElementById('btn-pull-db').addEventListener('click', async () => {
    const confirmed = await confirmDialog({
      title: '데이터 다운로드 (Pull)',
      message: '현재 로컬의 가계부 데이터가 지워지고 클라우드 DB에 저장된 내역으로 대체됩니다. 계속하시겠습니까?',
      confirmText: '다운로드',
      danger: true
    });

    if (confirmed) {
      const pullBtn = document.getElementById('btn-pull-db');
      pullBtn.disabled = true;
      pullBtn.textContent = '다운로드 중...';
      try {
        await pullCloudToLocal();
        showToast('클라우드 데이터를 로컬 가계부에 성공적으로 덮어썼습니다!', 'success');
        renderSettings(container);
      } catch (err) {
        showToast(`다운로드 실패: ${err.message}`, 'error');
      } finally {
        pullBtn.disabled = false;
        pullBtn.textContent = '클라우드에서 가져오기 📥';
      }
    }
  });

  // 구성원 추가
  document.getElementById('btn-add-member').addEventListener('click', () => {
    openMemberForm(null, () => refreshMembers());
  });

  // 내보내기
  document.getElementById('btn-export').addEventListener('click', () => {
    const data = store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-erp-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('데이터가 내보내기되었습니다', 'success');
  });

  // 가져오기
  const importFile = document.getElementById('import-file');
  document.getElementById('btn-import').addEventListener('click', () => {
    importFile.click();
  });
  importFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const confirmed = await confirmDialog({
      title: '데이터 가져오기',
      message: '현재 데이터가 모두 대체됩니다. 계속하시겠습니까?',
      confirmText: '가져오기',
    });

    if (confirmed) {
      const text = await file.text();
      const success = store.importData(text);
      if (success) {
        showToast('데이터가 성공적으로 가져왔습니다', 'success');
        renderSettings(container);
      } else {
        showToast('올바르지 않은 파일 형식입니다', 'error');
      }
    }
  });

  // 초기화
  document.getElementById('btn-reset').addEventListener('click', async () => {
    const confirmed = await confirmDialog({
      title: '데이터 초기화',
      message: '모든 거래 내역, 카테고리, 구성원 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
      confirmText: '초기화',
      danger: true,
    });

    if (confirmed) {
      store.resetData();
      showToast('데이터가 초기화되었습니다', 'info');
      renderSettings(container);
    }
  });

  // 샘플 데이터
  document.getElementById('btn-sample').addEventListener('click', () => {
    generateSampleData();
    showToast('샘플 데이터가 생성되었습니다!', 'success');
    renderSettings(container);
  });

  function refreshMembers() {
    const updatedMembers = store.getMembers();
    document.getElementById('members-list').innerHTML = renderMembersList(updatedMembers);
    bindMemberEvents();
  }

  function bindMemberEvents() {
    document.querySelectorAll('[data-member-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const member = store.getMembers().find((m) => m.id === btn.dataset.memberEdit);
        if (member) openMemberForm(member, () => refreshMembers());
      });
    });

    document.querySelectorAll('[data-member-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const confirmed = await confirmDialog({
          title: '구성원 삭제',
          message: '이 구성원을 삭제하시겠습니까?',
          confirmText: '삭제',
          danger: true,
        });
        if (confirmed) {
          store.deleteMember(btn.dataset.memberDelete);
          showToast('구성원이 삭제되었습니다', 'info');
          refreshMembers();
        }
      });
    });
  }

  bindMemberEvents();
}

function renderMembersList(members) {
  if (members.length === 0) {
    return '<div class="empty-state"><div class="empty-state-desc">구성원이 없습니다</div></div>';
  }

  return members
    .map(
      (m) => `
    <div style="display: flex; align-items: center; gap: var(--space-md); padding: var(--space-md); border-radius: var(--radius-sm); transition: background 0.2s;" class="member-row">
      <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.3rem; background: ${m.color}20; border: 2px solid ${m.color}40;">
        ${m.avatar}
      </div>
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: var(--font-size-sm);">${m.name}</div>
      </div>
      <div style="display: flex; gap: var(--space-xs);">
        <button class="tx-action-btn" data-member-edit="${m.id}" title="수정">✏️</button>
        <button class="tx-action-btn tx-action-btn--delete" data-member-delete="${m.id}" title="삭제">🗑️</button>
      </div>
    </div>
  `
    )
    .join('');
}

function openMemberForm(editMember, onSave) {
  const isEdit = !!editMember;
  const title = isEdit ? '구성원 수정' : '구성원 추가';

  const avatars = ['👨', '👩', '👦', '👧', '👴', '👵', '🧑', '👶', '🐕', '🐈'];
  let selectedAvatar = editMember?.avatar || '🧑';
  let selectedColor = editMember?.color || COLOR_PALETTE[0];

  const content = document.createElement('div');
  content.innerHTML = `
    <form id="member-form">
      <div class="form-group">
        <label class="form-label">이름 *</label>
        <input type="text" class="form-input" id="member-name" value="${editMember?.name || ''}" placeholder="구성원 이름" required>
      </div>

      <div class="form-group">
        <label class="form-label">아바타</label>
        <div class="emoji-picker" style="grid-template-columns: repeat(5, 1fr);">
          ${avatars.map((a) => `<button type="button" class="emoji-option ${a === selectedAvatar ? 'selected' : ''}" data-avatar="${a}">${a}</button>`).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">색상</label>
        <div class="color-picker">
          ${COLOR_PALETTE.map((c) => `<button type="button" class="color-option ${c === selectedColor ? 'selected' : ''}" data-color="${c}" style="background: ${c}"></button>`).join('')}
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg);">
        <button type="button" class="btn btn-ghost" id="member-cancel">취소</button>
        <button type="submit" class="btn btn-primary">${isEdit ? '수정' : '추가'}</button>
      </div>
    </form>
  `;

  const { close } = openModal({ title, content, size: 'sm' });

  content.querySelectorAll('[data-avatar]').forEach((btn) => {
    btn.addEventListener('click', () => {
      content.querySelectorAll('[data-avatar]').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedAvatar = btn.dataset.avatar;
    });
  });

  content.querySelectorAll('.color-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      content.querySelectorAll('.color-option').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedColor = btn.dataset.color;
    });
  });

  content.querySelector('#member-cancel').addEventListener('click', close);

  content.querySelector('#member-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {
      name: document.getElementById('member-name').value.trim(),
      avatar: selectedAvatar,
      color: selectedColor,
    };

    if (isEdit) {
      store.updateMember(editMember.id, data);
      showToast('구성원이 수정되었습니다', 'success');
    } else {
      store.addMember(data);
      showToast('구성원이 추가되었습니다', 'success');
    }

    close();
    if (onSave) onSave();
  });
}

/**
 * 샘플 데이터 생성
 */
function generateSampleData() {
  const members = store.getMembers();
  const expenseCats = store.getCategories('expense');
  const incomeCats = store.getCategories('income');

  const now = new Date();
  const sampleTransactions = [];

  // 최근 3개월 데이터 생성
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const year = now.getFullYear();
    const month = now.getMonth() - monthOffset;
    const d = new Date(year, month, 1);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

    // 수입 (매월 2-3건)
    const incomeCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < incomeCount; i++) {
      const cat = incomeCats[Math.floor(Math.random() * incomeCats.length)];
      const member = members[Math.floor(Math.random() * members.length)];
      const day = Math.min(25, 1 + Math.floor(Math.random() * 28));

      sampleTransactions.push({
        type: 'income',
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        amount: (1000000 + Math.floor(Math.random() * 4000000)),
        description: cat.name === '급여' ? '월급' : cat.name === '부수입' ? '프리랜서 수입' : cat.name,
        category: cat.name,
        member: member?.name || '',
        memo: '',
      });
    }

    // 지출 (매월 15-25건)
    const expenseCount = 15 + Math.floor(Math.random() * 11);
    const descriptions = {
      '식비': ['점심식사', '저녁식사', '스타벅스', '편의점', '마트 장보기', '배달음식', '카페'],
      '교통비': ['주유', '택시', '교통카드 충전', '주차비', '하이패스'],
      '주거비': ['관리비', '전기요금', '수도요금', '가스비'],
      '통신비': ['핸드폰 요금', '인터넷 요금'],
      '의료비': ['병원', '약국'],
      '교육비': ['학원비', '교재비', '온라인 강의'],
      '문화/여가': ['영화', '넷플릭스', '운동', '여행'],
      '의류': ['옷 구매', '신발 구매'],
      '생활용품': ['다이소', '올리브영', '생활용품'],
      '보험': ['보험료'],
      '저축/투자': ['적금'],
      '기타지출': ['기타'],
    };

    for (let i = 0; i < expenseCount; i++) {
      const cat = expenseCats[Math.floor(Math.random() * expenseCats.length)];
      const member = members[Math.floor(Math.random() * members.length)];
      const day = 1 + Math.floor(Math.random() * daysInMonth);
      const descs = descriptions[cat.name] || ['기타'];
      const desc = descs[Math.floor(Math.random() * descs.length)];

      let amount;
      switch (cat.name) {
        case '식비': amount = 5000 + Math.floor(Math.random() * 45000); break;
        case '교통비': amount = 3000 + Math.floor(Math.random() * 80000); break;
        case '주거비': amount = 100000 + Math.floor(Math.random() * 400000); break;
        case '통신비': amount = 30000 + Math.floor(Math.random() * 70000); break;
        case '의료비': amount = 5000 + Math.floor(Math.random() * 100000); break;
        case '교육비': amount = 100000 + Math.floor(Math.random() * 500000); break;
        case '문화/여가': amount = 10000 + Math.floor(Math.random() * 100000); break;
        case '의류': amount = 20000 + Math.floor(Math.random() * 200000); break;
        case '생활용품': amount = 5000 + Math.floor(Math.random() * 50000); break;
        case '보험': amount = 100000 + Math.floor(Math.random() * 200000); break;
        case '저축/투자': amount = 200000 + Math.floor(Math.random() * 800000); break;
        default: amount = 5000 + Math.floor(Math.random() * 50000);
      }

      // 1000원 단위로 반올림
      amount = Math.round(amount / 1000) * 1000;

      sampleTransactions.push({
        type: 'expense',
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        amount,
        description: desc,
        category: cat.name,
        member: member?.name || '',
        memo: '',
      });
    }
  }

  store.addTransactions(sampleTransactions);
}

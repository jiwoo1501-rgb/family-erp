/**
 * Supabase 연동 상태 검증 (순환 참조 방지를 위해 store를 dynamic import로 로드)
 */
export async function isSupabaseConfigured() {
  const { store } = await import('../store/store.js');
  const settings = store.getSettings();
  return !!(settings.supabaseUrl && settings.supabaseKey);
}

/**
 * Supabase REST API 공통 호출 헬퍼
 */
async function callSupabase(table, path = '', options = {}) {
  const { store } = await import('../store/store.js');
  const settings = store.getSettings();
  if (!settings.supabaseUrl || !settings.supabaseKey) {
    throw new Error('Supabase 설정이 구성되지 않았습니다.');
  }

  let baseUrl = settings.supabaseUrl;
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  const url = `${baseUrl}/rest/v1/${table}${path}`;

  const headers = {
    'apikey': settings.supabaseKey,
    'Authorization': `Bearer ${settings.supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase API 오류 (${response.status}): ${errorText}`);
  }

  return response.status === 204 ? null : await response.json();
}

/**
 * 실시간 변경 동기화 (CRUD)
 */
export async function syncMutation(table, action, id, data) {
  const isConfigured = await isSupabaseConfigured();
  if (!isConfigured) return;

  try {
    switch (action) {
      case 'insert':
        await callSupabase(table, '', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        break;
      case 'update':
        await callSupabase(table, `?id=eq.${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        break;
      case 'delete':
        await callSupabase(table, `?id=eq.${id}`, {
          method: 'DELETE',
        });
        break;
    }
  } catch (err) {
    console.error(`Supabase 실시간 동기화 실패 (${table} - ${action}):`, err);
  }
}

/**
 * 로컬 데이터를 Supabase로 일괄 업로드 (Push)
 */
export async function pushLocalToCloud() {
  const isConfigured = await isSupabaseConfigured();
  if (!isConfigured) {
    throw new Error('Supabase 설정 정보를 먼저 입력해 주세요.');
  }

  const { store } = await import('../store/store.js');
  const localData = store._load(); // store에서 원본 데이터 획득

  // 1. 기존 데이터 삭제 (Clean)
  await callSupabase('transactions', '?id=not.is.null', { method: 'DELETE' }).catch(() => {});
  await callSupabase('categories', '?id=not.is.null', { method: 'DELETE' }).catch(() => {});
  await callSupabase('members', '?id=not.is.null', { method: 'DELETE' }).catch(() => {});

  // 2. 새 데이터 업로드 (Bulk Insert)
  if (localData.transactions && localData.transactions.length > 0) {
    await callSupabase('transactions', '', {
      method: 'POST',
      body: JSON.stringify(localData.transactions),
    });
  }

  if (localData.categories && localData.categories.length > 0) {
    await callSupabase('categories', '', {
      method: 'POST',
      body: JSON.stringify(localData.categories),
    });
  }

  if (localData.members && localData.members.length > 0) {
    await callSupabase('members', '', {
      method: 'POST',
      body: JSON.stringify(localData.members),
    });
  }
}

/**
 * Supabase에서 데이터를 가져와 로컬로 다운로드 (Pull)
 */
export async function pullCloudToLocal() {
  const isConfigured = await isSupabaseConfigured();
  if (!isConfigured) {
    throw new Error('Supabase 설정 정보를 먼저 입력해 주세요.');
  }

  // 1. 클라우드에서 각각 조회
  const transactions = await callSupabase('transactions', '?select=*', { method: 'GET' });
  const categories = await callSupabase('categories', '?select=*', { method: 'GET' });
  const members = await callSupabase('members', '?select=*', { method: 'GET' });

  // 2. 로컬 데이터 갱신
  const { store } = await import('../store/store.js');
  const currentData = store.data;
  currentData.transactions = transactions || [];
  currentData.categories = categories && categories.length > 0 ? categories : currentData.categories;
  currentData.members = members && members.length > 0 ? members : currentData.members;

  store._save(); // 로컬스토리지에 저장 및 리스너 알림
}

/**
 * 앱 구동 시 클라우드 데이터 백그라운드 자동 동기화
 */
export async function backgroundSync() {
  const isConfigured = await isSupabaseConfigured();
  if (!isConfigured) return;
  try {
    console.log('Supabase 클라우드 동기화 시작...');
    await pullCloudToLocal();
    console.log('Supabase 클라우드 동기화 성공!');
  } catch (err) {
    console.error('Supabase 백그라운드 동기화 실패:', err);
  }
}

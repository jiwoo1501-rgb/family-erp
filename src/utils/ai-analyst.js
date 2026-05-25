import { store } from '../store/store.js';

/**
 * 로컬 Ollama AI 가계 분석 비서
 */
export async function getAiAnalysis() {
  const settings = store.getSettings();
  
  // 데이터 불러오기
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const stats = store.getMonthlyStats(year, month);
  const categories = store.getCategories('expense');
  
  // 지출 카테고리 내역 요약 생성
  const categorySummary = [];
  for (const [catName, amounts] of Object.entries(stats.byCategory)) {
    if (amounts.expense > 0) {
      const cat = categories.find((c) => c.name === catName);
      const percent = ((amounts.expense / stats.totalExpense) * 100).toFixed(1);
      categorySummary.push(`${cat?.icon || '📦'} ${catName}: ${amounts.expense.toLocaleString()}원 (${percent}%)`);
    }
  }

  // 지출 상위 5개 거래 항목 추출
  const recentTxs = store.getTransactions({ type: 'expense' })
    .slice(0, 5)
    .map(t => `- ${t.description}: ${t.amount.toLocaleString()}원`);

  // 프롬프트 작성
  const systemPrompt = `당신은 '우리가족 ERP'의 귀여운 AI 가계부 비서 '지니(Genie)'입니다.
친근하고 사랑스러운 존댓말을 사용하고, 적절한 이모지를 듬뿍 활용하여 가족 가계 상황을 분석해주세요.
답변은 읽기 쉽도록 한 줄씩 띄어 쓰고, 마크다운(Markdown) 형식을 사용하여 명확히 단락을 구분하고 3줄~4줄 내외로 핵심만 압축해서 요약 조언을 작성해주세요.`;

  const userPrompt = `우리 가족의 이번 달(${month + 1}월) 가계 데이터는 다음과 같아.

[가계 요약]
- 이번 달 총 수입: ${stats.totalIncome.toLocaleString()}원
- 이번 달 총 지출: ${stats.totalExpense.toLocaleString()}원
- 이번 달 잔액(수입-지출): ${(stats.totalIncome - stats.totalExpense).toLocaleString()}원
- 총 거래 건수: ${stats.transactionCount}건

[카테고리별 지출]
${categorySummary.length > 0 ? categorySummary.join('\n') : '지출 내역 없음'}

[최근 주요 지출 항목]
${recentTxs.length > 0 ? recentTxs.join('\n') : '지출 내역 없음'}

위 데이터를 종합하여 우리 가족이 돈을 잘 쓰고 있는지 분석해주고, 따뜻하고 귀여운 말투로 실천 가능한 절약 조언이나 칭찬 1가지를 작성해줘!`;

  // 엔드포인트 URL 정제
  let baseUrl = settings.ollamaEndpoint;
  
  if (!baseUrl) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      baseUrl = '/api/ollama'; // 로컬 개발 환경용 프록시
    } else {
      throw new Error("웹 환경에서는 설정에서 Ollama API 주소(ngrok HTTPS 등)를 입력해야 합니다.");
    }
  }

  if (baseUrl.startsWith('/') && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    throw new Error("웹 환경에서는 상대경로(/api/ollama)를 사용할 수 없습니다. 전체 주소를 입력해주세요.");
  }
  
  if (baseUrl.startsWith('http://') && window.location.protocol === 'https:') {
    throw new Error("보안 연결(HTTPS) 환경에서는 http:// 주소를 사용할 수 없습니다. ngrok 등의 https 주소를 사용해주세요.");
  }

  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  const url = `${baseUrl}/api/generate`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        model: settings.ollamaModel || 'gemma4:e2b',
        prompt: userPrompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 405 || response.status === 404) {
        throw new Error(`주소 오류 (${response.status}): 설정에서 Ollama API 주소를 다시 확인해주세요.`);
      }
      throw new Error(`HTTP 에러! 상태코드: ${response.status}`);
    }

    const result = await response.json();
    return result.response;
  } catch (error) {
    console.error('Ollama AI 분석 실패:', error);
    // CORS나 혼합 콘텐츠(Mixed Content) 에러는 TypeError로 나타남
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error("네트워크 오류: Ollama 서버가 실행 중이 아니거나, CORS 설정(OLLAMA_ORIGINS=\"*\")이 필요합니다.");
    }
    throw error;
  }
}

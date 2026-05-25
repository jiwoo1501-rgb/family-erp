import * as pdfjsLib from 'pdfjs-dist';

// PDF.js 워커 설정
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * PDF 파일에서 텍스트를 추출
 * @param {File} file
 * @param {Function} onProgress - 진행률 콜백 (0~100)
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  const totalPages = pdf.numPages;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // 텍스트 항목을 Y좌표 기준으로 그룹핑하여 줄 단위로 정렬
    const items = textContent.items.filter((item) => item.str.trim());
    const lines = groupTextByLines(items);

    fullText += lines.map((line) => line.map((item) => item.str).join(' ')).join('\n');
    fullText += '\n';

    if (onProgress) {
      onProgress(Math.round((i / totalPages) * 100));
    }
  }

  return fullText;
}

/**
 * 텍스트 항목을 Y좌표 기준으로 줄 단위로 그룹핑
 */
function groupTextByLines(items) {
  if (items.length === 0) return [];

  // Y좌표로 정렬 (위에서 아래로)
  const sorted = [...items].sort((a, b) => {
    const yDiff = b.transform[5] - a.transform[5];
    if (Math.abs(yDiff) < 3) return a.transform[4] - b.transform[4]; // 같은 줄이면 X좌표로
    return yDiff;
  });

  const lines = [];
  let currentLine = [sorted[0]];
  let currentY = sorted[0].transform[5];

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (Math.abs(item.transform[5] - currentY) < 5) {
      currentLine.push(item);
    } else {
      // X좌표로 정렬 후 추가
      currentLine.sort((a, b) => a.transform[4] - b.transform[4]);
      lines.push(currentLine);
      currentLine = [item];
      currentY = item.transform[5];
    }
  }

  if (currentLine.length > 0) {
    currentLine.sort((a, b) => a.transform[4] - b.transform[4]);
    lines.push(currentLine);
  }

  return lines;
}

/**
 * 추출된 텍스트에서 거래 내역을 파싱
 * @param {string} text
 * @returns {Array<Object>}
 */
export function parseTransactions(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l);
  const transactions = [];

  // 여러 패턴을 시도
  for (const line of lines) {
    const tx = tryParseLine(line);
    if (tx) {
      transactions.push(tx);
    }
  }

  // 중복 제거 (같은 날짜, 금액, 설명)
  const unique = [];
  const seen = new Set();
  for (const tx of transactions) {
    const key = `${tx.date}-${tx.amount}-${tx.description}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(tx);
    }
  }

  return unique;
}

/**
 * 한 줄에서 거래 내역 파싱 시도
 */
function tryParseLine(line) {
  // 패턴 1: YYYY-MM-DD 또는 YYYY.MM.DD 또는 YYYY/MM/DD + 가맹점 + 금액
  const patterns = [
    // 2026-05-25 스타벅스 5,500
    /(\d{4}[-/.]\d{2}[-/.]\d{2})\s+(.+?)\s+([\d,]+)\s*원?\s*$/,
    // 2026.05.25 스타벅스 강남점 5,500원
    /(\d{4}[-/.]\d{2}[-/.]\d{2})\s+(.+?)\s+([\d,]+)원/,
    // 05/25 또는 05-25 스타벅스 5,500
    /(\d{2}[-/.]\d{2})\s+(.+?)\s+([\d,]+)\s*원?\s*$/,
    // 날짜 시간 가맹점 금액 (카드사 명세서 패턴)
    /(\d{4}[-/.]\d{2}[-/.]\d{2})\s+\d{2}:\d{2}(?::\d{2})?\s+(.+?)\s+([\d,]+)\s*원?\s*$/,
    // MM/DD HH:MM 가맹점 금액
    /(\d{2}[-/.]\d{2})\s+\d{2}:\d{2}\s+(.+?)\s+([\d,]+)\s*원?\s*$/,
    // 날짜 카드번호 가맹점 금액 (삼성/신한 패턴)
    /(\d{4}[-/.]\d{2}[-/.]\d{2})\s+\d{4}[-*]+\d{4}\s+(.+?)\s+([\d,]+)\s*원?\s*$/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      let dateStr = match[1];
      const description = match[2].trim();
      const amountStr = match[3].replace(/,/g, '');
      const amount = parseInt(amountStr, 10);

      // 금액이 너무 작거나 비정상적이면 건너뛰기
      if (amount < 100 || amount > 100000000 || isNaN(amount)) continue;

      // 설명이 너무 짧으면 건너뛰기
      if (description.length < 2) continue;

      // 날짜 정규화
      dateStr = normalizeDate(dateStr);
      if (!dateStr) continue;

      // 카테고리 추측
      const category = guessCategory(description);

      return {
        date: dateStr,
        description,
        amount,
        type: 'expense',
        category,
        member: '',
        memo: '',
        selected: true,
      };
    }
  }

  return null;
}

/**
 * 날짜 문자열 정규화 (YYYY-MM-DD 형식으로)
 */
function normalizeDate(dateStr) {
  // 구분자 통일
  const normalized = dateStr.replace(/[/.]/g, '-');
  const parts = normalized.split('-');

  if (parts.length === 3 && parts[0].length === 4) {
    // YYYY-MM-DD
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }

  if (parts.length === 2) {
    // MM-DD → 현재 연도 추가
    const year = new Date().getFullYear();
    return `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }

  return null;
}

/**
 * 가맹점명으로 카테고리 추측
 */
function guessCategory(description) {
  const desc = description.toLowerCase();

  const categoryMap = [
    { keywords: ['식당', '음식', '치킨', '피자', '맥도날드', '롯데리아', 'bbq', '교촌', '배달', '요기요', '배민', '쿠팡이츠', '카페', '스타벅스', '커피', '빽다방', '이디야', '투썸', '편의점', 'cu', 'gs25', '세븐일레', '미니스톱', '이마트24', '마트', '이마트', '홈플러스', '코스트코', '트레이더스', '하나로', '반찬', '빵', '베이커리', '분식'], category: '식비' },
    { keywords: ['주유', '주차', '톨게이트', '하이패스', '택시', '카카오택시', '버스', '지하철', '교통', 'ktx', '기차', '대리운전', '가솔린', '디젤'], category: '교통비' },
    { keywords: ['관리비', '월세', '전기', '수도', '가스', '아파트', '부동산'], category: '주거비' },
    { keywords: ['skt', 'kt', 'lg u+', '통신', '인터넷', '모바일', '핸드폰', '유플러스'], category: '통신비' },
    { keywords: ['병원', '약국', '의원', '치과', '안과', '피부과', '한의원', '약', '의료', '건강'], category: '의료비' },
    { keywords: ['학원', '교육', '강의', '수업', '학교', '유치원', '어린이집', '과외', '학습지', '교재', '인강'], category: '교육비' },
    { keywords: ['영화', 'cgv', '메가박스', '롯데시네마', '넷플릭스', '디즈니', '공연', '콘서트', '여행', '호텔', '펜션', '리조트', '항공', '놀이공원', '게임', '운동', '헬스', '골프', '스포츠', 'pc방'], category: '문화/여가' },
    { keywords: ['옷', '의류', '자라', '유니클로', 'h&m', '나이키', '아디다스', '무신사', '신발', '패션'], category: '의류' },
    { keywords: ['다이소', '생활용품', '세제', '샴푸', '화장품', '올리브영', '쿠팡', '위생', '청소'], category: '생활용품' },
    { keywords: ['보험', '삼성생명', '한화', '교보', 'db손해', '현대해상'], category: '보험' },
    { keywords: ['저축', '적금', '투자', '펀드', '주식', '증권', '은행'], category: '저축/투자' },
  ];

  for (const { keywords, category } of categoryMap) {
    if (keywords.some((kw) => desc.includes(kw))) {
      return category;
    }
  }

  return '기타지출';
}

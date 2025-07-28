// trade-data-example.js

/**
 * [파일 목적]
 * 구글 시트(아이템 시세)에서 거래 데이터를 fetch로 불러와 활용하는 예시.
 * (공개 시트이므로 인증 불필요)
 *
 * [데이터 형식]
 * 두 가지 형식이 혼재:
 * 1. 기존 형식 (2025.07.26 13:47:40까지): A,B,C열 (순번, 아이템, 가격)
 * 2. 새로운 형식 (2025.07.26 13:47:40 이후): A열 세로형 (거래 완료, 시간, 아이템 정보)
 *    - Google Sheets API는 빈 행을 제외하므로 실제 구조: 거래완료 → 시간 → 아이템정보
 *
 * [출력 예시]
 * (아래 export된 데이터 참고)
 *
 * [구글 시트 원본]
 * https://docs.google.com/spreadsheets/d/1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo/edit?gid=1489625214#gid=1489625214
 */

// fetch를 이용한 구글 시트 csv 데이터 불러오기 예시
// (실제 사용시 서버 또는 브라우저 환경에 맞게 fetch 사용)
export async function fetchTradeData() {
  const sheetId = '1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo';
  const gid = '1489625214'; // 아이템 시세 시트 GID
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const response = await fetch(url);
  const csv = await response.text();
  
  // robust CSV 파싱 (쉼표, 줄바꿈, 따옴표 모두 처리)
  function parseCSV(str) {
    const rows = [];
    let row = [];
    let val = '';
    let inQuotes = false;
    let i = 0;
    while (i < str.length) {
      const c = str[i];
      if (inQuotes) {
        if (c === '"') {
          if (str[i+1] === '"') { val += '"'; i++; }
          else inQuotes = false;
        } else {
          val += c;
        }
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(val); val = ''; }
        else if (c === '\n' || c === '\r') {
          if (val !== '' || row.length > 0) { row.push(val); rows.push(row); row = []; val = ''; }
          if (c === '\r' && str[i+1] === '\n') i++;
        } else {
          val += c;
        }
      }
      i++;
    }
    if (val !== '' || row.length > 0) { row.push(val); rows.push(row); }
    return rows;
  }
  
  const rows = parseCSV(csv);
  const tradeItems = [];
  
  // 데이터 형식 판별 및 파싱
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0) continue;
    
    const cellA = (row[0] || '').replace(/"/g, '').trim();
    
    // 새로운 형식: "거래 완료" 패턴 찾기
    if (cellA.includes('거래 완료')) {
      // 시간 정보 추출 (i+1 행)
      let timeStr = '';
      if (i + 1 < rows.length) {
        timeStr = (rows[i + 1][0] || '').replace(/"/g, '').trim();
      }
      
      // 아이템 정보 행 찾기 (i+2)
      if (i + 2 < rows.length) {
        const itemRow = rows[i + 2];
        if (itemRow.length > 0) {
          const itemText = (itemRow[0] || '').replace(/"/g, '').trim();
          
          // 가격 추출
          const priceMatch = itemText.match(/(\d{1,3}(?:,\d{3})*)\s*Gold/);
          if (priceMatch) {
            const priceStr = priceMatch[1].replace(/,/g, '');
            const price = parseInt(priceStr, 10);
            
            // 수량 처리
            let count = 1;
            const countMatch = itemText.match(/(\d+)개가/);
            if (countMatch) {
              count = parseInt(countMatch[1], 10);
            }
            
            // 아이템명 추출
            const itemMatch = itemText.match(/(.+?)(?:\s+\d+개가|\s+가\s+거래소에서|\s+가\s+)/);
            const itemName = itemMatch ? itemMatch[1].trim() : '';
            
            // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효)
            if (price && price > 90000 && price < 1000000000 && itemName) {
              tradeItems.push({
                timestamp: timeStr,
                item: itemName,
                count: count,
                price: price,
                unitPrice: Math.round(price / count),
                originalText: itemText,
                format: 'new'
              });
            }
          }
        }
      }
    }
    // 기존 형식: 순번, 아이템, 가격 형식
    else if (cellA.match(/^\d+$/) && row.length >= 3) {
      const sequence = parseInt(cellA, 10);
      const itemText = (row[1] || '').replace(/"/g, '').trim();
      const priceText = (row[2] || '').replace(/"/g, '').trim();
      
      // 가격 추출
      const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*)/);
      if (priceMatch) {
        const priceStr = priceMatch[1].replace(/,/g, '');
        const price = parseInt(priceStr, 10);
        
        // 수량 처리
        let count = 1;
        const countMatch = itemText.match(/x\s*(\d+)/);
        if (countMatch) {
          count = parseInt(countMatch[1], 10);
        }
        
        // 아이템명 추출
        const itemName = itemText.replace(/\s*x\s*\d+$/, '').trim();
        
        // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효)
        if (price && price > 90000 && price < 1000000000 && itemName) {
          tradeItems.push({
            sequence: sequence,
            item: itemName,
            count: count,
            price: price,
            unitPrice: Math.round(price / count),
            originalText: `${sequence}\t${itemText}\t${priceText}`,
            format: 'old'
          });
        }
      }
    }
  }
  
  // 시간순으로 정렬 (최신이 위로)
  tradeItems.sort((a, b) => {
    if (a.format === 'new' && b.format === 'old') return -1; // 새로운 형식이 우선
    if (a.format === 'old' && b.format === 'new') return 1;
    
    if (a.format === 'new') {
      const timeA = parseTimeString(a.timestamp);
      const timeB = parseTimeString(b.timestamp);
      return timeB - timeA;
    } else {
      // 기존 형식은 순번 역순 (큰 순번이 최신)
      return (b.sequence || 0) - (a.sequence || 0);
    }
  });
  
  return tradeItems;
}

// 시간 문자열을 Date 객체로 변환하는 헬퍼 함수
function parseTimeString(timeStr) {
  if (!timeStr) return new Date(0);
  
  const timeMatch = timeStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/);
  if (timeMatch) {
    const [, year, month, day, ampm, hour, minute, second] = timeMatch;
    let hour24 = parseInt(hour, 10);
    if (ampm === '오후' && hour24 !== 12) hour24 += 12;
    if (ampm === '오전' && hour24 === 12) hour24 = 0;
    
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1, // 월은 0부터 시작
      parseInt(day, 10),
      hour24,
      parseInt(minute, 10),
      parseInt(second, 10)
    );
  }
  return new Date(0);
}

// 실제 구글 시트에서 획득한 데이터 예시 (2025년 7월 기준)
// 참고: 구글 시트 구조 - 기존: A열(순번), B열(아이템), C열(가격) / 새로운: A열(거래 완료, 시간, 아이템 정보)
export const tradeDataExample = [
  // 새로운 형식 데이터 (최신) - 실제 API 응답 구조
  { timestamp: "2025. 7. 28. 오후 2:10:22", item: "드리아드의 뼈", count: 6, price: 13000000, unitPrice: 2166667, originalText: "드리아드의 뼈 6개가 거래소에서 13,000,000 Gold에 판매되었다.", format: "new" },
  { timestamp: "2025. 7. 28. 오후 2:04:24", item: "푸른 구슬", count: 1, price: 17000000, unitPrice: 17000000, originalText: "푸른 구슬이 거래소에서 17,000,000 Gold에 판매되었다.", format: "new" },
  { timestamp: "2025. 7. 28. 오후 1:52:25", item: "용암의 방패", count: 1, price: 4000000, unitPrice: 4000000, originalText: "용암의 방패가 거래소에서 4,000,000 Gold에 판매되었다.", format: "new" },
  { timestamp: "2025. 7. 28. 오후 1:07:44", item: "고급 가죽", count: 1, price: 8200000, unitPrice: 8200000, originalText: "고급 가죽이 거래소에서 8,200,000 Gold에 판매되었다.", format: "new" },
  { timestamp: "2025. 7. 28. 오후 1:06:54", item: "푸른 구슬", count: 1, price: 16000000, unitPrice: 16000000, originalText: "푸른 구슬이 거래소에서 16,000,000 Gold에 판매되었다.", format: "new" },
  
  // 기존 형식 데이터 (구형)
  { sequence: 15, item: "히드라의 피", count: 1, price: 2000000, unitPrice: 2000000, originalText: "15\t히드라의 피\t2,000,000G", format: "old" },
  { sequence: 14, item: "히드라의 피", count: 3, price: 7200000, unitPrice: 2400000, originalText: "14\t히드라의 피 x 3\t7,200,000G", format: "old" },
  { sequence: 13, item: "히드라의 피", count: 1, price: 2000000, unitPrice: 2000000, originalText: "13\t히드라의 피\t2,000,000G", format: "old" },
  { sequence: 12, item: "히드라의 피", count: 2, price: 4000000, unitPrice: 2000000, originalText: "12\t히드라의 피 x 2\t4,000,000G", format: "old" },
  { sequence: 11, item: "히드라의 피", count: 1, price: 2200000, unitPrice: 2200000, originalText: "11\t히드라의 피\t2,200,000G", format: "old" },
  { sequence: 10, item: "히드라의 피", count: 2, price: 4400000, unitPrice: 2200000, originalText: "10\t히드라의 피 x 2\t4,400,000G", format: "old" },
  { sequence: 9, item: "히드라의 피", count: 1, price: 2200000, unitPrice: 2200000, originalText: "9\t히드라의 피\t2,200,000G", format: "old" },
  { sequence: 8, item: "히드라의 피", count: 2, price: 4000000, unitPrice: 2000000, originalText: "8\t히드라의 피 x 2\t4,000,000G", format: "old" },
  { sequence: 7, item: "히드라의 피", count: 1, price: 2200000, unitPrice: 2200000, originalText: "7\t히드라의 피\t2,200,000G", format: "old" },
  { sequence: 6, item: "히드라의 피", count: 1, price: 2100000, unitPrice: 2100000, originalText: "6\t히드라의 피\t2,100,000G", format: "old" },
  { sequence: 5, item: "히드라의 피", count: 2, price: 4000000, unitPrice: 2000000, originalText: "5\t히드라의 피 x 2\t4,000,000G", format: "old" },
  { sequence: 4, item: "히드라의 피", count: 1, price: 2000001, unitPrice: 2000001, originalText: "4\t히드라의 피\t2,000,001G", format: "old" },
  { sequence: 3, item: "히드라의 피", count: 1, price: 2000001, unitPrice: 2000001, originalText: "3\t히드라의 피\t2,000,001G", format: "old" },
  { sequence: 2, item: "히드라의 피", count: 1, price: 2350000, unitPrice: 2350000, originalText: "2\t히드라의 피\t2,350,000G", format: "old" },
  { sequence: 1, item: "히드라의 피", count: 2, price: 4000000, unitPrice: 2000000, originalText: "1\t히드라의 피 x 2\t4,000,000G", format: "old" }
];

// 데이터 구조 설명
export const dataStructureInfo = {
  columns: {
    timestamp: "거래 시간 (새로운 형식만, 2025. 7. 28. 오후 2:10:22 형식)",
    sequence: "순번 (기존 형식만)",
    item: "아이템명",
    count: "거래 수량",
    price: "총 거래 가격 (Gold)",
    unitPrice: "단위 가격 (총 가격 / 수량)",
    originalText: "원본 텍스트",
    format: "데이터 형식 (new/old)"
  },
  note: "기존 형식: A열(순번), B열(아이템), C열(가격) / 새로운 형식: A열(거래 완료, 시간, 아이템 정보) - Google Sheets API는 빈 행을 제외함",
  source: "https://docs.google.com/spreadsheets/d/1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo/edit?gid=1489625214#gid=1489625214"
};

// 테스트용 함수
export function testTradeDataParsing() {
  // 테스트 함수 - 실제 사용시에는 console.log 제거
}

// 전역에서 접근 가능하도록 설정
if (typeof window !== 'undefined') {
  window.tradeDataExample = tradeDataExample;
  window.testTradeDataParsing = testTradeDataParsing;
} 
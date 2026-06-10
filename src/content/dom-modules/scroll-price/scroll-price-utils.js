// 스크롤 시세 표시용 순수 유틸 (DOM/네트워크 비의존, Node 검증 가능)

// 시세 조회용 아이템명: '제작 스크롤:<어빌명>' (등급 무관, 이름만)
export function scrollItemName(abilityName) {
  return `제작 스크롤:${abilityName}`;
}

// 금액 포맷: 천단위 콤마 + ' Gold' (정수 반올림)
export function formatGold(value) {
  const n = Math.round(Number(value) || 0);
  return `${n.toLocaleString('en-US')} Gold`;
}

// getCurrentPrices 결과로 무데이터 판정 (null이거나 recent/average 모두 0)
export function isNoData(result) {
  if (!result) return true;
  return !result.recent && !result.average;
}

// 표시 라인 배열 생성
// hasData면 ['최근 거래가: X Gold', '30일 평균: Y Gold'], 아니면 ['최근 거래 내역 없음']
export function priceLines(result) {
  if (!result || !result.hasData) {
    return ['최근 거래 내역 없음'];
  }
  return [
    `최근 거래가: ${formatGold(result.recent)}`,
    `30일 평균: ${formatGold(result.average)}`
  ];
}

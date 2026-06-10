// 스크롤 시세 표시용 순수 유틸 (DOM/네트워크 비의존, Node 검증 가능)

// 시세 조회용 아이템명: '제작 스크롤:<어빌명>' (등급 무관, 이름만)
export function scrollItemName(abilityName) {
  return `제작 스크롤:${abilityName}`;
}

// 금액 포맷: 천단위 콤마 + '골드' (정수 반올림)
export function formatGold(value) {
  const n = Math.round(Number(value) || 0);
  return `${n.toLocaleString('en-US')}골드`;
}

// 거래 완료 시각 포맷 (KST 고정, ko-KR) — 예: '2026. 6. 10. 오후 3:13:29'
// 게임 completedAt은 UTC이며 모든 사용자에게 동일하게 KST로 표기한다.
export function formatTransactionDate(iso) {
  return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

// 거래 내역 배열에서 최근순(완료시각 내림차순) 상위 N건 추출 → [{ price, completedAt }]
export function recentTransactions(transactions, take = 3) {
  if (!Array.isArray(transactions)) return [];
  return transactions
    .filter((t) => t && t.completedAt != null)
    .slice()
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, take)
    .map((t) => ({ price: t.price, completedAt: t.completedAt }));
}

// 표시 라인 배열 생성
// 데이터 있으면 ['최근 거래 내역', '- <gold> / <date>', ...], 없으면 ['최근 거래 내역 없음']
export function priceLines(result) {
  const txs = result && Array.isArray(result.transactions) ? result.transactions : [];
  if (!result || !result.hasData || txs.length === 0) {
    return ['최근 거래 내역 없음'];
  }
  const lines = ['최근 거래 내역'];
  txs.forEach((t) => {
    lines.push(`- ${formatGold(t.price)} / ${formatTransactionDate(t.completedAt)}`);
  });
  return lines;
}

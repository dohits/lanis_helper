// 팝오버 paper 위치 자동 조절 (세로 전용 + 긴 내용 스크롤). 가로는 MUI 자동 배치에 맡김.

// 순수: 뷰포트 기준 세로 보정값 계산 → { top?, maxHeight? }
// - 하단 이탈(rect.bottom > vh - margin): top 위로
// - 상단 이탈(rect.top < margin): top = margin (하단 보정을 덮어씀 — 기존 순서 유지)
// - 내용이 길면(rect.height > vh - 2*margin): maxHeight = vh - 2*margin
export function computePaperAdjustment(rect, viewportHeight, margin = 20) {
  const adjustment = {};
  if (rect.bottom > viewportHeight - margin) {
    adjustment.top = Math.max(margin, viewportHeight - rect.height - margin);
  }
  if (rect.top < margin) {
    adjustment.top = margin;
  }
  if (rect.height > viewportHeight - margin * 2) {
    adjustment.maxHeight = viewportHeight - margin * 2;
  }
  return adjustment;
}

// paper 측정 후 보정값을 스타일에 적용
export function calculateAndAdjustPaper(paper) {
  if (!paper) return;
  const rect = paper.getBoundingClientRect();
  const adjustment = computePaperAdjustment(rect, window.innerHeight);
  if (adjustment.top != null) {
    paper.style.top = `${adjustment.top}px`;
  }
  if (adjustment.maxHeight != null) {
    paper.style.maxHeight = `${adjustment.maxHeight}px`;
    paper.style.overflowY = 'auto';
  }
}

// 렌더 안정화 대기 후 보정 (paper 없으면 무동작)
export function adjustPaperPosition(paper, delay = 100) {
  if (!paper) return;
  setTimeout(() => calculateAndAdjustPaper(paper), delay);
}

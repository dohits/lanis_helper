// 스크롤 어빌리티 매칭 유틸 (순수 함수 — DOM/chrome/JSON 비의존, Node 검증 가능)

// 어빌명 정규화: 공백(일반/NBSP 등) 제거 후 소문자화 (표기 차이 흡수: '냉기 돌풍' ↔ '냉기돌풍')
export function normalizeAbilityName(name) {
  if (typeof name !== 'string') return '';
  return name.replace(/\s+/g, '').toLowerCase();
}

// 스크롤 아이템명에서 어빌명 추출
// 예) "제작 스크롤:과부하(금)" -> "과부하"
// - 끝의 괄호부(색상/등급 표기, 반각/전각 모두)를 제거한 뒤 콜론(반각/전각) 뒤를 어빌명으로 사용
export function extractScrollAbilityName(itemNameText) {
  if (typeof itemNameText !== 'string') return null;
  const withoutTrailingParen = itemNameText
    .replace(/\s*[\(（][^\)）]*[\)）]\s*$/, '')
    .trim();
  const parts = withoutTrailingParen.split(/[:：]/);
  if (parts.length < 2) return null;
  const abilityName = parts.slice(1).join(':').trim();
  return abilityName || null;
}

// 어빌 목록에서 효과 찾기 (정규화 비교, 동일명 중복 시 첫 매칭)
export function findAbilityEffect(abilityList, abilityName) {
  if (!Array.isArray(abilityList)) return null;
  const target = normalizeAbilityName(abilityName);
  if (!target) return null;
  const match = abilityList.find(
    (item) => normalizeAbilityName(item && item['어빌리티명']) === target
  );
  return match && match['효과'] ? match['효과'] : null;
}

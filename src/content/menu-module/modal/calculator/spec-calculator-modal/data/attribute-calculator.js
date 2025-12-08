/**
 * 속성 보정 계산 모듈
 * 장비 속성 보정과 마을 속성 보정을 계산합니다.
 */

// 속성 상성 관계
const ELEMENT_RELATIONSHIP = {
  fire: { weak: 'water', strong: 'wind' },
  water: { weak: 'lightning', strong: 'fire' },
  lightning: { weak: 'star', strong: 'water' },
  star: { weak: 'wind', strong: 'lightning' },
  wind: { weak: 'fire', strong: 'star' },
  light: { weak: 'dark', strong: 'dark' },
  dark: { weak: 'light', strong: 'light' }
};

/**
 * 장비 속성 보정 계산
 * @param {string} equipmentElement - 장비 속성
 * @param {string} characterElement - 캐릭터 속성
 * @returns {number} 보정값 (1.2 또는 1.0)
 */
export function calculateEquipmentAttributeBonus(equipmentElement, characterElement) {
  if (!equipmentElement || !characterElement) return 1.0;
  return equipmentElement === characterElement ? 1.2 : 1.0;
}

/**
 * 마을 속성 보정 계산
 * @param {string} characterElement - 캐릭터 속성
 * @param {string} townElement - 마을 속성
 * @returns {number} 보정값 (1.1, 0.9, 또는 1.0)
 */
export function calculateTownAttributeBonus(characterElement, townElement) {
  if (!characterElement || !townElement) return 1.0;
  
  // 일치하는 경우
  if (characterElement === townElement) {
    return 1.1;
  }
  
  // 빛 ↔ 어둠 관계
  if ((characterElement === 'light' && townElement === 'dark') ||
      (characterElement === 'dark' && townElement === 'light')) {
    return 0.9;
  }
  
  // 상성 관계 확인
  const relationship = ELEMENT_RELATIONSHIP[characterElement];
  if (!relationship) return 1.0;
  
  // 캐릭터가 약한 속성인 마을 (상성에서 약한 경우)
  if (relationship.weak === townElement) {
    return 0.9;
  }
  
  // 관련 없음
  return 1.0;
}

/**
 * 속성 이름 한글 변환
 */
export const ELEMENT_NAMES = {
  fire: '불',
  water: '물',
  lightning: '번개',
  star: '별',
  wind: '바람',
  light: '빛',
  dark: '어둠'
};


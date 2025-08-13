// 장비 셋팅 시뮬레이션 데이터 및 상수

// 직업 정보
export const JOBS = [
  { id: 'sword', name: '검술', icon: '⚔️', color: '#3b82f6' },
  { id: 'body', name: '체술', icon: '🥊', color: '#ef4444' },
  { id: 'ninja', name: '인술', icon: '🥷', color: '#8b5cf6' },
  { id: 'divine', name: '신술', icon: '✨', color: '#f59e0b' },
  { id: 'magic', name: '마술', icon: '🔮', color: '#ec4899' },
  { id: 'archery', name: '궁술', icon: '🏹', color: '#10b981' }
];

// 속성 정보
export const ELEMENTS = [
  { id: 'fire', name: '불', icon: '🔥', color: '#ef4444' },
  { id: 'water', name: '물', icon: '💧', color: '#3b82f6' },
  { id: 'lightning', name: '번개', icon: '⚡', color: '#f59e0b' },
  { id: 'wind', name: '바람', icon: '💨', color: '#10b981' },
  { id: 'star', name: '별', icon: '⭐', color: '#8b5cf6' },
  { id: 'light', name: '빛', icon: '✨', color: '#fbbf24' },
  { id: 'dark', name: '어둠', icon: '🌑', color: '#6b7280' }
];

// 아이템 카테고리 정보
export const ITEM_CATEGORIES = {
  weapon: {
    id: 'weapon',
    name: '무기',
    icon: '⚔️',
    color: '#ef4444',
    subCategories: {
      sword: { name: '검', icon: '🗡️' },
      axe: { name: '도끼', icon: '🪓' },
      spear: { name: '창', icon: '🔱' },
      bow: { name: '활', icon: '🏹' },
      knuckle: { name: '너클', icon: '🥊' },
      staff: { name: '지팡이', icon: '🪄' },
      knife: { name: '나이프', icon: '🔪' },
      unknown: { name: '미확인', icon: '❓' }
    }
  },
  armor: {
    id: 'armor',
    name: '방어구',
    icon: '🛡️',
    color: '#3b82f6'
  },
  accessory: {
    id: 'accessory',
    name: '장신구',
    icon: '💎',
    color: '#8b5cf6'
  }
};

// 어빌리티 관련 매핑 (중복 코드 제거용)
export const ABILITY_MAPPINGS = {
  iconMap: {
    '검술': '⚔️',
    '체술': '🥊',
    '인술': '🥷',
    '신술': '✨',
    '마술': '🔮',
    '궁술': '🏹'
  },
  colorMap: {
    '검술': '#3b82f6',
    '체술': '#ef4444',
    '인술': '#8b5cf6',
    '신술': '#f59e0b',
    '마술': '#ec4899',
    '궁술': '#10b981'
  }
};

// UI 상수
export const UI_CONSTANTS = {
  MODAL_Z_INDEX: 10030,
  ANIMATION_DURATION: 300,
  CARD_HOVER_TRANSFORM: 'translateY(-2px)',
  CARD_HOVER_SHADOW: '0 4px 12px rgba(0, 0, 0, 0.1)',
  BUTTON_HOVER_TRANSFORM: 'translateY(-2px)',
  BUTTON_HOVER_SHADOW: '0 6px 16px rgba(102, 126, 234, 0.4)'
};

// 색상 테마
export const COLOR_THEMES = {
  primary: {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    shadow: 'rgba(102, 126, 234, 0.3)',
    hoverShadow: 'rgba(102, 126, 234, 0.4)'
  },
  secondary: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    shadow: 'rgba(16, 185, 129, 0.3)',
    hoverShadow: 'rgba(16, 185, 129, 0.4)'
  }
};

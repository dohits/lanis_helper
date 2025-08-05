/**
 * 낚시 등급 레벨업 확률 데이터
 * 각 단계별 레벨업 확률을 정의
 */

export const FISHING_LEVEL_PROBABILITIES = {
  1: { plus2: 4, plus1: 40, zero: 56, minus1: 0, reset: 0 },
  2: { plus2: 4, plus1: 40, zero: 56, minus1: 0, reset: 0 },
  3: { plus2: 3, plus1: 30, zero: 52, minus1: 15, reset: 0 },
  4: { plus2: 3, plus1: 30, zero: 47, minus1: 20, reset: 0 },
  5: { plus2: 2, plus1: 25, zero: 45, minus1: 25, reset: 3 },
  6: { plus2: 1, plus1: 21, zero: 33, minus1: 40, reset: 5 },
  7: { plus2: 1, plus1: 21, zero: 23, minus1: 45, reset: 10 },
  8: { plus2: 0.5, plus1: 21.5, zero: 13, minus1: 50, reset: 15 },
  9: { plus2: 0, plus1: 22, zero: 3, minus1: 55, reset: 20 },
  10: { plus2: 0, plus1: 0, zero: 0, minus1: 0, reset: 0 } // 10단계는 최대 등급
};



// 레벨업 시도당 소모 물고기 수
export const FISH_PER_ATTEMPT = 5;

// 최대 등급
export const MAX_FISHING_LEVEL = 10;

// 단계별 보상 데이터
export const FISHING_LEVEL_REWARDS = {
  6: [
    { item: '초록 구슬 파편', quantity: 1, probability: 100 }
  ],
  7: [
    { item: '초록 구슬 파편', quantity: 2, probability: 50 },
    { item: '결정 제작 키트', quantity: 1, probability: 50 }
  ],
  8: [
    { item: '초록 구슬 파편', quantity: 4, probability: 33 },
    { item: '결정 제작 키트', quantity: 3, probability: 33 },
    { item: '열쇠 제작 키트', quantity: 1, probability: 34 }
  ],
  9: [
    { item: '초록 구슬', quantity: 1, probability: 33 },
    { item: '결정 제작 키트', quantity: 8, probability: 33 },
    { item: '열쇠 제작 키트', quantity: 3, probability: 34 }
  ],
  10: [
    { item: '초록 구슬', quantity: 3, probability: 33 },
    { item: '결정 제작 키트', quantity: 25, probability: 33 },
    { item: '열쇠 제작 키트', quantity: 10, probability: 34 }
  ]
};

// 아이템별 시세 (예시 가격, 실제로는 API에서 가져올 수 있음)
export const ITEM_PRICES = {
  '초록 구슬 파편': 1000,
  '초록 구슬': 5000,
  '결정 제작 키트': 2000,
  '열쇠 제작 키트': 3000
}; 
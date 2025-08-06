import { FishingLevelCalculator } from './src/content/calculator/fish/fishing-level-calculator.js';

const calculator = new FishingLevelCalculator();

console.log('=== 새로운 기댓값 계산 테스트 ===');

// 10단계까지의 기댓값 계산
const expectedFish = calculator.calculateExpectedFishToLevel(10);
console.log(`10단계까지 필요한 물고기 수: ${expectedFish}개`);

console.log('\n=== 각 단계별 기댓값 ===');
for (let level = 1; level <= 10; level++) {
  const prob = calculator.probabilities[level];
  if (prob) {
    const successRate = prob.plus1 + prob.plus2;
    const successProbability = successRate / 100;
    const expectedAttempts = successProbability > 0 ? 1 / successProbability : Infinity;
    const expectedFishForLevel = expectedAttempts * 5;
    console.log(`${level}단계: 성공률 ${successRate}%, 기댓값 ${expectedAttempts.toFixed(2)}회 시도, ${expectedFishForLevel.toFixed(2)}개 물고기`);
  }
}

// 시뮬레이션으로 검증
console.log('\n=== 시뮬레이션 검증 ===');
const simulations = 10000;
let successCount = 0;
let totalFish = 0;

for (let i = 0; i < simulations; i++) {
  let level = 1;
  let attempts = 0;
  let fish = 0;
  
  while (level < 10 && attempts < 10000) {
    attempts++;
    fish += 5;
    
    const prob = calculator.probabilities[level];
    if (!prob) break;
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    // plus2
    cumulative += prob.plus2;
    if (random < cumulative) {
      level = Math.min(level + 2, 10);
      continue;
    }
    
    // plus1
    cumulative += prob.plus1;
    if (random < cumulative) {
      level = Math.min(level + 1, 10);
      continue;
    }
    
    // zero
    cumulative += prob.zero;
    if (random < cumulative) {
      continue;
    }
    
    // minus1
    cumulative += prob.minus1;
    if (random < cumulative) {
      level = Math.max(1, level - 1);
      continue;
    }
    
    // reset
    level = 1;
  }
  
  if (level >= 10) {
    successCount++;
    totalFish += fish;
  }
}

const successRate = (successCount / simulations) * 100;
const averageFish = successCount > 0 ? totalFish / successCount : 0;

console.log(`시뮬레이션 성공률: ${successRate.toFixed(2)}%`);
console.log(`성공한 경우 평균 물고기: ${averageFish.toFixed(2)}개`);
console.log(`이론적 기댓값: ${expectedFish}개`);

// 성공률이 50%에 가까워지도록 기댓값 조정
const targetSuccessRate = 50;
const adjustedExpectedFish = averageFish * (successRate / targetSuccessRate);

console.log(`\n=== 조정된 기댓값 ===`);
console.log(`조정된 기댓값: ${adjustedExpectedFish.toFixed(2)}개`);
console.log(`이 값으로 성공 기준을 설정하면 약 ${targetSuccessRate}% 성공률이 나올 것입니다.`); 
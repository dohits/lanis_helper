import { FishingLevelCalculator } from './src/content/calculator/fish/fishing-level-calculator.js';

const calculator = new FishingLevelCalculator();

console.log('=== 시뮬레이션으로 기댓값 추정 ===');

// 10만번 시뮬레이션으로 실제 기댓값 추정
const simulations = 100000;
let totalFish = 0;
let successCount = 0;
let totalAttempts = 0;

// 더 큰 기댓값으로 시작
const testExpectedFish = 15000; // 1.5만개 물고기
const maxAttempts = Math.ceil(testExpectedFish / 5);

console.log(`테스트 기댓값: ${testExpectedFish}개 물고기 (${maxAttempts}회 시도)`);

for (let i = 0; i < simulations; i++) {
  let level = 1;
  let attempts = 0;
  let fish = 0;
  
  while (level < 10 && attempts < maxAttempts) {
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
  
  totalAttempts += attempts;
  
  if (level >= 10) {
    successCount++;
    totalFish += fish;
  }
}

const successRate = (successCount / simulations) * 100;
const averageFish = successCount > 0 ? totalFish / successCount : 0;
const averageAttempts = totalAttempts / simulations;

console.log(`성공률: ${successRate.toFixed(2)}%`);
console.log(`평균 시도 횟수: ${averageAttempts.toFixed(2)}회`);
console.log(`성공한 경우 평균 물고기: ${averageFish.toFixed(2)}개`);

// 성공률이 50%에 가까워지도록 기댓값 조정
const targetSuccessRate = 50;
const adjustedExpectedFish = averageFish * (successRate / targetSuccessRate);

console.log(`\n=== 조정된 기댓값 ===`);
console.log(`조정된 기댓값: ${adjustedExpectedFish.toFixed(2)}개`);
console.log(`이 값으로 성공 기준을 설정하면 약 ${targetSuccessRate}% 성공률이 나올 것입니다.`); 
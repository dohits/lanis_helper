import { FishingLevelCalculator } from './src/content/calculator/fish/fishing-level-calculator.js';

const calculator = new FishingLevelCalculator();

console.log('=== 10단계까지의 기댓값 계산 ===');
const expectedFish = calculator.calculateExpectedFishToLevel(10);
console.log(`10단계까지 필요한 물고기 수: ${expectedFish}`);

console.log('\n=== 각 단계별 기댓값 ===');
for (let level = 1; level <= 10; level++) {
  const expectedAttempts = calculator.calculateExpectedAttemptsStable(level);
  const expectedFishForLevel = expectedAttempts * 5;
  console.log(`${level}단계까지: ${expectedAttempts.toFixed(2)}회 시도, ${expectedFishForLevel.toFixed(2)}개 물고기`);
}

console.log('\n=== 확률표 확인 ===');
for (let level = 1; level <= 10; level++) {
  const prob = calculator.probabilities[level];
  if (prob) {
    const total = prob.plus2 + prob.plus1 + prob.zero + prob.minus1 + prob.reset;
    console.log(`${level}단계: +2(${prob.plus2}%) +1(${prob.plus1}%) 0(${prob.zero}%) -1(${prob.minus1}%) reset(${prob.reset}%) = ${total}%`);
  }
} 
import { FISHING_LEVEL_PROBABILITIES, FISH_PER_ATTEMPT, MAX_FISHING_LEVEL } from './fishing-level-data.js';

/**
 * 낚시 등급 레벨업 기댓값 계산기
 */
export class FishingLevelCalculator {
  constructor() {
    this.probabilities = FISHING_LEVEL_PROBABILITIES;
    this.fishPerAttempt = FISH_PER_ATTEMPT;
    this.maxLevel = MAX_FISHING_LEVEL;
  }

  /**
   * 특정 등급에서 목표 등급까지의 기댓값 계산
   * @param {number} currentLevel - 현재 등급 (1-9)
   * @param {number} targetLevel - 목표 등급 (2-10)
   * @returns {Object} 계산 결과
   */
  calculateExpectedValue(currentLevel, targetLevel) {
    // 마코프 체인 방식 사용
    return this.calculateMarkovChainExpectedValue(currentLevel, targetLevel);
  }

  /**
   * 특정 등급에서 다음 등급까지의 기댓값 계산
   * @param {number} level - 현재 등급
   * @returns {Object} 계산 결과
   */
  calculateLevelUpExpectedValue(level) {
    if (level >= this.maxLevel) {
      return {
        attempts: 0,
        totalFish: 0,
        expectedValue: 0,
        successRate: 0,
        message: '최대 등급입니다.'
      };
    }

    const prob = this.probabilities[level];
    if (!prob) {
      return {
        attempts: 0,
        totalFish: 0,
        expectedValue: 0,
        successRate: 0,
        message: '유효하지 않은 등급입니다.'
      };
    }

    // 성공 확률 (plus1 + plus2)
    const successRate = prob.plus1 + prob.plus2;
    
    // 기댓값 계산 (기하분포의 기댓값: 1/p)
    // p는 성공 확률 (0~1 범위로 변환)
    const successProbability = successRate / 100;
    const expectedAttempts = successProbability > 0 ? 1 / successProbability : Infinity;
    
    // 총 물고기 수
    const totalFish = Math.ceil(expectedAttempts) * this.fishPerAttempt;

    return {
      attempts: Math.ceil(expectedAttempts),
      totalFish,
      expectedValue: expectedAttempts,
      successRate,
      plus1Rate: prob.plus1,
      plus2Rate: prob.plus2,
      zeroRate: prob.zero,
      minus1Rate: prob.minus1,
      resetRate: prob.reset
    };
  }

  /**
   * 전체 성공률 계산
   * @param {number} currentLevel - 현재 등급
   * @param {number} targetLevel - 목표 등급
   * @returns {number} 전체 성공률
   */
  calculateOverallSuccessRate(currentLevel, targetLevel) {
    let overallSuccessRate = 1;
    
    for (let level = currentLevel; level < targetLevel; level++) {
      const prob = this.probabilities[level];
      if (prob) {
        const levelSuccessRate = (prob.plus1 + prob.plus2) / 100;
        overallSuccessRate *= levelSuccessRate;
      }
    }
    
    return overallSuccessRate * 100;
  }

  /**
   * 마코프 체인 기반 계산 (새로운 구현)
   * @param {number} currentLevel - 현재 등급 (1-9)
   * @param {number} targetLevel - 목표 등급 (2-10)
   * @returns {Object} 계산 결과
   */
  calculateMarkovChainExpectedValue(currentLevel, targetLevel) {
    if (currentLevel >= targetLevel) {
      return {
        attempts: 0,
        totalFish: 0,
        expectedValue: 0,
        successRate: 100,
        message: '이미 목표 등급에 도달했습니다.'
      };
    }

    if (currentLevel >= this.maxLevel) {
      return {
        attempts: 0,
        totalFish: 0,
        expectedValue: 0,
        successRate: 0,
        message: '이미 최대 등급입니다.'
      };
    }

    try {
      // 마코프 체인으로 각 단계별 기댓값 계산
      const expectedValues = this.solveMarkovChainForLevel(targetLevel);
      
      // 현재 단계에서 목표 단계까지의 필요 시도 횟수
      const currentExpectedAttempts = expectedValues[currentLevel];
      
      if (currentExpectedAttempts === undefined || isNaN(currentExpectedAttempts)) {
        return {
          attempts: 0,
          totalFish: 0,
          expectedValue: 0,
          successRate: 0,
          message: '계산 오류가 발생했습니다.'
        };
      }
      
      // 물고기 수 계산
      const totalFish = currentExpectedAttempts * this.fishPerAttempt;
      
      // 각 단계별 상세 결과 계산
      const levelResults = [];
      for (let level = currentLevel; level < targetLevel; level++) {
        const levelProb = this.probabilities[level];
        if (levelProb) {
          // 각 단계별로 개별 마코프 체인 계산
          const levelExpectedValues = this.solveMarkovChainForLevel(level + 1);
          const levelExpectedAttempts = levelExpectedValues[level];
          const levelFish = levelExpectedAttempts * this.fishPerAttempt;
          
          levelResults.push({
            level: level,
            attempts: Math.ceil(levelExpectedAttempts),
            totalFish: levelFish,
            successRate: levelProb.plus1 + levelProb.plus2,
            plus1Rate: levelProb.plus1,
            plus2Rate: levelProb.plus2,
            zeroRate: levelProb.zero,
            minus1Rate: levelProb.minus1,
            resetRate: levelProb.reset
          });
        }
      }
      
      return {
        attempts: Math.ceil(currentExpectedAttempts),
        totalFish: totalFish,
        expectedValue: currentExpectedAttempts,
        successRate: this.calculateOverallSuccessRate(currentLevel, targetLevel),
        levelResults: levelResults
      };
    } catch (error) {
      console.error('마코프 체인 계산 중 오류:', error);
      return {
        attempts: 0,
        totalFish: 0,
        expectedValue: 0,
        successRate: 0,
        message: '계산 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 특정 목표 단계까지의 마코프 체인 방정식 해결
   * @param {number} targetLevel - 목표 단계
   * @returns {Object} 각 단계별 기댓값
   */
  solveMarkovChainForLevel(targetLevel) {
    const maxLevel = 10;
    const expectedValues = {};
    
    // 초기값 설정
    for (let i = 1; i <= maxLevel; i++) {
      expectedValues[i] = 0;
    }
    
    // 목표 단계에서는 기댓값이 0
    expectedValues[targetLevel] = 0;
    
    // 목표 단계보다 높은 단계들도 기댓값이 0
    for (let i = targetLevel + 1; i <= maxLevel; i++) {
      expectedValues[i] = 0;
    }
    
    // 반복적 해법으로 마코프 체인 방정식 해결
    const maxIterations = 100;
    const tolerance = 1e-6;
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const newExpectedValues = {};
      
      // 목표 단계와 높은 단계들은 그대로 유지
      newExpectedValues[targetLevel] = 0;
      for (let i = targetLevel + 1; i <= maxLevel; i++) {
        newExpectedValues[i] = 0;
      }
      
      // 목표 단계보다 낮은 단계들에 대해 방정식 해결
      for (let level = targetLevel - 1; level >= 1; level--) {
        const prob = this.probabilities[level];
        if (!prob) {
          newExpectedValues[level] = 0;
          continue;
        }
        
        // 마코프 체인 방정식: E[level] = 1 + Σ P[level→next] * E[next]
        let sum = 1; // 현재 단계에서 1회 시도
        
        // plus2: 2단계 상승
        const nextLevelPlus2 = Math.min(level + 2, maxLevel);
        sum += (prob.plus2 / 100) * expectedValues[nextLevelPlus2];
        
        // plus1: 1단계 상승
        const nextLevelPlus1 = Math.min(level + 1, maxLevel);
        sum += (prob.plus1 / 100) * expectedValues[nextLevelPlus1];
        
        // minus1: 1단계 하락
        const nextLevelMinus1 = Math.max(level - 1, 1);
        sum += (prob.minus1 / 100) * expectedValues[nextLevelMinus1];
        
        // reset: 1단계로 리셋
        sum += (prob.reset / 100) * expectedValues[1];
        
        // 자기 자신으로의 전이 (zero) 확률
        const selfTransition = prob.zero / 100;
        
        // 방정식 해결: E[level] = sum / (1 - selfTransition)
        if (selfTransition < 1) {
          newExpectedValues[level] = sum / (1 - selfTransition);
        } else {
          newExpectedValues[level] = Infinity;
        }
      }
      
      // 수렴 확인
      let maxDiff = 0;
      for (let i = 1; i < targetLevel; i++) {
        const diff = Math.abs(newExpectedValues[i] - expectedValues[i]);
        maxDiff = Math.max(maxDiff, diff);
      }
      
      // 값 업데이트
      for (let i = 1; i < targetLevel; i++) {
        expectedValues[i] = newExpectedValues[i];
      }
      
      // 수렴하면 반복 중단
      if (maxDiff < tolerance) {
        break;
      }
    }
    
    return expectedValues;
  }

  /**
   * 특정 단계까지 도달하는데 필요한 물고기 수 계산 (마코프 체인)
   * @param {number} targetLevel - 목표 단계
   * @returns {number} 필요한 물고기 수
   */
  calculateExpectedFishToLevel(targetLevel) {
    try {
      // 목표 단계까지의 첫 도달 기댓값 계산
      const expectedAttempts = this.calculateFirstPassageTime(targetLevel);
      
      // 시도 횟수를 물고기 수로 변환
      return expectedAttempts * this.fishPerAttempt;
    } catch (error) {
      console.error('마코프 체인 계산 중 오류:', error);
      return 0;
    }
  }

  /**
   * 첫 도달 기댓값 계산 (Mean First Passage Time)
   * @param {number} targetLevel - 목표 단계
   * @returns {number} 첫 도달 기댓값
   */
  calculateFirstPassageTime(targetLevel) {
    const maxLevel = 10;
    
    // 1단계부터 targetLevel-1단계까지의 선형 방정식 시스템 구축
    const n = targetLevel - 1; // 방정식 개수
    const A = []; // 계수 행렬
    const b = []; // 상수 벡터
    
    // 각 단계별 방정식 구축
    for (let i = 1; i < targetLevel; i++) {
      const row = new Array(n).fill(0);
      const prob = this.probabilities[i];
      
      if (prob) {
        // 자기 자신으로의 전이 (대각선 요소)
        row[i - 1] = 1 - (prob.zero / 100);
        
        // 다른 상태로의 전이
        // plus2
        const toLevelPlus2 = Math.min(i + 2, maxLevel);
        if (toLevelPlus2 < targetLevel) {
          row[toLevelPlus2 - 1] -= prob.plus2 / 100;
        }
        
        // plus1
        const toLevelPlus1 = Math.min(i + 1, maxLevel);
        if (toLevelPlus1 < targetLevel) {
          row[toLevelPlus1 - 1] -= prob.plus1 / 100;
        }
        
        // minus1
        const toLevelMinus1 = Math.max(i - 1, 1);
        if (toLevelMinus1 < targetLevel) {
          row[toLevelMinus1 - 1] -= prob.minus1 / 100;
        }
        
        // reset
        if (1 < targetLevel) {
          row[0] -= prob.reset / 100;
        }
      }
      
      A.push(row);
      b.push(1); // 각 방정식의 상수항은 1
    }
    
    // 가우스 소거법으로 선형 방정식 시스템 해결
    const solution = this.gaussianElimination(A, b);
    
    // 1단계의 기댓값 반환 (1단계에서 목표 단계까지의 첫 도달 기댓값)
    return solution[0];
  }

  /**
   * 가우스 소거법 구현
   * @param {Array} A - 계수 행렬
   * @param {Array} b - 상수 벡터
   * @returns {Array} 해
   */
  gaussianElimination(A, b) {
    const n = A.length;
    const augmented = [];
    
    // 확장 행렬 구축
    for (let i = 0; i < n; i++) {
      augmented[i] = [...A[i], b[i]];
    }
    
    // 전진 소거
    for (let i = 0; i < n; i++) {
      // 피벗 찾기
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      
      // 행 교환
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      // 소거
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
    
    // 후진 대입
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < n; j++) {
        sum += augmented[i][j] * x[j];
      }
      x[i] = (augmented[i][n] - sum) / augmented[i][i];
    }
    
    return x;
  }

  /**
   * 계산 결과 검증을 위한 테스트 메서드
   * @param {number} currentLevel - 현재 등급
   * @param {number} targetLevel - 목표 등급
   * @returns {Object} 검증 결과
   */
  validateCalculation(currentLevel, targetLevel) {
    // 각 단계별 계산 결과
    for (let level = currentLevel; level < targetLevel; level++) {
      const prob = this.probabilities[level];
      const successRate = prob.plus1 + prob.plus2;
      const successProbability = successRate / 100;
      const expectedAttempts = 1 / successProbability;
    }
    
    // 전체 계산 결과
    const result = this.calculateExpectedValue(currentLevel, targetLevel);
    
    return result;
  }

  /**
   * 시뮬레이션을 통한 기댓값 계산 (Monte Carlo)
   * @param {number} currentLevel - 현재 등급
   * @param {number} targetLevel - 목표 등급
   * @param {number} simulations - 시뮬레이션 횟수 (기본값: 10000)
   * @returns {Object} 시뮬레이션 결과
   */
  simulateLevelUp(currentLevel, targetLevel, simulations = 10000) {
    const results = [];
    
    for (let i = 0; i < simulations; i++) {
      const result = this.simulateSingleRun(currentLevel, targetLevel);
      results.push(result);
    }
    
    // 통계 계산
    const attempts = results.map(r => r.attempts);
    const fish = results.map(r => r.totalFish);
    
    const avgAttempts = attempts.reduce((a, b) => a + b, 0) / simulations;
    const avgFish = fish.reduce((a, b) => a + b, 0) / simulations;
    const successCount = results.filter(r => r.success).length;
    const successRate = (successCount / simulations) * 100;
    
    return {
      simulations,
      avgAttempts,
      avgFish,
      successRate,
      minAttempts: Math.min(...attempts),
      maxAttempts: Math.max(...attempts),
      minFish: Math.min(...fish),
      maxFish: Math.max(...fish)
    };
  }

  /**
   * 단일 시뮬레이션 실행
   * @param {number} currentLevel - 현재 등급
   * @param {number} targetLevel - 목표 등급
   * @returns {Object} 시뮬레이션 결과
   */
  simulateSingleRun(currentLevel, targetLevel) {
    let level = currentLevel;
    let attempts = 0;
    let totalFish = 0;
    
    while (level < targetLevel && attempts < 1000) { // 무한 루프 방지
      attempts++;
      totalFish += this.fishPerAttempt;
      
      const prob = this.probabilities[level];
      if (!prob) break;
      
      const random = Math.random() * 100;
      let cumulative = 0;
      
      // plus2
      cumulative += prob.plus2;
      if (random < cumulative) {
        level += 2;
        continue;
      }
      
      // plus1
      cumulative += prob.plus1;
      if (random < cumulative) {
        level += 1;
        continue;
      }
      
      // zero
      cumulative += prob.zero;
      if (random < cumulative) {
        // 레벨 변화 없음
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
    
    return {
      attempts,
      totalFish,
      success: level >= targetLevel,
      finalLevel: level
    };
  }

  /**
   * 시뮬레이션을 통한 검증
   * @param {number} targetLevel - 목표 단계
   * @param {number} simulations - 시뮬레이션 횟수
   * @returns {number} 평균 물고기 수
   */
  simulateToLevel(targetLevel, simulations = 100000) {
    let totalFish = 0;
    let successCount = 0;
    
    for (let i = 0; i < simulations; i++) {
      const result = this.simulateToTargetLevel(targetLevel);
      if (result.success) {
        totalFish += result.totalFish;
        successCount++;
      }
    }
    
    if (successCount === 0) {
      return Infinity;
    }
    
    return totalFish / successCount;
  }

  /**
   * 단일 시뮬레이션: 1단계에서 목표 단계까지
   * @param {number} targetLevel - 목표 단계
   * @returns {Object} 시뮬레이션 결과
   */
  simulateToTargetLevel(targetLevel) {
    let level = 1;
    let attempts = 0;
    let totalFish = 0;
    
    while (level < targetLevel && attempts < 10000) { // 무한 루프 방지
      attempts++;
      totalFish += this.fishPerAttempt;
      
      const prob = this.probabilities[level];
      if (!prob) break;
      
      const random = Math.random() * 100;
      let cumulative = 0;
      
      // plus2
      cumulative += prob.plus2;
      if (random < cumulative) {
        level += 2;
        continue;
      }
      
      // plus1
      cumulative += prob.plus1;
      if (random < cumulative) {
        level += 1;
        continue;
      }
      
      // zero
      cumulative += prob.zero;
      if (random < cumulative) {
        // 레벨 변화 없음
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
    
    return {
      success: level >= targetLevel,
      totalFish,
      attempts,
      finalLevel: level
    };
  }
} 
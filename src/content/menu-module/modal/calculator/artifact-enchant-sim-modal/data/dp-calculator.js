// 동적 계획법 기반 유물 감정 시뮬레이션 계산기 (React 코드와 동일한 로직)

const MAX_STAT = 10;

/**
 * DP 기반 기댓값 계산 (React 코드와 동일한 로직)
 * @param {number} numStats - 선택한 스텟 개수
 * @param {number} numRounds - 시행 횟수
 * @param {number} targetSum - 목표 합계
 * @param {number} artifactCost - 유물당 비용
 * @returns {Object} 결과 객체
 */
export function calculateExpectedValueDP(numStats, numRounds, targetSum, artifactCost) {
  // 목표 도달 불가능 체크
  const maxPossible = numStats * MAX_STAT;
  if (targetSum > maxPossible) {
    throw new Error(`목표 ${targetSum}은 최대값 ${maxPossible}을 초과합니다.`);
  }

  // 단일 유물 내에서의 기댓값 계산
  const memo = new Map();
  
  const stateKey = (stats) => stats.join(',');

  // 한 유물(numRounds 시행) 내에서 특정 상태에서 시작했을 때의 기댓값
  const dpSingleItem = (stats, roundsLeft) => {
    const sum = stats.reduce((a, b) => a + b, 0);
    
    if (sum >= targetSum) {
      return { successProb: 1, expectedRounds: 0, expectedGold: 0 };
    }

    if (roundsLeft === 0) {
      return { successProb: 0, expectedRounds: 0, expectedGold: 0 };
    }

    const key = `${stateKey(stats)}_${roundsLeft}`;
    if (memo.has(key)) {
      return memo.get(key);
    }

    const minVal = Math.min(...stats);
    const minIdx = stats.findIndex(s => s === minVal);

    let totalSuccessProb = 0;
    let totalExpectedRounds = 0;
    let totalExpectedGold = 0;

    // 모든 가능한 결과 계산
    for (let selectedGain of [0, 1, 2, 3]) {
      const selectedProb = 0.25;
      
      const otherIndices = stats.map((_, i) => i).filter(i => i !== minIdx);
      const numOthers = otherIndices.length;
      const totalCombinations = Math.pow(2, numOthers);

      for (let mask = 0; mask < totalCombinations; mask++) {
        const newStats = [...stats];
        newStats[minIdx] = Math.min(MAX_STAT, newStats[minIdx] + selectedGain);
        
        let combProb = selectedProb;
        for (let i = 0; i < numOthers; i++) {
          const idx = otherIndices[i];
          const gain = (mask >> i) & 1;
          newStats[idx] = Math.min(MAX_STAT, newStats[idx] + gain);
          combProb *= 0.5;
        }

        const next = dpSingleItem(newStats, roundsLeft - 1);
        totalSuccessProb += combProb * next.successProb;
        totalExpectedRounds += combProb * (1 + next.expectedRounds);
        totalExpectedGold += combProb * (artifactCost + next.expectedGold);
      }
    }

    const result = {
      successProb: totalSuccessProb,
      expectedRounds: totalExpectedRounds,
      expectedGold: totalExpectedGold
    };

    memo.set(key, result);
    return result;
  };

  // 초기 상태에서 시작
  const initialStats = new Array(numStats).fill(0);
  const singleItemResult = dpSingleItem(initialStats, numRounds);

  // 성공 확률이 0이면 목표 달성 불가
  if (singleItemResult.successProb === 0) {
    throw new Error('한 유물로 목표 달성이 불가능합니다.');
  }

  // 기하 분포: 성공할 때까지 필요한 유물 개수의 기댓값
  const expectedItems = 1 / singleItemResult.successProb;
  const expectedTotalRounds = expectedItems * singleItemResult.expectedRounds / singleItemResult.successProb;
  const expectedTotalGold = expectedItems * singleItemResult.expectedGold / singleItemResult.successProb;

  return {
    probability: singleItemResult.successProb,
    successCount: singleItemResult.successProb * 1,
    totalSimulations: 1,
    avgArtifacts: expectedItems,
    avgRounds: expectedTotalRounds,
    avgGold: expectedTotalGold,
    artifactCost
  };
}

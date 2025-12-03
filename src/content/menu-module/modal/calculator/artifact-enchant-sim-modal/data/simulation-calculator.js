// 유물 감정 시뮬레이션 계산기

/**
 * 시뮬레이션 실행
 * @param {number} numStats - 선택한 스텟 개수
 * @param {number} numRounds - 시행 횟수
 * @param {number} targetSum - 목표 합계
 * @param {number} numSimulations - 시뮬레이션 반복 횟수
 * @returns {Object} 결과 객체
 */
export function runSimulation(numStats, numRounds, targetSum, numSimulations = 100000) {
  const MAX_INCREASE = 10;
  let successCount = 0;
  let totalArtifacts = 0;
  let totalRounds = 0;

  for (let sim = 0; sim < numSimulations; sim++) {
    let statValues = new Array(numStats).fill(0);
    let artifacts = 0;
    let rounds = 0;
    let failed = false;

    // 목표 달성까지 반복
    while (true) {
      artifacts++;
      
      // 이번 유물로 시뮬레이션
      const currentStats = [...statValues];
      
      for (let round = 0; round < numRounds; round++) {
        // 최적 정책: 현재 최소 스텟에 버튼 누르기
        let minIdx = 0;
        let minValue = currentStats[0];
        for (let i = 1; i < numStats; i++) {
          if (currentStats[i] < minValue) {
            minValue = currentStats[i];
            minIdx = i;
          }
        }

        // 버튼 누른 스텟: 0~3 상승치 (각 25%)
        const buttonIncrease = Math.floor(Math.random() * 4); // 0, 1, 2, 3
        currentStats[minIdx] += buttonIncrease;

        // 나머지 스텟: 0~1 상승치 (각 50%)
        for (let i = 0; i < numStats; i++) {
          if (i !== minIdx) {
            currentStats[i] += Math.floor(Math.random() * 2); // 0 또는 1
          }
        }

        // 최대 상승치 적용
        for (let i = 0; i < numStats; i++) {
          currentStats[i] = Math.min(currentStats[i], MAX_INCREASE);
        }
      }

      rounds += numRounds;

      // 목표 달성 여부 확인
      const sum = currentStats.reduce((a, b) => a + b, 0);
      
      if (sum >= targetSum) {
        successCount++;
        totalArtifacts += artifacts;
        totalRounds += rounds;
        break;
      }

      // 목표 달성 불가능 여부 확인
      const currentSum = currentStats.reduce((a, b) => a + b, 0);
      
      // 1. 이론적 최대 합계 확인
      const maxPossibleSum = numStats * MAX_INCREASE;
      if (maxPossibleSum < targetSum) {
        failed = true;
        break;
      }

      // 2. 모든 스텟이 최대치에 도달했는데 목표에 못 미치면 불가능
      const allMaxed = currentStats.every(stat => stat >= MAX_INCREASE);
      if (allMaxed && currentSum < targetSum) {
        failed = true;
        break;
      }

      // 3. 다음 유물로도 목표 달성 불가능한지 확인
      // 각 스텟의 남은 공간 계산
      const remainingSpaces = currentStats.map(stat => MAX_INCREASE - stat);
      const totalRemainingSpace = remainingSpaces.reduce((a, b) => a + b, 0);
      
      // 필요한 증가량
      const neededIncrease = targetSum - currentSum;
      
      // 한 유물당 최대 증가량 계산
      // 매 시행마다: 버튼 누른 스텟은 최대 3 증가, 나머지는 각 최대 1 증가
      // 이론적 최대: numRounds * (3 + (numStats-1) * 1) = numRounds * (numStats + 2)
      // 하지만 각 스텟의 최대치 제한을 고려해야 함
      const theoreticalMaxPerArtifact = numRounds * (numStats + 2);
      const spaceLimitedMax = totalRemainingSpace;
      const maxPossibleIncreaseFromOneArtifact = Math.min(theoreticalMaxPerArtifact, spaceLimitedMax);
      
      // 현재 합계 + 한 유물당 최대 증가량이 목표치보다 작으면 불가능
      if (currentSum + maxPossibleIncreaseFromOneArtifact < targetSum) {
        failed = true;
        break;
      }

      // 다음 유물 사용 가능
      statValues = currentStats;
    }

    // 실패한 경우는 카운트하지 않음 (이미 위에서 처리됨)
  }

  const probability = successCount / numSimulations;
  const avgArtifacts = successCount > 0 ? totalArtifacts / successCount : 0;
  const avgRounds = successCount > 0 ? totalRounds / successCount : 0;

  return {
    probability,
    successCount,
    totalSimulations: numSimulations,
    avgArtifacts,
    avgRounds
  };
}

/**
 * 기댓값 계산 (유물 비용 포함)
 * @param {number} numStats - 선택한 스텟 개수
 * @param {number} numRounds - 시행 횟수
 * @param {number} targetSum - 목표 합계
 * @param {number} artifactCost - 유물당 비용
 * @param {number} numSimulations - 시뮬레이션 반복 횟수
 * @returns {Object} 결과 객체
 */
export function calculateExpectedValue(numStats, numRounds, targetSum, artifactCost, numSimulations = 100000) {
  const result = runSimulation(numStats, numRounds, targetSum, numSimulations);
  
  const avgGold = result.avgArtifacts * artifactCost;
  
  return {
    ...result,
    avgGold,
    artifactCost
  };
}


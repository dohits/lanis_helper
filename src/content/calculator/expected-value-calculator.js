// 기댓값 계산기 클래스
class ExpectedValueCalculator {
  constructor() {
    // 공통 조합비
    this.baseCost = 300000; // 1회 조합비용 30만원
    
    this.itemData = {
      vitality_potion: {
        name: '활력의 포션',
        materials: [
          { name: '마녀의 레시피', key: 'recipe' }
        ],
        successRates: {
          2: 0.30, // 마녀의 레시피 2개: 30%
          3: 0.45, // 마녀의 레시피 3개: 45%
          4: 0.60, // 마녀의 레시피 4개: 60%
          5: 0.75, // 마녀의 레시피 5개: 75%
          6: 0.90, // 마녀의 레시피 6개: 90%
          7: 1.00  // 마녀의 레시피 7개: 100%
        }
      },
      seal_key: {
        name: '봉인의 열쇠',
        materials: [
          { name: '붉은 결정', key: 'redCrystal' },
          { name: '푸른 결정', key: 'blueCrystal' },
          { name: '고급 가죽끈', key: 'highGradeLeather' }
        ],
        successRates: {
          3: 0.70, // 붉은 결정 1 + 푸른 결정 1 + 고급 가죽끈 1 + 30만 골드 = 70%
          4: 0.80, // 아무 피스나 1개 추가시 +10%
          5: 0.90, // 아무 피스나 1개 추가시 +10%
          6: 1.00  // 붉은 결정 2 + 푸른 결정 2 + 고급 가죽끈 2 + 30만 골드 = 100%
        }
      },
      blue_crystal: {
        name: '푸른 결정',
        materials: [
          { name: '푸른 구슬', key: 'blueBead' },
          { name: '슬라임의 체액', key: 'slimeFluid' }
        ],
        successRates: {
          2: 0.70, // 푸른 구슬 1 + 슬라임의 체액 1 = 70%
          3: 0.85, // 아무 피스나 1개 추가시 +15%
          4: 1.00  // 푸른 구슬 2 + 슬라임의 체액 2 = 100%
        }
      },
      red_crystal: {
        name: '붉은 결정',
        materials: [
          { name: '붉은 구슬', key: 'redBead' },
          { name: '까마귀의 발톱', key: 'crowClaw' }
        ],
        successRates: {
          2: 0.70, // 붉은 구슬 1 + 까마귀의 발톱 1 = 70%
          3: 0.85, // 아무 피스나 1개 추가시 +15%
          4: 1.00  // 붉은 구슬 2 + 까마귀의 발톱 2 = 100%
        }
      },
      old_leather_strap: {
        name: '낡은 가죽끈',
        materials: [
          { name: '낡은 가죽', key: 'oldLeather' }
        ],
        successRates: {
          2: 0.70, // 낡은 가죽 2개 = 70%
          3: 0.85, // 낡은 가죽 3개 = 85%
          4: 1.00  // 낡은 가죽 4개 = 100%
        }
      },

      high_grade_leather: {
        name: '고급 가죽끈',
        materials: [
          { name: '고급 가죽', key: 'highGradeLeather' },
          { name: '가죽끈', key: 'leatherStrap' }
        ],
        successRates: {
          2: 0.70, // 고급 가죽 2개 또는 가죽끈 2개 = 70%
          3: 0.85, // 고급 가죽 3개 또는 가죽끈 3개 = 85%
          4: 1.00  // 고급 가죽 4개 또는 가죽끈 4개 = 100%
        },
        // 특별한 조합 방식: 두 재료 중 하나만 선택
        combinationType: 'single_material'
      },
      iron_hammer: {
        name: '쇠망치',
        materials: [
          { name: '나무 막대기', key: 'woodenStick' },
          { name: '코크스', key: 'coke' },
          { name: '철광석', key: 'ironOre' }
        ],
        successRates: {
          3: 0.70, // 나무 막대기 1 + 코크스 1 + 철광석 1 = 70%
          4: 0.80, // 아무 재료나 1개 추가 = 80%
          5: 0.90, // 아무 재료나 1개 추가 = 90%
          6: 1.00  // 나무 막대기 2 + 코크스 2 + 철광석 2 = 100%
        }
      },
      leather_strap: {
        name: '가죽끈',
        materials: [
          { name: '가죽', key: 'leather' },
          { name: '낡은 가죽끈', key: 'oldLeatherStrap' }
        ],
        successRates: {
          2: 0.70, // 가죽 2개 또는 낡은 가죽끈 2개 = 70%
          3: 0.85, // 가죽 3개 또는 낡은 가죽끈 3개 = 85%
          4: 1.00  // 가죽 4개 또는 낡은 가죽끈 4개 = 100%
        },
        // 특별한 조합 방식: 두 재료 중 하나만 선택
        combinationType: 'single_material'
      },

      iron_hammer: {
        name: '쇠망치',
        baseCost: 0,
        recipeCost: 0,
        successRates: {}
      },
      yellow_equipment: {
        name: '노랑 등급 장비',
        baseCost: 0,
        recipeCost: 0,
        successRates: {}
      },
      purple_equipment: {
        name: '보라 등급 장비',
        baseCost: 0,
        recipeCost: 0,
        successRates: {}
      },
      red_equipment: {
        name: '빨강 등급 장비',
        baseCost: 0,
        recipeCost: 0,
        successRates: {}
      }
    };
  }

  // 공통 기댓값 계산 함수
  calculateCommonExpectedValue(itemId, materialCosts, successRates) {
    const baseCost = this.baseCost;
    const item = this.itemData[itemId];
    const materials = item.materials;
    
    let bestExpectedValue = Infinity;
    let bestRecipeCount = 0;
    let bestSuccessRate = 0;
    let bestTotalCost = 0;
    let bestMaterialCost = 0;
    let bestCombination = '';
    
    // 각 재료 개수별로 기댓값 계산하여 최적 조합 찾기
    for (const [recipeCount, successRate] of Object.entries(successRates)) {
      const recipeCountNum = parseInt(recipeCount);
      
      // 실제 재료 조합 계산
      let actualCombination = '';
      let materialCost = 0;
      
      if (materials.length === 1) {
        // 단일 재료 아이템 (활력의 포션, 낡은 가죽끈)
        const material = materials[0];
        materialCost = recipeCountNum * materialCosts[material.key];
        actualCombination = `${material.name} ${recipeCountNum}개`;
      } else if (item.combinationType === 'single_material') {
        // 특별한 조합: 두 재료 중 하나만 선택 (가죽끈)
        const material1 = materials[0];
        const material2 = materials[1];
        const cost1 = materialCosts[material1.key];
        const cost2 = materialCosts[material2.key];
        
        // 더 싼 재료를 선택
        if (cost1 <= cost2) {
          materialCost = recipeCountNum * cost1;
          actualCombination = `${material1.name} ${recipeCountNum}개`;
        } else {
          materialCost = recipeCountNum * cost2;
          actualCombination = `${material2.name} ${recipeCountNum}개`;
        }
      } else {
        // 다중 재료 아이템
        const materialCounts = this.calculateOptimalMaterialDistribution(materials, recipeCountNum, materialCosts);
        materialCost = materialCounts.totalCost;
        actualCombination = materialCounts.combination;
      }
      
      const totalCost = baseCost + materialCost;
      const expectedValue = totalCost / successRate; // 성공 확률로 나누어 기댓값 계산
      
      // 더 낮은 기댓값(더 효율적인 조합)을 찾으면 업데이트
      if (expectedValue < bestExpectedValue) {
        bestExpectedValue = expectedValue;
        bestRecipeCount = recipeCountNum;
        bestSuccessRate = successRate;
        bestTotalCost = totalCost;
        bestMaterialCost = materialCost;
        bestCombination = actualCombination;
      }
    }
    
    return {
      bestExpectedValue: Math.round(bestExpectedValue),
      bestRecipeCount: bestRecipeCount,
      bestSuccessRate: bestSuccessRate,
      bestTotalCost: bestTotalCost,
      bestMaterialCost: bestMaterialCost,
      materialCosts: materialCosts,
      successRates: successRates,
      bestCombination: bestCombination,
      recipeCost: materials.length === 1 ? materialCosts[materials[0].key] : 0
    };
  }

  // 최적 재료 분배 계산 함수
  calculateOptimalMaterialDistribution(materials, totalCount, materialCosts) {
    const materialCounts = materials.map(material => ({
      name: material.name,
      key: material.key,
      cost: materialCosts[material.key],
      count: 0
    }));
    
    // 기본 조합 (모든 재료 1개씩)
    const baseCount = Math.floor(totalCount / materials.length);
    const remainingCount = totalCount % materials.length;
    
    // 기본 분배
    materialCounts.forEach(material => {
      material.count = baseCount;
    });
    
    // 남은 개수를 가장 싼 재료부터 추가
    if (remainingCount > 0) {
      const sortedMaterials = [...materialCounts].sort((a, b) => a.cost - b.cost);
      for (let i = 0; i < remainingCount; i++) {
        sortedMaterials[i].count++;
      }
    }
    
    // 조합 문자열 생성
    const combination = materialCounts
      .filter(material => material.count > 0)
      .map(material => `${material.name} ${material.count}개`)
      .join(' + ');
    
    // 총 비용 계산
    const totalCost = materialCounts.reduce((sum, material) => 
      sum + (material.count * material.cost), 0);
    
    return {
      combination,
      totalCost
    };
  }

  // 활력의 포션 기댓값 계산
  calculateVitalityPotionExpectedValue(recipeCost) {
    const item = this.itemData.vitality_potion;
    const materialCosts = { recipe: recipeCost };
    return this.calculateCommonExpectedValue('vitality_potion', materialCosts, item.successRates);
  }

  // 봉인의 열쇠 기댓값 계산
  calculateSealKeyExpectedValue(materialCosts) {
    const item = this.itemData.seal_key;
    return this.calculateCommonExpectedValue('seal_key', materialCosts, item.successRates);
  }

  // 푸른 결정 기댓값 계산
  calculateBlueCrystalExpectedValue(materialCosts) {
    const item = this.itemData.blue_crystal;
    return this.calculateCommonExpectedValue('blue_crystal', materialCosts, item.successRates);
  }

  // 붉은 결정 기댓값 계산
  calculateRedCrystalExpectedValue(materialCosts) {
    const item = this.itemData.red_crystal;
    const baseCost = this.baseCost;
    const successRates = item.successRates;
    
    let bestExpectedValue = Infinity;
    let bestRecipeCount = 0;
    let bestSuccessRate = 0;
    let bestTotalCost = 0;
    let bestMaterialCost = 0;
    let bestCombination = '';
    
    return this.calculateCommonExpectedValue('red_crystal', materialCosts, successRates);
  }

  // 낡은 가죽끈 기댓값 계산
  calculateOldLeatherStrapExpectedValue(recipeCost) {
    const item = this.itemData.old_leather_strap;
    const baseCost = this.baseCost;
    const successRates = item.successRates;
    
    let bestExpectedValue = Infinity;
    let bestRecipeCount = 0;
    let bestSuccessRate = 0;
    let bestTotalCost = 0;
    
    const materialCosts = { oldLeather: recipeCost };
    return this.calculateCommonExpectedValue('old_leather_strap', materialCosts, successRates);
  }

  // 가죽끈 기댓값 계산
  calculateLeatherStrapExpectedValue(materialCosts) {
    const item = this.itemData.leather_strap;
    return this.calculateCommonExpectedValue('leather_strap', materialCosts, item.successRates);
  }

  // 고급 가죽끈 기댓값 계산
  calculateHighGradeLeatherExpectedValue(materialCosts) {
    const item = this.itemData.high_grade_leather;
    return this.calculateCommonExpectedValue('high_grade_leather', materialCosts, item.successRates);
  }

  // 쇠망치 기댓값 계산
  calculateIronHammerExpectedValue(materialCosts) {
    const item = this.itemData.iron_hammer;
    return this.calculateCommonExpectedValue('iron_hammer', materialCosts, item.successRates);
  }

  // 일반적인 기댓값 계산 (다른 아이템용)
  calculateExpectedValue(itemId, recipeCost) {
    const item = this.itemData[itemId];
    if (!item) {
      throw new Error(`Unknown item: ${itemId}`);
    }

    // 활력의 포션은 특별한 계산 로직 사용
    if (itemId === 'vitality_potion') {
      return this.calculateVitalityPotionExpectedValue(recipeCost);
    }

    // 봉인의 열쇠는 특별한 계산 로직 사용
    if (itemId === 'seal_key') {
      return this.calculateSealKeyExpectedValue(recipeCost);
    }

    // 푸른 결정은 특별한 계산 로직 사용
    if (itemId === 'blue_crystal') {
      return this.calculateBlueCrystalExpectedValue(recipeCost);
    }

    // 붉은 결정은 특별한 계산 로직 사용
    if (itemId === 'red_crystal') {
      return this.calculateRedCrystalExpectedValue(recipeCost);
    }

    // 낡은 가죽끈은 별도의 계산 로직 사용
    if (itemId === 'old_leather_strap') {
      return this.calculateOldLeatherStrapExpectedValue(recipeCost);
    }

    // 가죽끈은 특별한 계산 로직 사용
    if (itemId === 'leather_strap') {
      return this.calculateLeatherStrapExpectedValue(recipeCost);
    }

    // 고급 가죽끈은 특별한 계산 로직 사용
    if (itemId === 'high_grade_leather') {
      return this.calculateHighGradeLeatherExpectedValue(recipeCost);
    }

    // 쇠망치는 특별한 계산 로직 사용
    if (itemId === 'iron_hammer') {
      return this.calculateIronHammerExpectedValue(recipeCost);
    }

    // 다른 아이템들은 기본 계산 로직 사용
    return {
      averageExpectedValue: 0,
      totalCost: 0,
      recipeCost: recipeCost,
      successRates: item.successRates
    };
  }

  // 아이템 정보 가져오기
  getItemInfo(itemId) {
    return this.itemData[itemId] || null;
  }

  // 모든 아이템 목록 가져오기
  getAllItems() {
    return Object.keys(this.itemData).map(id => ({
      id: id,
      name: this.itemData[id].name
    }));
  }
}

// ES6 모듈로 export
export default ExpectedValueCalculator; 
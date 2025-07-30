import { COMBINE_ITEM_CONFIGS, DISMANTLE_ITEM_CONFIGS, isCombineItem, isDismantleItem } from './item-configs.js';

// 기댓값 계산기 클래스
class ExpectedValueCalculator {
  constructor() {
    // 공통 조합비
    this.baseCost = 300000; // 1회 조합비용 30만원
    
    // 조합 아이템 데이터
    this.itemData = COMBINE_ITEM_CONFIGS;
    
    // 분해 관련 데이터
    this.dismantleData = DISMANTLE_ITEM_CONFIGS;
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

  // 분해 기댓값 계산 메서드들
  calculateDismantleExpectedValue(equipmentType, rewardPrices) {
    const dismantleItem = this.dismantleData[equipmentType];
    if (!dismantleItem) {
      throw new Error(`Unknown dismantle equipment type: ${equipmentType}`);
    }

    const cost = dismantleItem.cost; // 분해 비용 (보통 0)
    let totalExpectedValue = 0;
    let minExpectedValue = 0;
    let maxExpectedValue = 0;
    const rewards = [];

    // 각 보상 아이템의 기댓값 계산
    for (const [rewardKey, reward] of Object.entries(dismantleItem.rewards)) {
      const price = rewardPrices[rewardKey] || 0;
      const expectedQuantity = reward.average; // 평균 개수
      const minQuantity = reward.min;
      const maxQuantity = reward.max;
      
      const expectedValue = price * expectedQuantity;
      const minValue = price * minQuantity;
      const maxValue = price * maxQuantity;
      
      totalExpectedValue += expectedValue;
      minExpectedValue += minValue;
      maxExpectedValue += maxValue;
      
      rewards.push({
        name: reward.name,
        min: reward.min,
        max: reward.max,
        average: reward.average,
        price: price,
        expectedValue: expectedValue,
        minValue: minValue,
        maxValue: maxValue
      });
    }

    return {
      equipmentType: equipmentType,
      equipmentName: dismantleItem.name,
      cost: cost,
      totalExpectedValue: Math.round(totalExpectedValue),
      minExpectedValue: Math.round(minExpectedValue),
      maxExpectedValue: Math.round(maxExpectedValue),
      netExpectedValue: Math.round(totalExpectedValue - cost), // 순 기댓값 (비용 차감)
      rewards: rewards,
      isProfitable: totalExpectedValue > cost
    };
  }

  // 흰색 장비 분해 기댓값 계산
  calculateWhiteEquipmentDismantleExpectedValue(rewardPrices) {
    return this.calculateDismantleExpectedValue('white_equipment', rewardPrices);
  }

  // 파랑 장비 분해 기댓값 계산
  calculateBlueEquipmentDismantleExpectedValue(rewardPrices) {
    return this.calculateDismantleExpectedValue('blue_equipment', rewardPrices);
  }

  // 노랑 장비 분해 기댓값 계산
  calculateYellowEquipmentDismantleExpectedValue(rewardPrices) {
    return this.calculateDismantleExpectedValue('yellow_equipment', rewardPrices);
  }

                    // 보라 장비 분해 기댓값 계산
                  calculatePurpleEquipmentDismantleExpectedValue(rewardPrices) {
                    return this.calculateDismantleExpectedValue('purple_equipment', rewardPrices);
                  }
                
                  // 빨강 장비 분해 기댓값 계산
                  calculateRedEquipmentDismantleExpectedValue(rewardPrices) {
                    return this.calculateDismantleExpectedValue('red_equipment', rewardPrices);
                  }
                
                  // 분해 가능한 장비 목록 가져오기
  getDismantleableEquipment() {
    return Object.keys(this.dismantleData).map(key => ({
      id: key,
      name: this.dismantleData[key].name
    }));
  }

  // 분해 데이터 가져오기
  getDismantleData(equipmentType) {
    return this.dismantleData[equipmentType] || null;
  }
}

// ES6 모듈로 export
export default ExpectedValueCalculator; 
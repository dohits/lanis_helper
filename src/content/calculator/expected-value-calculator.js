import { COMBINE_ITEM_CONFIGS, DISMANTLE_ITEM_CONFIGS, CALCULATION_RULES, isCombineItem, isDismantleItem } from './item-configs.js';

// 계산 전략 인터페이스
class CalculationStrategy {
  calculate(materialCosts, count, config, rules) {
    throw new Error('calculate must be implemented');
  }
}

// 단일 재료 계산 전략
class SingleMaterialStrategy extends CalculationStrategy {
  calculate(materialCosts, count, config, rules) {
    return {
      totalCost: rules.materialCostFormula(materialCosts, count),
      combination: rules.combinationFormula(config.materials, count)
    };
  }
}

// 다중 재료 계산 전략
class MultiMaterialStrategy extends CalculationStrategy {
  calculate(materialCosts, count, config, rules) {
    return rules.materialCostFormula(materialCosts, count, config.materials);
  }
}

// 선택형 단일 재료 계산 전략
class SingleMaterialChoiceStrategy extends CalculationStrategy {
  calculate(materialCosts, count, config, rules) {
    return {
      totalCost: rules.materialCostFormula(materialCosts, count),
      combination: rules.combinationFormula(config.materials, materialCosts, count)
    };
  }
}

// 분해 계산 전략
class DismantleCalculationStrategy extends CalculationStrategy {
  calculate(rewardPrices, config) {
    let minExpectedValue = 0;
    let maxExpectedValue = 0;
    let totalExpectedValue = 0;
    const rewards = [];

    // 각 보상 아이템별 기댓값 계산
    for (const [rewardKey, reward] of Object.entries(config.rewards)) {
      const price = rewardPrices[rewardKey];
      if (!price || price <= 0) {
        throw new Error(`${reward.name}의 시세를 입력해주세요.`);
      }

      const minValue = reward.min * price;
      const maxValue = reward.max * price;
      const averageValue = reward.average * price;

      minExpectedValue += minValue;
      maxExpectedValue += maxValue;
      totalExpectedValue += averageValue;

      rewards.push({
        name: reward.name,
        min: reward.min,
        max: reward.max,
        average: reward.average,
        minValue,
        maxValue,
        averageValue
      });
    }

    return {
      equipmentName: config.name,
      cost: 0, // 분해는 공짜
      minExpectedValue: Math.round(minExpectedValue),
      maxExpectedValue: Math.round(maxExpectedValue),
      totalExpectedValue: Math.round(totalExpectedValue),
      rewards
    };
  }
}

// 기댓값 계산기 클래스
class ExpectedValueCalculator {
  constructor() {
    // 공통 조합비
    this.baseCost = 300000; // 1회 조합비용 30만원
    
    // 조합 아이템 데이터
    this.itemData = COMBINE_ITEM_CONFIGS;
    
    // 분해 관련 데이터
    this.dismantleData = DISMANTLE_ITEM_CONFIGS;
    
    // 계산 전략들
    this.strategies = {
      'single_material': new SingleMaterialStrategy(),
      'multi_material': new MultiMaterialStrategy(),
      'single_material_choice': new SingleMaterialChoiceStrategy()
    };
    
    // 분해 계산 전략
    this.dismantleStrategy = new DismantleCalculationStrategy();
  }

  // 범용 기댓값 계산 함수 (전략 패턴 적용)
  calculateExpectedValue(itemId, materialCosts) {
    const config = this.itemData[itemId];
    const rules = CALCULATION_RULES[itemId];
    
    if (!config || !rules) {
      throw new Error(`Unknown item or calculation rules: ${itemId}`);
    }

    let bestExpectedValue = Infinity;
    let bestRecipeCount = 0;
    let bestSuccessRate = 0;
    let bestTotalCost = 0;
    let bestMaterialCost = 0;
    let bestCombination = '';
    
    // 계산 전략 선택
    const strategy = this.selectStrategy(rules.type);
    
    // 각 재료 개수별로 기댓값 계산하여 최적 조합 찾기
    for (const [recipeCount, successRate] of Object.entries(config.successRates)) {
      const recipeCountNum = parseInt(recipeCount);
      
      // 전략을 사용하여 재료 비용 계산
      const materialCostResult = strategy.calculate(materialCosts, recipeCountNum, config, rules);
      
      const materialCost = materialCostResult.totalCost;
      const actualCombination = materialCostResult.combination;
      
      const totalCost = rules.baseCost + materialCost;
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
      successRates: config.successRates,
      bestCombination: bestCombination,
      recipeCost: config.materials.length === 1 ? materialCosts[config.materials[0].key] : 0
    };
  }

  // 계산 전략 선택
  selectStrategy(type) {
    const strategy = this.strategies[type];
    if (!strategy) {
      throw new Error(`Unknown calculation type: ${type}`);
    }
    return strategy;
  }

  // 아이템 정보 가져오기
  getItemInfo(itemId) {
    const config = this.itemData[itemId];
    if (!config) {
      throw new Error(`Unknown item: ${itemId}`);
    }
    return {
      id: itemId,
      name: config.name,
      materials: config.materials
    };
  }

  // 모든 아이템 정보 가져오기
  getAllItems() {
    return Object.keys(this.itemData).map(itemId => this.getItemInfo(itemId));
  }

  // 범용 분해 기댓값 계산 (전략 패턴 적용)
  calculateDismantleExpectedValue(equipmentType, rewardPrices) {
    const config = this.dismantleData[equipmentType];
    if (!config) {
      throw new Error(`Unknown equipment type: ${equipmentType}`);
    }

    return this.dismantleStrategy.calculate(rewardPrices, config);
  }

  // 분해 가능한 장비 목록 가져오기
  getDismantleableEquipment() {
    return Object.keys(this.dismantleData).map(equipmentType => ({
      type: equipmentType,
      name: this.dismantleData[equipmentType].name
    }));
  }

  // 분해 데이터 가져오기
  getDismantleData(equipmentType) {
    return this.dismantleData[equipmentType];
  }
}

export default ExpectedValueCalculator; 
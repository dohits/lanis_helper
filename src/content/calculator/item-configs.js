/**
 * 아이템 설정 중앙 관리 모듈
 * 조합 아이템과 분해 아이템의 설정을 통합 관리
 */

// 조합 아이템 설정
export const COMBINE_ITEM_CONFIGS = {
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
    },
    type: 'single',
    calculationType: 'single_material'
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
    },
    type: 'multi',
    calculationType: 'multi_material'
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
    },
    type: 'multi',
    calculationType: 'multi_material'
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
    },
    type: 'multi',
    calculationType: 'multi_material'
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
    },
    type: 'single',
    calculationType: 'single_material'
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
    type: 'single_material',
    calculationType: 'single_material_choice'
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
    type: 'single_material',
    calculationType: 'single_material_choice'
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
      4: 0.85, // 아무 피스나 1개 추가시 +15%
      5: 1.00  // 나무 막대기 2 + 코크스 1 + 철광석 2 = 100%
    },
    type: 'multi',
    calculationType: 'multi_material'
  },
  forest_essence: {
    name: '[조합]숲의 정수',
    materials: [
      { name: '다크엘프의 화살', key: 'darkElfArrow' },
      { name: '프리스트의 성서', key: 'priestBible' },
      { name: '잔다르크의 투구', key: 'joanHelmet' },
      { name: '히드라의 피', key: 'hydraBlood' },
      { name: '피닉스의 깃털', key: 'phoenixFeather' },
      { name: '드리아드의 뼈', key: 'dryadBone' }
    ],
    successRates: {
      6: 1.00  // 모든 재료 1개씩 = 100%
    },
    type: 'multi',
    calculationType: 'multi_material'
  },
  tower_essence: {
    name: '[조합]탑의 정수',
    materials: [
      { name: '황제의 두루마리', key: 'emperorScroll' },
      { name: '백호의 가죽', key: 'whiteTigerLeather' },
      { name: '네크로맨서의 책', key: 'necromancerBook' },
      { name: '주작의 깃털', key: 'vermilionBirdFeather' },
      { name: '켄타우로스의 활', key: 'centaurBow' },
      { name: '선인의 술병', key: 'sageWineBottle' }
    ],
    successRates: {
      6: 1.00  // 모든 재료 1개씩 = 100%
    },
    type: 'multi',
    calculationType: 'multi_material'
  }
};

// 분해 아이템 설정
export const DISMANTLE_ITEM_CONFIGS = {
  white_equipment: {
    name: '흰색 등급 장비',
    cost: 0, // 분해는 공짜
    type: 'dismantle',
    rewards: {
      agreement_box_piece: {
        name: '동의 상자 조각',
        min: 1,
        max: 3,
        average: 2
      },
      material_box_piece: {
        name: '재료 상자 조각',
        min: 1,
        max: 3,
        average: 2
      }
    }
  },
  blue_equipment: {
    name: '파랑 등급 장비',
    cost: 0, // 분해는 공짜
    type: 'dismantle',
    rewards: {
      silver_box_piece: {
        name: '은의 상자 조각',
        min: 1,
        max: 4,
        average: 2.5
      },
      material_box_piece: {
        name: '재료 상자 조각',
        min: 2,
        max: 5,
        average: 3.5
      }
    }
  },
  yellow_equipment: {
    name: '노랑 등급 장비',
    cost: 0, // 분해는 공짜
    type: 'dismantle',
    rewards: {
      silver_box_piece: {
        name: '은의 상자 조각',
        min: 4,
        max: 6,
        average: 5
      },
      material_box_piece: {
        name: '재료 상자 조각',
        min: 4,
        max: 7,
        average: 5.5
      }
    }
  },
  purple_equipment: {
    name: '보라 등급 장비',
    cost: 0, // 분해는 공짜
    type: 'dismantle',
    rewards: {
      gold_box_piece: {
        name: '금의 상자 조각',
        min: 5,
        max: 8,
        average: 6.5
      },
      material_box_piece: {
        name: '재료 상자 조각',
        min: 6,
        max: 9,
        average: 7.5
      }
    }
  },
  red_equipment: {
    name: '빨강 등급 장비',
    cost: 0, // 분해는 공짜
    type: 'dismantle',
    rewards: {
      gold_box_piece: {
        name: '금의 상자 조각',
        min: 7,
        max: 10,
        average: 8.5
      },
      material_box_piece: {
        name: '재료 상자 조각',
        min: 8,
        max: 11,
        average: 9.5
      }
    }
  }
};

// 계산 규칙 설정
export const CALCULATION_RULES = {
  vitality_potion: {
    type: 'single_material',
    baseCost: 300000,
    materialCostFormula: (materialCosts, count) => {
      return count * materialCosts.recipe;
    },
    combinationFormula: (materials, count) => {
      return `${materials[0].name} ${count}개`;
    }
  },
  
  seal_key: {
    type: 'multi_material',
    baseCost: 300000,
    materialCostFormula: (materialCosts, count) => {
      // 다중 재료 최적 분배 계산
      return calculateOptimalDistribution(materialCosts, count, COMBINE_ITEM_CONFIGS.seal_key.materials);
    },
    combinationFormula: (materials, count) => {
      return `재료 ${count}개 조합`;
    }
  },
  
  blue_crystal: {
    type: 'multi_material',
    baseCost: 300000,
    materialCostFormula: (materialCosts, count) => {
      return calculateOptimalDistribution(materialCosts, count, COMBINE_ITEM_CONFIGS.blue_crystal.materials);
    },
    combinationFormula: (materials, count) => {
      return `재료 ${count}개 조합`;
    }
  },
  
  red_crystal: {
    type: 'multi_material',
    baseCost: 300000,
    materialCostFormula: (materialCosts, count) => {
      return calculateOptimalDistribution(materialCosts, count, COMBINE_ITEM_CONFIGS.red_crystal.materials);
    },
    combinationFormula: (materials, count) => {
      return `재료 ${count}개 조합`;
    }
  },
  
  old_leather_strap: {
    type: 'single_material',
    baseCost: 300000,
    materialCostFormula: (materialCosts, count) => {
      return count * materialCosts.oldLeather;
    },
    combinationFormula: (materials, count) => {
      return `${materials[0].name} ${count}개`;
    }
  },
  
  leather_strap: {
    type: 'single_material_choice',
    baseCost: 300000,
    materialCostFormula: (materialCosts, count) => {
      // 두 재료 중 더 싼 것 선택
      const cost1 = materialCosts.leather;
      const cost2 = materialCosts.oldLeatherStrap;
      return count * Math.min(cost1, cost2);
    },
    combinationFormula: (materials, materialCosts, count) => {
      const cost1 = materialCosts.leather;
      const cost2 = materialCosts.oldLeatherStrap;
      const cheaperMaterial = cost1 <= cost2 ? materials[0] : materials[1];
      return `${cheaperMaterial.name} ${count}개`;
    }
  },
  
  high_grade_leather: {
    type: 'single_material_choice',
    baseCost: 300000,
    materialCostFormula: (materialCosts, count) => {
      // 두 재료 중 더 싼 것 선택
      const cost1 = materialCosts.highGradeLeather;
      const cost2 = materialCosts.leatherStrap;
      return count * Math.min(cost1, cost2);
    },
    combinationFormula: (materials, materialCosts, count) => {
      const cost1 = materialCosts.highGradeLeather;
      const cost2 = materialCosts.leatherStrap;
      const cheaperMaterial = cost1 <= cost2 ? materials[0] : materials[1];
      return `${cheaperMaterial.name} ${count}개`;
    }
  },
  
  iron_hammer: {
    type: 'multi_material',
    baseCost: 300000,
    materialCostFormula: (materialCosts, count) => {
      return calculateOptimalDistribution(materialCosts, count, COMBINE_ITEM_CONFIGS.iron_hammer.materials);
    },
    combinationFormula: (materials, count) => {
      return `재료 ${count}개 조합`;
    }
  },
  
  forest_essence: {
    type: 'multi_material',
    baseCost: 300000,
    materialCostFormula: (materialCosts, count) => {
      return calculateOptimalDistribution(materialCosts, count, COMBINE_ITEM_CONFIGS.forest_essence.materials);
    },
    combinationFormula: (materials, count) => {
      return `재료 ${count}개 조합`;
    }
  },
  
  tower_essence: {
    type: 'multi_material',
    baseCost: 300000,
    materialCostFormula: (materialCosts, count) => {
      return calculateOptimalDistribution(materialCosts, count, COMBINE_ITEM_CONFIGS.tower_essence.materials);
    },
    combinationFormula: (materials, count) => {
      return `재료 ${count}개 조합`;
    }
  }
};

// 다중 재료 최적 분배 계산 함수
function calculateOptimalDistribution(materialCosts, totalCount, materialConfigs) {
  // materialCosts와 materialConfigs를 매핑
  const materials = materialConfigs.map(material => ({
    key: material.key,
    name: material.name,
    cost: materialCosts[material.key],
    count: 0
  }));
  
  // 기본 조합 (모든 재료 1개씩)
  const baseCount = Math.floor(totalCount / materials.length);
  const remainingCount = totalCount % materials.length;
  
  // 기본 분배
  materials.forEach(material => {
    material.count = baseCount;
  });
  
  // 남은 개수를 가장 싼 재료부터 추가
  if (remainingCount > 0) {
    const sortedMaterials = [...materials].sort((a, b) => a.cost - b.cost);
    for (let i = 0; i < remainingCount; i++) {
      sortedMaterials[i].count++;
    }
  }
  
  return {
    totalCost: materials.reduce((sum, material) => 
      sum + (material.count * material.cost), 0),
    combination: materials
      .filter(material => material.count > 0)
      .map(material => `${material.name} ${material.count}개`)
      .join(' + ')
  };
}

// 모든 아이템 설정 통합
export const ALL_ITEM_CONFIGS = {
  ...COMBINE_ITEM_CONFIGS,
  ...DISMANTLE_ITEM_CONFIGS
};

// 조합 아이템 목록 가져오기
export const getCombineItems = () => {
  return Object.keys(COMBINE_ITEM_CONFIGS).map(id => ({
    id: id,
    name: COMBINE_ITEM_CONFIGS[id].name
  }));
};

// 분해 아이템 목록 가져오기
export const getDismantleItems = () => {
  return Object.keys(DISMANTLE_ITEM_CONFIGS).map(id => ({
    id: id,
    name: DISMANTLE_ITEM_CONFIGS[id].name
  }));
};

// 모든 아이템 목록 가져오기
export const getAllItems = () => {
  return Object.keys(ALL_ITEM_CONFIGS).map(id => ({
    id: id,
    name: ALL_ITEM_CONFIGS[id].name
  }));
};

// 아이템 정보 가져오기
export const getItemConfig = (itemId) => {
  return ALL_ITEM_CONFIGS[itemId] || null;
};

// 조합 아이템인지 확인
export const isCombineItem = (itemId) => {
  return itemId in COMBINE_ITEM_CONFIGS;
};

// 분해 아이템인지 확인
export const isDismantleItem = (itemId) => {
  return itemId in DISMANTLE_ITEM_CONFIGS;
}; 
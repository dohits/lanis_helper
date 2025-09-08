// 장비 감정 시뮬 모달 공통 데이터 및 유틸리티
import EquipmentDrawAPI from '../../../../../../api/googleSheetLoad/equipmentDrawAPI.js';
import GradeCalculator from '../../../../../dom-modules/item-stats/GradeCalculator.js';
import FinalTagAdder from '../../../../../dom-modules/item-stats/FinalTagAdder.js';
import ITEM_COLORS from '../../../../../../styles/item-colors.js';
import EnchantInfoRegistrationAPI from '../../../../../../api/googleSheetWrite/enchantInfoRegistrationAPI.js';

// 공통 API 인스턴스들
export const equipmentDrawAPI = new EquipmentDrawAPI();
export const gradeCalculator = new GradeCalculator();
export const finalTagAdder = new FinalTagAdder();
export const enchantInfoRegistrationAPI = new EnchantInfoRegistrationAPI();

// 장비 타입 감지 함수
export function detectEquipmentType(itemName, equipmentType = null) {
  // equipmentType이 제공되면 우선 사용
  if (equipmentType) {
    const type = equipmentType.toLowerCase();
    if (type.includes('장신구')) {
      return 'accessory';
    } else if (type.includes('방어구')) {
      return 'armor';
    } else if (type.includes('무기')) {
      return 'weapon';
    }
  }
  
  if (!itemName) return 'unknown';
  
  const name = itemName.toLowerCase();
  
  // 무기 키워드들
  const weaponKeywords = [
    '창', '도끼', '검', '나이프', '지팡이', '너클', '활'
  ];
  
  // 방어구 키워드
  const armorKeyword = '방어구';
  
  // 장신구 키워드들
  const accessoryKeywords = [
    '장신구', '목걸이', '반지', '귀걸이', '팔찌', '가락지', '물거울', '부적', '장식'
  ];
  
  // 장신구 체크
  if (accessoryKeywords.some(keyword => name.includes(keyword))) {
    return 'accessory';
  }
  
  // 방어구 체크
  if (name.includes(armorKeyword)) {
    return 'armor';
  }
  
  // 무기 체크
  if (weaponKeywords.some(keyword => name.includes(keyword))) {
    return 'weapon';
  }
  
  // 기본값은 무기/방어구로 처리
  return 'weapon_armor';
}

// 최종 태그 포맷팅 함수
export function formatFinalTag(finalStats) {
  if (!finalStats) return '';
  
  let displayText = '';
  
  // 태그가 있는 경우 (완전무결, 종결, 준종결)
  if (finalStats.grade === '완전무결' || finalStats.grade === '종결' || finalStats.grade === '준종결') {
    displayText += `[${finalStats.grade}]`;
  }
  
  // 점수와 범위는 기본 색상
  displayText += ` ${finalStats.score}`;
  
  if (finalStats.tagMinValue !== null && finalStats.tagMaxValue !== null) {
    displayText += ` (${finalStats.tagMinValue}~${finalStats.tagMaxValue})`;
  }
  
  // 퍼센트는 별도로 처리 (색상 적용을 위해)
  if (finalStats.tagPercentage !== null) {
    displayText += ` (${finalStats.tagPercentage.toFixed(1)}%)`;
  }
  
  return displayText;
}

// 색상이 적용된 최종 태그 포맷팅 함수
export function formatFinalTagWithColor(finalStats, finalGradeColors) {
  if (!finalStats) return '';
  
  const tagColor = finalGradeColors[finalStats.grade] || '#CCCCCC';
  let html = '';
  
  // 태그가 있는 경우 (완전무결, 종결, 준종결)
  if (finalStats.grade === '완전무결' || finalStats.grade === '종결' || finalStats.grade === '준종결') {
    html += `<span style="color: ${tagColor}; font-size: 14px; font-weight: 600; font-style: italic;">[${finalStats.grade}]</span>`;
  }
  
  // 점수와 범위는 기본 색상
  let defaultText = ` ${finalStats.score}`;
  if (finalStats.tagMinValue !== null && finalStats.tagMaxValue !== null) {
    defaultText += ` (${finalStats.tagMinValue}~${finalStats.tagMaxValue})`;
  }
  html += `<span style="color: #CCCCCC; font-size: 14px; font-weight: 600; font-style: italic;">${defaultText}</span>`;
  
  // 퍼센트는 태그와 같은 색상
  if (finalStats.tagPercentage !== null) {
    html += `<span style="color: ${tagColor}; font-size: 14px; font-weight: 600; font-style: italic;"> (${finalStats.tagPercentage.toFixed(1)}%)</span>`;
  }
  
  return html;
}

// 위력 정보 포맷팅
export function formatPowerInfo(wikiItem) {
  if (wikiItem.power_min !== null && wikiItem.power_max !== null) {
    if (wikiItem.power_min === wikiItem.power_max) {
      return `${wikiItem.power_min}`;
    } else {
      return `${wikiItem.power_min}~${wikiItem.power_max}`;
    }
  }
  return '';
}

// 무게 정보 포맷팅
export function formatWeightInfo(wikiItem) {
  if (wikiItem.weight_min !== null && wikiItem.weight_max !== null) {
    if (wikiItem.weight_min === wikiItem.weight_max) {
      return `${wikiItem.weight_min}`;
    } else {
      return `${wikiItem.weight_min}~${wikiItem.weight_max}`;
    }
  }
  return '';
}

// 어빌리티 정보 포맷팅
export function formatAbilitiesInfo(wikiItem) {
  if (wikiItem.abilities && wikiItem.abilities.length > 0) {
    return wikiItem.abilities.join(', ');
  }
  return '';
}

// 속성 정보 포맷팅
export function formatAttributesInfo(wikiItem) {
  if (wikiItem.attributes && wikiItem.attributes.length > 0) {
    return wikiItem.attributes.join(', ');
  }
  return '';
}

// 위키에서 수집된 장비 정보 찾기
export async function findWikiItemInfo(equipmentName) {
  try {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['rareItems'], resolve);
    });

    if (!result.rareItems || result.rareItems.length === 0) {
      return null;
    }

    // 정확한 이름 매칭 시도
    let wikiItem = result.rareItems.find(item => 
      item.name && item.name.trim() === equipmentName.trim()
    );

    // 정확한 매칭이 없으면 부분 매칭 시도
    if (!wikiItem) {
      wikiItem = result.rareItems.find(item => 
        item.name && item.name.includes(equipmentName) || equipmentName.includes(item.name)
      );
    }

    return wikiItem || null;
  } catch (error) {
    console.error('위키 아이템 정보 검색 오류:', error);
    return null;
  }
}

// 현재 닉네임 가져오기
export function getCurrentNickname() {
  try {
    // sessionStorage에서 닉네임 가져오기
    return sessionStorage.getItem('lanis_user_nickname');
  } catch (error) {
    console.error('닉네임 가져오기 실패:', error);
    return null;
  }
}

// 감정된 스탯 생성
export function generateAppraisedStats(wikiItemInfo) {
  const stats = {};

  // 위력 감정
  if (wikiItemInfo.power_min !== null && wikiItemInfo.power_max !== null) {
    const powerValue = Math.floor(Math.random() * (wikiItemInfo.power_max - wikiItemInfo.power_min + 1)) + wikiItemInfo.power_min;
    const powerResult = gradeCalculator.calculateGrade(powerValue, wikiItemInfo.power_min, wikiItemInfo.power_max, false);
    
    stats.power = {
      value: powerValue,
      min: wikiItemInfo.power_min,
      max: wikiItemInfo.power_max,
      percent: powerResult.percentage?.toFixed(1) || '0.0',
      grade: powerResult.grade,
      score: powerResult.score,
      color: powerResult.color
    };
  }

  // 무게 감정
  if (wikiItemInfo.weight_min !== null && wikiItemInfo.weight_max !== null) {
    const weightValue = Math.floor(Math.random() * (wikiItemInfo.weight_max - wikiItemInfo.weight_min + 1)) + wikiItemInfo.weight_min;
    const weightResult = gradeCalculator.calculateGrade(weightValue, wikiItemInfo.weight_min, wikiItemInfo.weight_max, true);
    
    stats.weight = {
      value: weightValue,
      min: wikiItemInfo.weight_min,
      max: wikiItemInfo.weight_max,
      percent: weightResult.percentage?.toFixed(1) || '0.0',
      grade: weightResult.grade,
      score: weightResult.score,
      color: weightResult.color
    };
  }

  // 새로운 장비 태그 계산 로직 (DOM 모듈과 동일)
  const equipmentType = detectEquipmentType(wikiItemInfo.name, wikiItemInfo.type);
  let totalScore;
  let finalGrade = '최하급';
  let tagMinValue = null;
  let tagMaxValue = null;
  let tagPercentage = null;
  
  if (stats.power?.value !== null && stats.weight?.value !== null && 
      stats.power?.min !== null && stats.power?.max !== null && 
      stats.weight?.min !== null && stats.weight?.max !== null) {
    
    if (equipmentType === 'accessory') {
      // 장신구: 위력*5.5 - 무게*2
      totalScore = stats.power.value * 5.5 - stats.weight.value * 2;
      
      // 범위 계산
      tagMinValue = stats.power.min * 5.5 - stats.weight.max * 2;
      tagMaxValue = stats.power.max * 5.5 - stats.weight.min * 2;
      
      // 퍼센트 계산
      if (tagMinValue === tagMaxValue) {
        tagPercentage = 100.0;
      } else {
        tagPercentage = ((totalScore - tagMinValue) / (tagMaxValue - tagMinValue)) * 100;
        tagPercentage = Math.max(0, Math.min(100, Math.round((tagPercentage + Number.EPSILON) * 10) / 10));
      }
      
      // 등급 결정
      if (tagPercentage >= 100) {
        finalGrade = '완전무결';
      } else if (tagPercentage >= 95) {
        finalGrade = '종결';
      } else if (tagPercentage >= 90) {
        finalGrade = '준종결';
      }
    } else {
      // 무기/방어구: 위력 - 무게*2
      totalScore = stats.power.value - stats.weight.value * 2;
      
      // 범위 계산
      tagMinValue = stats.power.min - stats.weight.max * 2;
      tagMaxValue = stats.power.max - stats.weight.min * 2;
      
      // 퍼센트 계산
      if (tagMinValue === tagMaxValue) {
        tagPercentage = 100.0;
      } else {
        tagPercentage = ((totalScore - tagMinValue) / (tagMaxValue - tagMinValue)) * 100;
        tagPercentage = Math.max(0, Math.min(100, Math.round((tagPercentage + Number.EPSILON) * 10) / 10));
      }
      
      // 등급 결정
      if (tagPercentage >= 100) {
        finalGrade = '완전무결';
      } else if (tagPercentage >= 95) {
        finalGrade = '종결';
      } else if (tagPercentage >= 90) {
        finalGrade = '준종결';
      }
    }
  } else {
    // 데이터가 부족한 경우 폴백
    const powerScore = stats.power?.score || 0;
    const weightScore = stats.weight?.score || 0;
    totalScore = powerScore + weightScore;
  }
  
  stats.final = {
    score: totalScore,
    grade: finalGrade,
    tagMinValue: tagMinValue,
    tagMaxValue: tagMaxValue,
    tagPercentage: tagPercentage
  };

  return stats;
}

// 최종 등급 색상 매핑
export const finalGradeColors = {
  '완전무결': ITEM_COLORS.getGradeColor('무결'),
  '종결': ITEM_COLORS.getGradeColor('최상'),
  '준종결': ITEM_COLORS.getGradeColor('상'),
  '상급': ITEM_COLORS.getGradeColor('최상'),
  '중급': ITEM_COLORS.getGradeColor('중'),
  '하급': ITEM_COLORS.getGradeColor('하'),
  '최하급': ITEM_COLORS.getGradeColor('최하')
};

// 등급 계산 모듈
import ITEM_COLORS from '../../../styles/item-colors.js';

class GradeCalculator {
  constructor() {
    // 등급별 색상 매핑
    this.gradeColors = {
      '무결': ITEM_COLORS.getGradeColor('무결'),
      '완벽': ITEM_COLORS.getGradeColor('완벽'),
      '최상': ITEM_COLORS.getGradeColor('최상'),
      '상': ITEM_COLORS.getGradeColor('상'),
      '중': ITEM_COLORS.getGradeColor('중'),
      '하': ITEM_COLORS.getGradeColor('하'),
      '최하': ITEM_COLORS.getGradeColor('최하'),
      '불량': ITEM_COLORS.getGradeColor('불량'),
      '폐급': ITEM_COLORS.getGradeColor('폐급'),
      '누락': ITEM_COLORS.getGradeColor('누락')
    };
  }

  // 등급 계산 함수 (퍼센트, 점수 반환, 오차 방지, 다크모드 색상, 0값 지원)
  calculateGrade(currentValue, minValue, maxValue, isWeight = false) {
    // 유효하지 않은 값 처리 (0은 유효한 값)
    if (currentValue === null || currentValue === undefined || 
        minValue === null || minValue === undefined || 
        maxValue === null || maxValue === undefined) {
      return { grade: null, color: null, percentage: null, score: null };
    }

    // 현재값이 범위를 벗어나는 경우 (이상치)
    if (currentValue < minValue || currentValue > maxValue) {
      return { grade: '누락', color: this.gradeColors['누락'], percentage: null, score: null };
    }

    // 범위가 0인 경우 (최소값과 최대값이 같은 경우)
    if (minValue === maxValue) {
      if (currentValue === minValue) {
        return { grade: '무결', color: this.gradeColors['무결'], percentage: 100.0, score: 8 };
      } else {
        return { grade: null, color: null, percentage: null, score: null };
      }
    }

    // 퍼센트 계산 (음수 범위도 올바르게 처리)
    let percentage;
    if (minValue === maxValue) {
      percentage = 100.0;
    } else {
      const range = maxValue - minValue;
      percentage = ((currentValue - minValue) / range) * 100;
    }

    // 무게는 낮을수록 좋으므로 등급 판정 반전
    if (isWeight) {
      percentage = 100 - percentage;
      if (currentValue === minValue) {
        return { grade: '무결', color: this.gradeColors['무결'], percentage: 100.0, score: 8 };
      }
      if (currentValue === maxValue) {
        return { grade: '폐급', color: this.gradeColors['폐급'], percentage: 0, score: 0 };
      }
    } else {
      if (currentValue === minValue) {
        return { grade: '폐급', color: this.gradeColors['폐급'], percentage: 0, score: 0 };
      }
      if (currentValue === maxValue) {
        return { grade: '무결', color: this.gradeColors['무결'], percentage: 100.0, score: 8 };
      }
    }

    // 부동소수점 오차 방지 및 0~100 클램프, 소수점 1자리
    percentage = Math.max(0, Math.min(100, Math.round((percentage + Number.EPSILON) * 10) / 10));

    // 등급 결정 (최소치: 폐급, 5% 이하: 불량, 100%: 무결, 95%~: 완벽)
    let grade, score;
    if (isWeight) {
      if (percentage <= 5) {
        grade = '불량'; score = 1;
      } else if (percentage === 100.0) {
        grade = '무결'; score = 8;
      } else if (percentage >= 95) {
        grade = '완벽'; score = 7;
      } else if (percentage >= 90) {
        grade = '최상'; score = 6;
      } else if (percentage >= 70) {
        grade = '상'; score = 5;
      } else if (percentage >= 50) {
        grade = '중'; score = 4;
      } else if (percentage >= 30) {
        grade = '하'; score = 3;
      } else {
        grade = '최하'; score = 2;
      }
    } else {
      if (percentage <= 5) {
        grade = '불량'; score = 1;
      } else if (percentage === 100.0) {
        grade = '무결'; score = 8;
      } else if (percentage >= 95) {
        grade = '완벽'; score = 7;
      } else if (percentage >= 90) {
        grade = '최상'; score = 6;
      } else if (percentage >= 70) {
        grade = '상'; score = 5;
      } else if (percentage >= 50) {
        grade = '중'; score = 4;
      } else if (percentage >= 30) {
        grade = '하'; score = 3;
      } else {
        grade = '최하'; score = 2;
      }
    }

    const color = this.gradeColors[grade];
    return { grade, color, percentage, score };
  }

  // p 태그의 첫 번째 텍스트 노드(숫자)만 추출하는 유틸 함수
  getFirstNumberText(el) {
    if (!el) return '';
    const node = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
    return node ? node.textContent.trim() : '';
  }

  // valueElement에서 현재값, min, max를 정확히 추출하는 함수
  extractMainValueAndRange(valueElement) {
    let currentValue = null;
    let min = null, max = null;
    
    if (valueElement.childNodes.length > 0) {
      const firstText = valueElement.childNodes[0].nodeValue.trim();
      const match = firstText.match(/^(-?\d+)/);
      if (match) currentValue = parseInt(match[1]);
    }
    
    const span = valueElement.querySelector('span');
    if (span) {
      // 새로운 범위 패턴: (123 - 456) 또는 (123~456) 또는 (123 ~ 456) 패턴 추출
      const rangeMatch = span.textContent.match(/\(([-\d]+)\s*[-~]\s*([-\d]+)\)/);
      if (rangeMatch) {
        min = parseInt(rangeMatch[1]);
        max = parseInt(rangeMatch[2]);
      }
    }
    
    return { currentValue, min, max };
  }
}

export default GradeCalculator; 
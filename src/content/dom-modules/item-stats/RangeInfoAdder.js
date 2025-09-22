// 범위 정보 추가 모듈
import ITEM_COLORS from '../../../styles/item-colors.js';
import GradeCalculator from './GradeCalculator.js';
import FinalTagAdder from './FinalTagAdder.js';

class RangeInfoAdder {
  constructor() {
    this.gradeCalculator = new GradeCalculator();
    this.finalTagAdder = new FinalTagAdder();
  }

  // itemData가 없을 때도 domPowerMin 등으로 판정 가능하도록 파라미터 추가
  addRangeInfoToStats(container, itemData, domPowerMin, domPowerMax, domWeightMin, domWeightMax) {
    // itemData가 없으면 dom에서 추출한 값으로 대체
    if (!itemData) {
      itemData = {
        power_min: domPowerMin,
        power_max: domPowerMax,
        weight_min: domWeightMin,
        weight_max: domWeightMax
      };
    }

    const statContainers = container.querySelectorAll('.MuiBox-root.css-gg4vpm');
    let powerGrade = null;
    let weightGrade = null;
    let powerSummary = null;
    let weightSummary = null;

    statContainers.forEach((statContainer) => {
      const pElements = statContainer.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv, p.MuiTypography-root.MuiTypography-body2.css-1fxvmzd');
      if (pElements.length === 2) {
        const labelElement = pElements[0];
        const valueElement = pElements[1];
        const label = labelElement.textContent.trim();
        
        // 개선: DOM에서 현재값, min, max를 모두 추출
        const { currentValue, min, max } = this.gradeCalculator.extractMainValueAndRange(valueElement);
        
        // 위력 처리
        if (label === '위력' &&
            min !== null && max !== null && min !== max && typeof currentValue === 'number' && !isNaN(currentValue)) {
          if (valueElement.classList.contains('power-range-processed')) return;
          
          const { grade, color, percentage, score } = this.gradeCalculator.calculateGrade(currentValue, min, max);
          const isNarrow = Math.abs(max - min) <= 9;
          
          const gradeSpan = this.createElement('span', 'power-grade-info', 
            ` [${grade}]`, {
              style: `color: ${color}; font-size: 0.9em; font-weight: bold;`,
              'data-grade': grade
            }
          );
          
          const percentSpan = this.createElement('span', 'power-percent-info', 
            ` (${percentage.toFixed(1)}%)`, {
              style: `color: ${color}; font-size: 0.9em; font-weight: normal; font-style: italic;`
            }
          );
          
          // (범위 좁음) 안내
          let narrowSpan = null;
          if (isNarrow) {
            narrowSpan = this.createElement('span', 'narrow-range-info', 
              ' (범위 좁음)', {
                style: `color: ${ITEM_COLORS.common.narrow}; font-size: 0.9em; font-weight: bold;`
              }
            );
          }
          
          valueElement.appendChild(gradeSpan);
          valueElement.appendChild(document.createElement('br'));
          
          let detailRow = document.createElement('div');
          detailRow.className = 'stat-detail-row';
          detailRow.appendChild(percentSpan);
          if (narrowSpan) detailRow.appendChild(narrowSpan);
          valueElement.appendChild(detailRow);
          valueElement.classList.add('power-range-processed');
          
          // 퍼센트/점수/색상 저장
          powerSummary = { percent: percentage.toFixed(1), score, color };
          
          // 팝오버 위치 재조정
          const popover = container.closest('.MuiPopover-root');
          if (popover) {
            setTimeout(() => {
              this.adjustPopoverPosition(popover);
            }, 50);
          }
        }
        
        // 무게 처리
        if (label === '무게' &&
            min !== null && max !== null && min !== max && typeof currentValue === 'number' && !isNaN(currentValue)) {
          if (valueElement.classList.contains('weight-range-processed')) return;
          
          const { grade, color, percentage, score } = this.gradeCalculator.calculateGrade(currentValue, min, max, true);
          const isNarrow = Math.abs(max - min) <= 9;
          
          const gradeSpan = this.createElement('span', 'weight-grade-info', 
            ` [${grade}]`, {
              style: `color: ${color}; font-size: 0.9em; font-weight: bold;`,
              'data-grade': grade
            }
          );
          
          const percentSpan = this.createElement('span', 'weight-percent-info', 
            ` (${percentage.toFixed(1)}%)`, {
              style: `color: ${color}; font-size: 0.9em; font-weight: normal; font-style: italic;`
            }
          );
          
          // (범위 좁음) 안내
          let narrowSpan = null;
          if (isNarrow) {
            narrowSpan = this.createElement('span', 'narrow-range-info', 
              ' (범위 좁음)', {
                style: `color: ${ITEM_COLORS.common.narrow}; font-size: 0.9em; font-weight: bold;`
              }
            );
          }
          
          valueElement.appendChild(gradeSpan);
          valueElement.appendChild(document.createElement('br'));
          
          let detailRow = document.createElement('div');
          detailRow.className = 'stat-detail-row';
          detailRow.appendChild(percentSpan);
          if (narrowSpan) detailRow.appendChild(narrowSpan);
          valueElement.appendChild(detailRow);
          valueElement.classList.add('weight-range-processed');
          
          // 퍼센트/점수/색상 저장
          weightSummary = { percent: percentage.toFixed(1), score, color };
          
          // 팝오버 위치 재조정
          const popover = container.closest('.MuiPopover-root');
          if (popover) {
            setTimeout(() => {
              this.adjustPopoverPosition(popover);
            }, 50);
          }
        }
      }
    });

    // 종결/준종결/완전무결 태그 추가 (점수 기반, 범위좁음 예외, 점수 항상 표기)
    // label이 '위력', '무게'인 statContainer를 반드시 찾아 점수 계산
    let statPower = null, statWeight = null;
    statContainers.forEach(sc => {
      const labelEl = sc.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv, p.MuiTypography-root.MuiTypography-body2.css-1fxvmzd')[0];
      if (!labelEl) return;
      const label = labelEl.textContent.trim();
      if (label === '위력') statPower = sc.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv, p.MuiTypography-root.MuiTypography-body2.css-1fxvmzd')[1];
      if (label === '무게') statWeight = sc.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv, p.MuiTypography-root.MuiTypography-body2.css-1fxvmzd')[1];
    });

    let powerInfo = {score: 0, grade: ''};
    let weightInfo = {score: 0, grade: ''};
    
    // 첫 번째 텍스트 노드만 추출
    const powerText = this.gradeCalculator.getFirstNumberText(statPower);
    const weightText = this.gradeCalculator.getFirstNumberText(statWeight);
    
    // DOM에서 추출한 범위를 우선 사용 (위키 데이터와 관계없이)
    const powerMin = domPowerMin !== null ? domPowerMin : itemData.power_min;
    const powerMax = domPowerMax !== null ? domPowerMax : itemData.power_max;
    const weightMin = domWeightMin !== null ? domWeightMin : itemData.weight_min;
    const weightMax = domWeightMax !== null ? domWeightMax : itemData.weight_max;
    
    if (statPower && powerText.match(/^-?\d+$/)) {
      powerInfo = this.gradeCalculator.calculateGrade(parseInt(powerText), powerMin, powerMax);
    }
    if (statWeight && weightText.match(/^-?\d+$/)) {
      weightInfo = this.gradeCalculator.calculateGrade(parseInt(weightText), weightMin, weightMax, true);
    }

    const powerScore = powerInfo.score;
    const weightScore = weightInfo.score;
    const powerGradeVal = powerInfo.grade;
    const weightGradeVal = weightInfo.grade;
    const powerNarrow = Math.abs(powerMax - powerMin) <= 9;
    const weightNarrow = Math.abs(weightMax - weightMin) <= 9;
    
    // addFinalTag는 항상 실행 (새로운 파라미터 추가)
    const currentPower = statPower ? parseInt(this.gradeCalculator.getFirstNumberText(statPower)) : null;
    const currentWeight = statWeight ? parseInt(this.gradeCalculator.getFirstNumberText(statWeight)) : null;
    
    this.finalTagAdder.addFinalTag(container, powerGradeVal, weightGradeVal, powerScore, weightScore, powerNarrow, weightNarrow, 
                                   powerMin, powerMax, weightMin, weightMax, currentPower, currentWeight);
  }

  // DOM 요소 생성 유틸리티
  createElement(tagName, className, textContent, attributes = {}) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = textContent;
    
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    return element;
  }

  // 팝오버 위치 조정
  adjustPopoverPosition(popover) {
    const paper = popover.querySelector('.MuiPaper-root');
    if (!paper) return;

    // 팝오버가 완전히 렌더링될 때까지 대기
    setTimeout(() => {
      this.calculateAndAdjustPosition(popover, paper);
    }, 100);
  }

  // 위치 계산 및 조정
  calculateAndAdjustPosition(popover, paper) {
    const rect = paper.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let newLeft = rect.left;
    let newTop = rect.top;
    let needsAdjustment = false;

    // 우측 경계 체크
    if (rect.right > viewportWidth - 20) {
      newLeft = viewportWidth - rect.width - 20;
      needsAdjustment = true;
    }

    // 좌측 경계 체크
    if (rect.left < 20) {
      newLeft = 20;
      needsAdjustment = true;
    }

    // 하단 경계 체크
    if (rect.bottom > viewportHeight - 20) {
      newTop = viewportHeight - rect.height - 20;
      needsAdjustment = true;
    }

    // 상단 경계 체크
    if (rect.top < 20) {
      newTop = 20;
      needsAdjustment = true;
    }

    // 위치 조정이 필요한 경우 (세로만)
    if (needsAdjustment) {
      // 세로 위치만 조정, 가로는 MUI가 자동으로 처리하도록 함
      if (rect.bottom > viewportHeight - 20) {
        paper.style.top = `${newTop}px`;
      }
      if (rect.top < 20) {
        paper.style.top = `${newTop}px`;
      }
    }

    // 내용이 너무 길 경우 스크롤 처리
    if (rect.height > viewportHeight - 40) {
      paper.style.maxHeight = `${viewportHeight - 40}px`;
      paper.style.overflowY = 'auto';
    }
  }
}

export default RangeInfoAdder; 
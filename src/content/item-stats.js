// 아이템 감정 범위 표기 관리자
// 
// HTML 구조 참조: exam/item-popover-example.html
// - 팝오버 컨테이너: .MuiPaper-root.MuiPopover-paper
// - 아이템 감정 정보 컨테이너: .item-stats-processed
// - 감정 정보 래퍼: .item-stats-wrapper
// - 태그/점수 표기: .item-grade-tag-row
// - 위력/무게 감정 정보: .power-range-processed/.weight-range-processed
// - 퍼센트/점수 표기: .stat-detail-row
//
import ITEM_COLORS from '../styles/item-colors.js';

class ItemStatsManager {
  constructor() {
    this.rareItemsData = [];
    this.isProcessing = false;
    this.settings = { showItemStats: true };
    this.dynamicObserver = null;
    this.popoverObserver = null;
  }

  async init() {
    this.loadSettings();
    await this.loadRareItemsData();
    this.startDynamicContentDetection();
    this.startPopoverPositionObserver();
  }

  // 설정 로드
  async loadSettings() {
    this.settings = await utils.SettingsManager.getSettings({
      showItemStats: true
    });
  }

  async loadRareItemsData() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['rareItems'], (result) => {
          if (result.rareItems && result.rareItems.length > 0) {
            this.rareItemsData = result.rareItems;
            this.processItemStats();
          } else {
            this.rareItemsData = [];
          }
          resolve();
        });
      });
    } catch (error) {
      console.error('레어 아이템 데이터 로드 실패:', error);
      this.rareItemsData = [];
    }
  }

  processItemStats() {
    if (!this.settings.showItemStats) {
      return;
    }
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    try {
      // 더 유연한 선택자 사용
      const itemContainers = document.querySelectorAll('.MuiBox-root.css-38zrbw, .MuiBox-root[class*="css-"], .MuiPopover-root .MuiBox-root');
      let foundContainers = 0;
      let matchedItems = 0;
      
      console.log('아이템 스카우터: 처리할 컨테이너 수:', itemContainers.length);
      
      itemContainers.forEach(container => {
        if (container.classList.contains('item-stats-processed')) return;
        
        // 더 유연한 아이템명 선택자
        const itemNameElement = container.querySelector('p.MuiTypography-root.MuiTypography-body2.css-1qmxyy2, p[class*="MuiTypography"], .MuiTypography-root');
        if (!itemNameElement) return;
        
        const text = itemNameElement.textContent.trim();
        if (!text || text.length < 2 || text.length > 50) return;
        
        let cleanItemName = text;
        if (text.includes('(')) {
          cleanItemName = text.split('(')[0].trim();
        }
        
        // 더 유연한 스탯 컨테이너 선택자
        const statContainers = container.querySelectorAll('.MuiBox-root.css-gg4vpm, .MuiBox-root[class*="css-"], .MuiBox-root');
        let domPowerMin = null, domPowerMax = null, domWeightMin = null, domWeightMax = null;
        
        statContainers.forEach((statContainer) => {
          // 더 유연한 p 요소 선택자
          const pElements = statContainer.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv, p[class*="MuiTypography"], p');
          if (pElements.length >= 2) {
            const labelElement = pElements[0];
            const valueElement = pElements[1];
            const label = labelElement.textContent.trim();
            const value = valueElement.textContent.trim();
            
            // (123~456) 또는 (123 ~ 456) 패턴 추출
            const rangeMatch = value.match(/\(([-\d]+)\s*~\s*([-\d]+)\)/);
            if (rangeMatch) {
              const min = parseInt(rangeMatch[1]);
              const max = parseInt(rangeMatch[2]);
              if (label === '위력') {
                domPowerMin = min;
                domPowerMax = max;
              } else if (label === '무게') {
                domWeightMin = min;
                domWeightMax = max;
              }
            }
          }
        });
        
        // rareItemsData에서 정보 찾기
        let itemData = null;
        if (this.rareItemsData && this.rareItemsData.length > 0) {
          itemData = this.rareItemsData.find(item => {
            if (!item.name) return false;
            const itemName = item.name.trim();
            return cleanItemName === itemName;
          });
        }
        
        let showWikiIcon = false;
        
        if (itemData) {
          matchedItems++;
          // 위력 범위 비교
          if (
            domPowerMin !== null && domPowerMax !== null &&
            (itemData.power_min !== domPowerMin || itemData.power_max !== domPowerMax)
          ) {
            showWikiIcon = true;
          }
          // 무게 범위 비교
          if (
            domWeightMin !== null && domWeightMax !== null &&
            (itemData.weight_min !== domWeightMin || itemData.weight_max !== domWeightMax)
          ) {
            showWikiIcon = true;
          }
          this.addRangeInfoToStats(container, itemData, domPowerMin, domPowerMax, domWeightMin, domWeightMax);
          container.classList.add('item-stats-processed');
        } else {
          // 수집된 정보가 없더라도, DOM에 범위가 있으면 임시 itemData 생성하여 판정 수행
          if ((domPowerMin !== null && domPowerMax !== null) || (domWeightMin !== null && domWeightMax !== null)) {
            showWikiIcon = true;
            const tempItemData = {
              name: cleanItemName,
              power_min: domPowerMin,
              power_max: domPowerMax,
              weight_min: domWeightMin,
              weight_max: domWeightMax
            };
            this.addRangeInfoToStats(container, tempItemData, domPowerMin, domPowerMax, domWeightMin, domWeightMax);
            container.classList.add('item-stats-processed');
          }
        }
        
        // 위키 아이콘 추가 (위키 정보와 불일치하거나, 위키에 등록되지 않은 레어아이템)
        
        foundContainers++;
      });
      
      console.log('아이템 스카우터: 처리 완료 - 찾은 컨테이너:', foundContainers, '매칭된 아이템:', matchedItems);
      
    } catch (error) {
      console.error('아이템 감정 범위 표기 처리 오류:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // valueElement에서 현재값, min, max를 정확히 추출하는 함수 추가
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
      const rangeMatch = span.textContent.match(/\(([-\d]+)\s*~\s*([-\d]+)\)/);
      if (rangeMatch) {
        min = parseInt(rangeMatch[1]);
        max = parseInt(rangeMatch[2]);
      }
    }
    return { currentValue, min, max };
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
      const pElements = statContainer.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv');
      if (pElements.length === 2) {
        const labelElement = pElements[0];
        const valueElement = pElements[1];
        const label = labelElement.textContent.trim();
        // 개선: DOM에서 현재값, min, max를 모두 추출
        const { currentValue, min, max } = this.extractMainValueAndRange(valueElement);
        // 위력 처리
        if (label === '위력' &&
            min !== null && max !== null && min !== max && typeof currentValue === 'number' && !isNaN(currentValue)) {
          if (valueElement.classList.contains('power-range-processed')) return;
          const { grade, color, percentage, score } = this.calculateGrade(currentValue, min, max);
          const isNarrow = Math.abs(max - min) <= 9;
          const gradeSpan = utils.createElement('span', 'power-grade-info', 
            ` [${grade}]`, {
              style: `color: ${color}; font-size: 0.9em; font-weight: bold;`,
              'data-grade': grade
            }
          );
          const percentSpan = utils.createElement('span', 'power-percent-info', 
            ` (${percentage.toFixed(1)}%)`, {
              style: `color: ${ITEM_COLORS.common.percent}; font-size: 0.9em; font-weight: normal; font-style: italic;`
            }
          );
          // 점수 표기 (등급과 같은 색상)
          let scoreSpan = null;
          if (!isNarrow) {
            // 점수 표기 (등급과 같은 색상)
            scoreSpan = utils.createElement('span', 'power-score-info', 
              ` (${score}점)`, {
                style: `color: ${color}; font-size: 0.9em; font-weight: bold;`,
                'data-grade': grade
              }
            );
          }
          // (범위 좁음) 안내
          let narrowSpan = null;
          if (isNarrow) {
            // (범위 좁음) 안내
            narrowSpan = utils.createElement('span', 'narrow-range-info', 
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
          if (scoreSpan) detailRow.appendChild(scoreSpan);
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
          const { grade, color, percentage, score } = this.calculateGrade(currentValue, min, max, true);
          const isNarrow = Math.abs(max - min) <= 9;
          const gradeSpan = utils.createElement('span', 'weight-grade-info', 
            ` [${grade}]`, {
              style: `color: ${color}; font-size: 0.9em; font-weight: bold;`,
              'data-grade': grade
            }
          );
          const percentSpan = utils.createElement('span', 'weight-percent-info', 
            ` (${percentage.toFixed(1)}%)`, {
              style: `color: ${ITEM_COLORS.common.percent}; font-size: 0.9em; font-weight: normal; font-style: italic;`
            }
          );
          // 점수 표기 (등급과 같은 색상)
          let scoreSpan = null;
          if (!isNarrow) {
            // 점수 표기 (등급과 같은 색상)
            scoreSpan = utils.createElement('span', 'weight-score-info', 
              ` (${score}점)`, {
                style: `color: ${color}; font-size: 0.9em; font-weight: bold;`,
                'data-grade': grade
              }
            );
          }
          // (범위 좁음) 안내
          let narrowSpan = null;
          if (isNarrow) {
            // (범위 좁음) 안내
            narrowSpan = utils.createElement('span', 'narrow-range-info', 
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
          if (scoreSpan) detailRow.appendChild(scoreSpan);
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
    // 퍼센트/점수 정보 컨테이너에 저장
    // container._statSummary = { power: powerSummary, weight: weightSummary }; // 제거
    // 종결/준종결/완전무결 태그 추가 (점수 기반, 범위좁음 예외, 점수 항상 표기)
    // label이 '위력', '무게'인 statContainer를 반드시 찾아 점수 계산
    let statPower = null, statWeight = null;
    statContainers.forEach(sc => {
      const labelEl = sc.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv')[0];
      if (!labelEl) return;
      const label = labelEl.textContent.trim();
      if (label === '위력') statPower = sc.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv')[1];
      if (label === '무게') statWeight = sc.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv')[1];
    });
    let powerInfo = {score: 0, grade: ''};
    let weightInfo = {score: 0, grade: ''};
    // 첫 번째 텍스트 노드만 추출
    const powerText = this.getFirstNumberText(statPower);
    const weightText = this.getFirstNumberText(statWeight);
    if (statPower && powerText.match(/^-?\d+$/)) {
      powerInfo = this.calculateGrade(parseInt(powerText), itemData.power_min, itemData.power_max);
    }
    if (statWeight && weightText.match(/^-?\d+$/)) {
      weightInfo = this.calculateGrade(parseInt(weightText), itemData.weight_min, itemData.weight_max, true);
    }
    const powerScore = powerInfo.score;
    const weightScore = weightInfo.score;
    const powerGradeVal = powerInfo.grade;
    const weightGradeVal = weightInfo.grade;
    const powerNarrow = Math.abs(itemData.power_max - itemData.power_min) <= 9;
    const weightNarrow = Math.abs(itemData.weight_max - itemData.weight_min) <= 9;
    // addFinalTag는 항상 실행
    this.addFinalTag(container, powerGradeVal, weightGradeVal, powerScore, weightScore, powerNarrow, weightNarrow);
  }

  // 종결/준종결/완전무결 태그 추가 함수 (점수 기반, 범위좁음 예외, 무결 등급 체크, 점수 항상 표기)
  addFinalTag(container, powerGrade, weightGrade, powerScore, weightScore, powerNarrow, weightNarrow) {
    const itemNameElement = container.querySelector('p.MuiTypography-root.MuiTypography-body2.css-1qmxyy2');
    if (!itemNameElement) {
      console.warn('아이템명 p 태그 탐색 실패', container);
      return;
    }
    if (itemNameElement.querySelector('.final-tag')) {
      console.warn('이미 final-tag가 있음', itemNameElement);
      return;
    }
    let tagText = '';
    let tagColor = '';
    let tagScore;
    // '누락' 등급이 하나라도 있으면 (누락)만 표기, 태그/점수/합산 없음
    if (powerGrade === '누락' || weightGrade === '누락') {
      tagText = '';
      tagColor = ITEM_COLORS.getGradeColor('누락');
      tagScore = '누락';
    } else {
      // 점수 계산 (score가 null이면 0으로 대체)
      const safePowerScore = powerScore == null ? 0 : powerScore;
      const safeWeightScore = weightScore == null ? 0 : weightScore;
      if (powerNarrow && weightNarrow) {
        tagScore = Math.max(safePowerScore, safeWeightScore);
      } else if (powerNarrow) {
        tagScore = safeWeightScore;
      } else if (weightNarrow) {
        tagScore = safePowerScore;
      } else {
        tagScore = safePowerScore + safeWeightScore;
      }
      // 태그 조건
      if (!powerNarrow && !weightNarrow) {
        if (tagScore === 16) {
          tagText = '[완전무결]'; tagColor = ITEM_COLORS.getGradeColor('무결');
        } else if (tagScore >= 12 && tagScore <= 15) {
          tagText = '[종결]'; tagColor = ITEM_COLORS.getGradeColor('최상');
        } else if (tagScore === 11) {
          tagText = '[준종결]'; tagColor = ITEM_COLORS.getGradeColor('상');
        }
      } else if (powerNarrow && !weightNarrow) {
        if (tagScore === 8 && weightGrade === '무결') {
          tagText = '[완전무결]'; tagColor = ITEM_COLORS.getGradeColor('무결');
        } else if (tagScore >= 6 && tagScore <= 7) {
          tagText = '[종결]'; tagColor = ITEM_COLORS.getGradeColor('최상');
        } else if (tagScore === 5) {
          tagText = '[준종결]'; tagColor = ITEM_COLORS.getGradeColor('상');
        }
      } else if (!powerNarrow && weightNarrow) {
        if (tagScore === 8 && powerGrade === '무결') {
          tagText = '[완전무결]'; tagColor = ITEM_COLORS.getGradeColor('무결');
        } else if (tagScore >= 6 && tagScore <= 7) {
          tagText = '[종결]'; tagColor = ITEM_COLORS.getGradeColor('최상');
        } else if (tagScore === 5) {
          tagText = '[준종결]'; tagColor = ITEM_COLORS.getGradeColor('상');
        }
      }
    }
    // 태그/점수 표기 (태그가 없더라도 점수는 항상 표기, 단 누락은 (누락)만)
    const tagSpan = document.createElement('span');
    if (tagScore === '누락') {
      tagSpan.textContent = ' (누락)';
      tagSpan.style.color = tagColor;
    } else {
      tagSpan.textContent = tagText ? ` ${tagText} (${tagScore}점)` : ` (${tagScore}점)`;
      tagSpan.style.color = tagText ? tagColor : ITEM_COLORS.common.finalScore;
    }
    tagSpan.style.fontSize = '0.8rem';
    tagSpan.style.fontWeight = 'bold';
    tagSpan.style.fontStyle = 'italic';
    tagSpan.classList.add('final-tag');
    
    // 태그 종류에 따라 data-tag 속성 추가
    if (tagText) {
      if (tagText.includes('완전무결')) {
        tagSpan.setAttribute('data-tag', '완전무결');
      } else if (tagText.includes('종결')) {
        tagSpan.setAttribute('data-tag', '종결');
      } else if (tagText.includes('준종결')) {
        tagSpan.setAttribute('data-tag', '준종결');
      }
    }
    // 태그 줄(div) 생성/갱신
    let tagRow = container.querySelector('.item-grade-tag-row');
    if (!tagRow) {
      tagRow = document.createElement('div');
      tagRow.className = 'item-grade-tag-row';
      if (itemNameElement.nextSibling) {
        itemNameElement.parentNode.insertBefore(tagRow, itemNameElement.nextSibling);
      } else {
        itemNameElement.parentNode.appendChild(tagRow);
      }
    }
    
    // 기존 내용 제거 (안전한 방식)
    while (tagRow.firstChild) {
      tagRow.removeChild(tagRow.firstChild);
    }
    
    tagRow.appendChild(tagSpan);
    // popover 내부 wrapper로 감싸고 marginTop 적용 (실험용)
    let wrapper = container.querySelector('.item-stats-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'item-stats-wrapper';
      // 기존 컨텐츠를 wrapper로 이동
      while (container.firstChild) {
        wrapper.appendChild(container.firstChild);
      }
      container.appendChild(wrapper);
    }
    // wrapper 스타일 속성 제거
    
    // 아이템 감정 정보 추가 후 팝오버 위치 재조정
    const popover = container.closest('.MuiPopover-root');
    if (popover) {
      setTimeout(() => {
        this.adjustPopoverPosition(popover);
      }, 50);
    }
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
      return { grade: '누락', color: ITEM_COLORS.getGradeColor('누락'), percentage: null, score: null };
    }
    // 범위가 0인 경우 (최소값과 최대값이 같은 경우)
    if (minValue === maxValue) {
      if (currentValue === minValue) {
        return { grade: '무결', color: ITEM_COLORS.getGradeColor('무결'), percentage: 100.0, score: 8 };
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
        return { grade: '무결', color: ITEM_COLORS.getGradeColor('무결'), percentage: 100.0, score: 8 };
      }
      if (currentValue === maxValue) {
        return { grade: '폐급', color: ITEM_COLORS.getGradeColor('폐급'), percentage: 0, score: 0 };
      }
    } else {
      if (currentValue === minValue) {
        return { grade: '폐급', color: ITEM_COLORS.getGradeColor('폐급'), percentage: 0, score: 0 };
      }
      if (currentValue === maxValue) {
        return { grade: '무결', color: ITEM_COLORS.getGradeColor('무결'), percentage: 100.0, score: 8 };
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
    const color = ITEM_COLORS.getGradeColor(grade);
    return { grade, color, percentage, score };
  }

  // p 태그의 첫 번째 텍스트 노드(숫자)만 추출하는 유틸 함수 추가
  getFirstNumberText(el) {
    if (!el) return '';
    const node = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
    return node ? node.textContent.trim() : '';
  }

  // 동적 감지(아이템 목록 변화 감지)
  startDynamicContentDetection() {
    // 기존 observer가 있으면 중지
    if (this.dynamicObserver) {
      this.dynamicObserver.disconnect();
    }
    
    this.dynamicObserver = new MutationObserver((mutations) => {
      let shouldProcessItems = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.querySelector && node.querySelector('p.MuiTypography-body2')) {
                shouldProcessItems = true;
              }
            }
          });
        }
      });
      if (shouldProcessItems && this.settings.showItemStats) {
        setTimeout(() => {
          this.processItemStats();
        }, 100);
      }
    });
    this.dynamicObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 팝오버 위치 관찰자 시작
  startPopoverPositionObserver() {
    // 기존 observer가 있으면 중지
    if (this.popoverObserver) {
      this.popoverObserver.disconnect();
    }
    
    this.popoverObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // MUI 팝오버가 추가되었는지 확인
              if (node.classList && node.classList.contains('MuiPopover-root')) {
                this.adjustPopoverPosition(node);
              } else if (node.querySelectorAll) {
                const popovers = node.querySelectorAll('.MuiPopover-root');
                popovers.forEach(popover => this.adjustPopoverPosition(popover));
              }
            }
          });
        }
      });
    });

    this.popoverObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
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

    // 가로는 제한하지 않음 (사용자 요청에 따라)
  }

  removeItemStats() {
    // MutationObserver 중지
    if (this.dynamicObserver) {
      this.dynamicObserver.disconnect();
      this.dynamicObserver = null;
    }
    if (this.popoverObserver) {
      this.popoverObserver.disconnect();
      this.popoverObserver = null;
    }
    
    // 기존 감정 범위 표기 요소 제거
    const statsElements = document.querySelectorAll('.item-stats-info');
    statsElements.forEach(element => element.remove());
    
    // 모든 범위 정보 요소 제거
    const rangeElements = document.querySelectorAll('.power-range-info, .weight-range-info');
    rangeElements.forEach(element => element.remove());
    
    // 모든 등급 정보 요소 제거
    const gradeElements = document.querySelectorAll('.power-grade-info, .weight-grade-info');
    gradeElements.forEach(element => element.remove());
    
    // 모든 퍼센트 정보 요소 제거
    const percentElements = document.querySelectorAll('.power-percent-info, .weight-percent-info');
    percentElements.forEach(element => element.remove());
    
    // 모든 점수 정보 요소 제거
    const scoreElements = document.querySelectorAll('.power-score-info, .weight-score-info');
    scoreElements.forEach(element => element.remove());
    
    // 모든 범위 좁음 정보 요소 제거
    const narrowElements = document.querySelectorAll('.narrow-range-info');
    narrowElements.forEach(element => element.remove());
    
    // 모든 위키 정보 요소 제거
    const wikiElements = document.querySelectorAll('.wiki-info');
    wikiElements.forEach(element => element.remove());
    
    // 모든 종결 태그 요소 제거
    const finalTagElements = document.querySelectorAll('.final-tag');
    finalTagElements.forEach(element => element.remove());
    
    // 모든 상세 정보 행 제거
    const detailRows = document.querySelectorAll('.stat-detail-row');
    detailRows.forEach(element => element.remove());
    
    // 처리된 클래스 제거
    const processedElements = document.querySelectorAll('.item-stats-processed, .power-range-processed, .weight-range-processed');
    processedElements.forEach(element => {
      element.classList.remove('item-stats-processed', 'power-range-processed', 'weight-range-processed');
    });
  }

  getRareItemsData() {
    return this.rareItemsData;
  }

  isProcessingStats() {
    return this.isProcessing;
  }
}

// ES6 모듈로 export
export default ItemStatsManager;
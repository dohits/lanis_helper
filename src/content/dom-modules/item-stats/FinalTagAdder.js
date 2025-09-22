// 종결 태그 추가 모듈
import ITEM_COLORS from '../../../styles/item-colors.js';

class FinalTagAdder {
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

  // 장비 타입 감지 함수
  detectEquipmentType(container) {
    const itemNameElement = container.querySelector('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv, p.MuiTypography-root.MuiTypography-body2.css-1fxvmzd');
    if (!itemNameElement) return 'unknown';
    
    const itemName = itemNameElement.textContent.trim().toLowerCase();
    
    // 무기 키워드들
    const weaponKeywords = [
      '창', '도끼', '검', '나이프', '지팡이', '너클', '활'
    ];
    
    // 방어구 키워드
    const armorKeyword = '방어구';
    
    // 장신구 키워드
    const accessoryKeyword = '장신구';
    
    // 장신구 체크
    if (itemName.includes(accessoryKeyword)) {
      return 'accessory';
    }
    
    // 방어구 체크
    if (itemName.includes(armorKeyword)) {
      return 'armor';
    }
    
    // 무기 체크
    if (weaponKeywords.some(keyword => itemName.includes(keyword))) {
      return 'weapon';
    }
    
    // 기본값은 무기/방어구로 처리
    return 'weapon_armor';
  }

  // 종결/준종결/완전무결 태그 추가 함수 (새로운 계산 방식: 최소값 = 최소위력-최대무게*2, 최대값 = 최대위력-최소무게*2)
  addFinalTag(container, powerGrade, weightGrade, powerScore, weightScore, powerNarrow, weightNarrow, powerMin, powerMax, weightMin, weightMax, currentPower, currentWeight) {
    const itemNameElement = container.querySelector('p.MuiTypography-root.MuiTypography-body2.css-1qmxyy2, p.MuiTypography-root.MuiTypography-body2.css-17kzaz4');
    if (!itemNameElement) {
      return;
    }
    
    if (itemNameElement.querySelector('.final-tag')) {
      return;
    }
    
    let tagText = '';
    let tagColor = '';
    let tagScore;
    let tagPercentage;
    let tagMinValue;
    let tagMaxValue;
    
    // '누락' 등급이 하나라도 있으면 (누락)만 표기, 태그/점수/합산 없음
    if (powerGrade === '누락' || weightGrade === '누락') {
      tagText = '';
      tagColor = this.gradeColors['누락'];
      tagScore = '누락';
    } else {
      // 장비 타입에 따른 계산 방식
      if (powerMin !== null && powerMax !== null && weightMin !== null && weightMax !== null && 
          currentPower !== null && currentWeight !== null) {
        
        const equipmentType = this.detectEquipmentType(container);
        let currentTagValue;
        
        if (equipmentType === 'accessory') {
          // 장신구: 위력*5.5 - 무게*2
          tagMinValue = powerMin * 5.5 - weightMax * 2;
          tagMaxValue = powerMax * 5.5 - weightMin * 2;
          currentTagValue = currentPower * 5.5 - currentWeight * 2;
        } else {
          // 무기/방어구: 위력 - 무게*2
          tagMinValue = powerMin - weightMax * 2;
          tagMaxValue = powerMax - weightMin * 2;
          currentTagValue = currentPower - currentWeight * 2;
        }
        
        // 퍼센트 계산
        if (tagMinValue === tagMaxValue) {
          tagPercentage = 100.0;
        } else {
          tagPercentage = ((currentTagValue - tagMinValue) / (tagMaxValue - tagMinValue)) * 100;
          tagPercentage = Math.max(0, Math.min(100, Math.round((tagPercentage + Number.EPSILON) * 10) / 10));
        }
        
        // 태그 점수는 실제 위력 - 실제 무게 × 2
        tagScore = currentTagValue;
        
        // 새로운 등급 기준: 90% 이상 준종결, 95% 이상 종결, 100% 완전무결
        if (tagPercentage >= 100) {
          tagText = '[완전무결]';
          tagColor = this.gradeColors['무결'];
        } else if (tagPercentage >= 95) {
          tagText = '[종결]';
          tagColor = this.gradeColors['최상'];
        } else if (tagPercentage >= 90) {
          tagText = '[준종결]';
          tagColor = this.gradeColors['상'];
        }
      } else {
        // 기존 방식으로 폴백 (데이터가 부족한 경우)
        // 하지만 currentPower와 currentWeight가 있으면 새로운 방식으로 계산
        if (currentPower !== null && currentWeight !== null) {
          const equipmentType = this.detectEquipmentType(container);
          
          if (equipmentType === 'accessory') {
            // 장신구: 위력*5.5 - 무게*2
            tagScore = currentPower * 5.5 - currentWeight * 2;
          } else {
            // 무기/방어구: 위력 - 무게*2
            tagScore = currentPower - currentWeight * 2;
          }
          // 폴백 시에는 태그를 표시하지 않고 점수만 표시
        } else {
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
          
          // 기존 태그 조건 (폴백용)
          if (!powerNarrow && !weightNarrow) {
            if (tagScore === 16) {
              tagText = '[완전무결]'; tagColor = this.gradeColors['무결'];
            } else if (tagScore >= 12 && tagScore <= 15) {
              tagText = '[종결]'; tagColor = this.gradeColors['최상'];
            } else if (tagScore === 11) {
              tagText = '[준종결]'; tagColor = this.gradeColors['상'];
            }
          } else if (powerNarrow && !weightNarrow) {
            if (tagScore === 8 && weightGrade === '무결') {
              tagText = '[완전무결]'; tagColor = this.gradeColors['무결'];
            } else if (tagScore >= 6 && tagScore <= 7) {
              tagText = '[종결]'; tagColor = this.gradeColors['최상'];
            } else if (tagScore === 5) {
              tagText = '[준종결]'; tagColor = this.gradeColors['상'];
            }
          } else if (!powerNarrow && weightNarrow) {
            if (tagScore === 8 && powerGrade === '무결') {
              tagText = '[완전무결]'; tagColor = this.gradeColors['무결'];
            } else if (tagScore >= 6 && tagScore <= 7) {
              tagText = '[종결]'; tagColor = this.gradeColors['최상'];
            } else if (tagScore === 5) {
              tagText = '[준종결]'; tagColor = this.gradeColors['상'];
            }
          }
        }
      }
    }
    
    // 새로운 표시 형식: "[태그] 점수 (최소값~최대값) (퍼센트)" - 태그에만 색상 적용
    const tagSpan = document.createElement('span');
    if (tagScore === '누락') {
      tagSpan.textContent = ' (누락)';
      tagSpan.style.color = tagColor;
    } else {
      // 태그 부분만 색상 적용하고 나머지는 기본 색상
      if (tagText) {
        const tagPart = document.createElement('span');
        tagPart.textContent = ` ${tagText}`;
        tagPart.style.color = tagColor;
        tagSpan.appendChild(tagPart);
      }
      
      // 점수와 범위는 기본 색상
      const defaultPart = document.createElement('span');
      let defaultText = ` ${tagScore}`;
      
      if (tagMinValue !== null && tagMaxValue !== null) {
        defaultText += ` (${tagMinValue}~${tagMaxValue})`;
      }
      
      defaultPart.textContent = defaultText;
      defaultPart.style.color = ITEM_COLORS.common.finalScore;
      tagSpan.appendChild(defaultPart);
      
      // 퍼센트는 태그와 같은 색상
      if (tagPercentage !== null) {
        const percentPart = document.createElement('span');
        percentPart.textContent = ` (${tagPercentage.toFixed(1)}%)`;
        percentPart.style.color = tagColor;
        tagSpan.appendChild(percentPart);
      }
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
    
    // 아이템 감정 정보 추가 후 팝오버 위치 재조정
    const popover = container.closest('.MuiPopover-root');
    if (popover) {
      setTimeout(() => {
        this.adjustPopoverPosition(popover);
      }, 50);
    }
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
}

export default FinalTagAdder; 
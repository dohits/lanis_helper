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

  // 종결/준종결/완전무결 태그 추가 함수 (점수 기반, 범위좁음 예외, 무결 등급 체크, 점수 항상 표기)
  addFinalTag(container, powerGrade, weightGrade, powerScore, weightScore, powerNarrow, weightNarrow) {
    const itemNameElement = container.querySelector('p.MuiTypography-root.MuiTypography-body2.css-1qmxyy2');
    if (!itemNameElement) {
      return;
    }
    
    if (itemNameElement.querySelector('.final-tag')) {
      return;
    }
    
    let tagText = '';
    let tagColor = '';
    let tagScore;
    
    // '누락' 등급이 하나라도 있으면 (누락)만 표기, 태그/점수/합산 없음
    if (powerGrade === '누락' || weightGrade === '누락') {
      tagText = '';
      tagColor = this.gradeColors['누락'];
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
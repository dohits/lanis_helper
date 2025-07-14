// 아이템 스탯 관리자
class ItemStatsManager {
  constructor() {
    this.rareItemsData = [];
    this.isProcessing = false;
    this.settings = { showItemStats: true }; // 기본 설정
  }

  async init() {
    
    // 설정 로드 (구버전 방식)
    this.loadSettings();
    
    await this.loadRareItemsData();
    
    // 동적 콘텐츠 감지 시작 (구버전 방식)
    this.startDynamicContentDetection();
    
  }

  // 설정 로드 (구버전 방식)
  loadSettings() {
    chrome.storage.sync.get({
      showItemStats: true
    }, (items) => {
      this.settings = items;
    });
  }

  async loadRareItemsData() {
    try {
      // chrome.storage.local에서 데이터 로드 (구버전 방식)
      return new Promise((resolve) => {
        chrome.storage.local.get(['rareItems'], (result) => {
          if (result.rareItems && result.rareItems.length > 0) {
            this.rareItemsData = result.rareItems;
            // 구버전 방식: 데이터 로드 후 즉시 처리 실행
            this.processItemStats();
          } else {
            this.rareItemsData = [];
          }
          resolve();
        });
      });
    } catch (error) {
      console.error('희귀 아이템 데이터 로드 실패:', error);
      this.rareItemsData = [];
    }
  }

  processItemStats() {
    // 구버전 방식: 설정 확인
    if (!this.settings.showItemStats || !this.rareItemsData || this.rareItemsData.length === 0) {
      return;
    }

    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // 정확한 아이템 컨테이너 구조 찾기 (css-38zrbw)
      const itemContainers = document.querySelectorAll('.MuiBox-root.css-38zrbw');
      
      let foundContainers = 0;
      let matchedItems = 0;
      
      itemContainers.forEach(container => {
        // 이미 처리된 컨테이너는 건너뛰기
        if (container.classList.contains('item-stats-processed')) return;
        
        // 컨테이너 내에서 아이템명 요소 찾기
        const itemNameElement = container.querySelector('p.MuiTypography-root.MuiTypography-body2.css-1qmxyy2');
        
        if (!itemNameElement) {
          return;
        }
        
        const text = itemNameElement.textContent.trim();
        if (!text || text.length < 2 || text.length > 50) {
          return; // 너무 짧거나 긴 텍스트 제외
        }
        
        // 아이템명에서 추가 정보 제거 (예: "(봉인됨)" 제거)
        let cleanItemName = text;
        if (text.includes('(')) {
          cleanItemName = text.split('(')[0].trim();
        }
        
        // 아이템명이 크롤링 데이터에 있는지 확인
        const itemData = this.rareItemsData.find(item => {
          if (!item.name) return false;
          const itemName = item.name.trim();
          return cleanItemName === itemName;
        });
        
        if (itemData) {
          matchedItems++;
          
          // 해당 아이템의 위력과 무게 값 옆에 범위 정보 추가
          this.addRangeInfoToStats(container, itemData);
          
          // 처리 완료 표시
          container.classList.add('item-stats-processed');
        }
        
        foundContainers++;
      });
      
      // 매칭이 적으면 더 넓은 범위로 검색 (제거됨 - 정확한 구조에서만 처리)
      if (matchedItems === 0 && foundContainers > 0) {
      }
      
    } catch (error) {
      console.error('아이템 스탯 처리 오류:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // 아이템의 위력과 무게 값 옆에 범위 정보와 등급 추가 (구버전 방식)
  addRangeInfoToStats(container, itemData) {
    // 위력과 무게 값을 찾아서 범위 정보와 등급 추가
    const statContainers = container.querySelectorAll('.MuiBox-root.css-gg4vpm');
    
    let powerGrade = null;
    let weightGrade = null;
    
    statContainers.forEach((statContainer, index) => {
      const pElements = statContainer.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-1xgulgv');
      
      if (pElements.length === 2) {
        const labelElement = pElements[0];
        const valueElement = pElements[1];
        const label = labelElement.textContent.trim();
        const value = valueElement.textContent.trim();
        
        // 위력 처리
        if (label === '위력' && 
            itemData.power_min !== null && itemData.power_max !== null && 
            itemData.power_min !== itemData.power_max) {
          
          // 이미 처리된 요소는 건너뛰기
          if (valueElement.classList.contains('power-range-processed')) {
            return;
          }
          
          const currentPower = parseInt(value);
          const { grade, color } = this.calculateGrade(currentPower, itemData.power_min, itemData.power_max);
          powerGrade = grade;
          
          // 범위 정보 추가
          const rangeSpan = document.createElement('span');
          rangeSpan.textContent = ` (${itemData.power_min}-${itemData.power_max})`;
          rangeSpan.style.color = '#666';
          rangeSpan.style.fontSize = '0.9em';
          rangeSpan.style.fontStyle = 'italic';
          rangeSpan.classList.add('power-range-info');
          
          // 등급 정보 추가
          const gradeSpan = document.createElement('span');
          gradeSpan.textContent = ` [${grade}]`;
          gradeSpan.style.color = color;
          gradeSpan.style.fontSize = '0.9em';
          gradeSpan.style.fontWeight = 'bold';
          gradeSpan.classList.add('power-grade-info');
          
          valueElement.appendChild(rangeSpan);
          valueElement.appendChild(gradeSpan);
          valueElement.classList.add('power-range-processed');
        }
        
        // 무게 처리
        if (label === '무게' && 
            itemData.weight_min !== null && itemData.weight_max !== null && 
            itemData.weight_min !== itemData.weight_max) {
          
          // 이미 처리된 요소는 건너뛰기
          if (valueElement.classList.contains('weight-range-processed')) {
            return;
          }
          
          const currentWeight = parseInt(value);
          const { grade, color } = this.calculateGrade(currentWeight, itemData.weight_min, itemData.weight_max, true);
          weightGrade = grade;
          
          // 범위 정보 추가
          const rangeSpan = document.createElement('span');
          rangeSpan.textContent = ` (${itemData.weight_min}-${itemData.weight_max})`;
          rangeSpan.style.color = '#666';
          rangeSpan.style.fontSize = '0.9em';
          rangeSpan.style.fontStyle = 'italic';
          rangeSpan.classList.add('weight-range-info');
          
          // 등급 정보 추가
          const gradeSpan = document.createElement('span');
          gradeSpan.textContent = ` [${grade}]`;
          gradeSpan.style.color = color;
          gradeSpan.style.fontSize = '0.9em';
          gradeSpan.style.fontWeight = 'bold';
          gradeSpan.classList.add('weight-grade-info');
          
          valueElement.appendChild(rangeSpan);
          valueElement.appendChild(gradeSpan);
          valueElement.classList.add('weight-range-processed');
        }
      }
    });
    
    // 종결/준종결 태그 추가
    if (powerGrade && weightGrade) {
      this.addFinalTag(container, powerGrade, weightGrade);
    }
  }

  // 종결/준종결 태그 추가 함수 (구버전 방식)
  addFinalTag(container, powerGrade, weightGrade) {
    // 컨테이너에서 아이템명 요소 찾기
    const itemNameElement = container.querySelector('p.MuiTypography-root.MuiTypography-body2.css-1qmxyy2');
    
    if (!itemNameElement) {
      return;
    }
    
    // 이미 태그가 있는지 확인
    if (itemNameElement.querySelector('.final-tag')) {
      return;
    }
    
    let tagText = '';
    let tagColor = '';
    
    // 둘 다 최상인 경우 [종결]
    if (powerGrade === '최상' && weightGrade === '최상') {
      tagText = '[종결]';
      tagColor = '#FF0000'; // 붉은색
    }
    // 하나는 최상이고 다른 하나는 상인 경우 [준종결]
    else if ((powerGrade === '최상' && weightGrade === '상') || 
             (powerGrade === '상' && weightGrade === '최상')) {
      tagText = '[준종결]';
      tagColor = '#800080'; // 보라색
    }
    
    // 태그가 필요한 경우에만 추가
    if (tagText) {
      const tagSpan = document.createElement('span');
      tagSpan.textContent = ` ${tagText}`;
      tagSpan.style.color = tagColor;
      tagSpan.style.fontSize = '0.9em';
      tagSpan.style.fontWeight = 'bold';
      tagSpan.style.fontStyle = 'italic';
      tagSpan.classList.add('final-tag');
      
      itemNameElement.appendChild(tagSpan);
    }
  }

  // 등급 계산 함수 (구버전 방식)
  calculateGrade(currentValue, minValue, maxValue, isWeight = false) {
    if (currentValue < minValue || currentValue > maxValue) {
      return { grade: '최하', color: '#FFFFFF' }; // 범위 밖이면 최하
    }
    
    const range = maxValue - minValue;
    let percentage = ((currentValue - minValue) / range) * 100;
    
    // 무게의 경우 등급을 반대로 계산 (가벼울수록 좋음)
    if (isWeight) {
      percentage = 100 - percentage;
    }
    
    if (percentage >= 90) {
      return { grade: '최상', color: '#FF0000' }; // 붉은색
    } else if (percentage >= 70) {
      return { grade: '상', color: '#800080' }; // 보라색
    } else if (percentage >= 50) {
      return { grade: '중', color: '#FFFF00' }; // 노란색
    } else if (percentage >= 30) {
      return { grade: '하', color: '#0000FF' }; // 파란색
    } else {
      return { grade: '최하', color: '#FFFFFF' }; // 흰색
    }
  }

  // 더 넓은 범위에서 아이템 검색 (비활성화됨 - 정확한 구조에서만 처리)
  searchInWiderRange() {
    return;
  }

  // 동적 콘텐츠 감지 시작 (구버전 방식)
  startDynamicContentDetection() {
    // 동적 콘텐츠 감지를 위한 MutationObserver
    const observer = new MutationObserver((mutations) => {
      let shouldProcessItems = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 새로 추가된 아이템 요소가 있는지 확인
              if (node.querySelector && node.querySelector('p.MuiTypography-body2')) {
                shouldProcessItems = true;
              }
            }
          });
        }
      });
      
      if (shouldProcessItems && this.settings.showItemStats) {
        // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 처리
        setTimeout(() => {
          this.processItemStats();
        }, 100);
      }
    });

    // DOM 변경 감지 시작
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
  }

  removeItemStats() {
    
    // 기존 아이템명 옆 스탯 정보 제거
    const statsElements = document.querySelectorAll('.item-stats-info');
    statsElements.forEach(element => {
      element.remove();
    });
    
    // 위력 범위 정보 제거
    const powerRangeElements = document.querySelectorAll('.power-range-info');
    powerRangeElements.forEach(element => {
      element.remove();
    });
    
    // 위력 등급 정보 제거
    const powerGradeElements = document.querySelectorAll('.power-grade-info');
    powerGradeElements.forEach(element => {
      element.remove();
    });
    
    // 무게 범위 정보 제거
    const weightRangeElements = document.querySelectorAll('.weight-range-info');
    weightRangeElements.forEach(element => {
      element.remove();
    });
    
    // 무게 등급 정보 제거
    const weightGradeElements = document.querySelectorAll('.weight-grade-info');
    weightGradeElements.forEach(element => {
      element.remove();
    });
    
    // 종결/준종결 태그 제거
    const finalTagElements = document.querySelectorAll('.final-tag');
    finalTagElements.forEach(element => {
      element.remove();
    });
    
    // 처리 완료 표시 제거
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

// 전역 인스턴스 생성 (개선된 버전)

// DOM이 준비된 후에 인스턴스 생성
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.itemStatsManager = new ItemStatsManager();
  });
} else {
  window.itemStatsManager = new ItemStatsManager();
} 
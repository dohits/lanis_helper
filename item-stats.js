// 아이템 감정 범위 표기 관리자
class ItemStatsManager {
  constructor() {
    this.rareItemsData = [];
    this.isProcessing = false;
    this.settings = { showItemStats: true };
  }

  async init() {
    this.loadSettings();
    await this.loadRareItemsData();
    this.startDynamicContentDetection();
  }

  // 설정 로드
  loadSettings() {
    chrome.storage.sync.get({
      showItemStats: true
    }, (items) => {
      this.settings = items;
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
    if (!this.settings.showItemStats || !this.rareItemsData || this.rareItemsData.length === 0) {
      return;
    }
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    try {
      const itemContainers = document.querySelectorAll('.MuiBox-root.css-38zrbw');
      let foundContainers = 0;
      let matchedItems = 0;
      itemContainers.forEach(container => {
        if (container.classList.contains('item-stats-processed')) return;
        const itemNameElement = container.querySelector('p.MuiTypography-root.MuiTypography-body2.css-1qmxyy2');
        if (!itemNameElement) return;
        const text = itemNameElement.textContent.trim();
        if (!text || text.length < 2 || text.length > 50) return;
        let cleanItemName = text;
        if (text.includes('(')) {
          cleanItemName = text.split('(')[0].trim();
        }
        const itemData = this.rareItemsData.find(item => {
          if (!item.name) return false;
          const itemName = item.name.trim();
          return cleanItemName === itemName;
        });
        if (itemData) {
          matchedItems++;
          this.addRangeInfoToStats(container, itemData);
          container.classList.add('item-stats-processed');
        }
        foundContainers++;
      });
    } catch (error) {
      console.error('아이템 감정 범위 표기 처리 오류:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // 아이템의 위력/무게 값에 범위 및 등급 표기 추가
  addRangeInfoToStats(container, itemData) {
    const statContainers = container.querySelectorAll('.MuiBox-root.css-gg4vpm');
    let powerGrade = null;
    let weightGrade = null;
    statContainers.forEach((statContainer) => {
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
          if (valueElement.classList.contains('power-range-processed')) return;
          const currentPower = parseInt(value);
          const { grade, color } = this.calculateGrade(currentPower, itemData.power_min, itemData.power_max);
          powerGrade = grade;
          const rangeSpan = document.createElement('span');
          rangeSpan.textContent = ` (${itemData.power_min}-${itemData.power_max})`;
          rangeSpan.style.color = '#666';
          rangeSpan.style.fontSize = '0.9em';
          rangeSpan.style.fontStyle = 'italic';
          rangeSpan.classList.add('power-range-info');
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
          if (valueElement.classList.contains('weight-range-processed')) return;
          const currentWeight = parseInt(value);
          const { grade, color } = this.calculateGrade(currentWeight, itemData.weight_min, itemData.weight_max, true);
          weightGrade = grade;
          const rangeSpan = document.createElement('span');
          rangeSpan.textContent = ` (${itemData.weight_min}-${itemData.weight_max})`;
          rangeSpan.style.color = '#666';
          rangeSpan.style.fontSize = '0.9em';
          rangeSpan.style.fontStyle = 'italic';
          rangeSpan.classList.add('weight-range-info');
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

  // 종결/준종결 태그 추가 함수
  addFinalTag(container, powerGrade, weightGrade) {
    const itemNameElement = container.querySelector('p.MuiTypography-root.MuiTypography-body2.css-1qmxyy2');
    if (!itemNameElement) return;
    if (itemNameElement.querySelector('.final-tag')) return;
    let tagText = '';
    let tagColor = '';
    if (powerGrade === '최상' && weightGrade === '최상') {
      tagText = '[종결]';
      tagColor = '#FF0000';
    } else if ((powerGrade === '최상' && weightGrade === '상') ||
               (powerGrade === '상' && weightGrade === '최상')) {
      tagText = '[준종결]';
      tagColor = '#800080';
    }
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

  // 등급 계산 함수
  calculateGrade(currentValue, minValue, maxValue, isWeight = false) {
    if (currentValue < minValue || currentValue > maxValue) {
      return { grade: '최하', color: '#FFFFFF' };
    }
    const range = maxValue - minValue;
    let percentage = ((currentValue - minValue) / range) * 100;
    if (isWeight) {
      percentage = 100 - percentage;
    }
    if (percentage >= 90) {
      return { grade: '최상', color: '#FF0000' };
    } else if (percentage >= 70) {
      return { grade: '상', color: '#800080' };
    } else if (percentage >= 50) {
      return { grade: '중', color: '#FFFF00' };
    } else if (percentage >= 30) {
      return { grade: '하', color: '#0000FF' };
    } else {
      return { grade: '최하', color: '#FFFFFF' };
    }
  }

  // 동적 감지(아이템 목록 변화 감지)
  startDynamicContentDetection() {
    const observer = new MutationObserver((mutations) => {
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
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  removeItemStats() {
    // 기존 감정 범위 표기 요소 제거
    const statsElements = document.querySelectorAll('.item-stats-info');
    statsElements.forEach(element => element.remove());
    const powerRangeElements = document.querySelectorAll('.power-range-info');
    powerRangeElements.forEach(element => element.remove());
    const powerGradeElements = document.querySelectorAll('.power-grade-info');
    powerGradeElements.forEach(element => element.remove());
    const weightRangeElements = document.querySelectorAll('.weight-range-info');
    weightRangeElements.forEach(element => element.remove());
    const weightGradeElements = document.querySelectorAll('.weight-grade-info');
    weightGradeElements.forEach(element => element.remove());
    const finalTagElements = document.querySelectorAll('.final-tag');
    finalTagElements.forEach(element => element.remove());
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

// 전역 인스턴스 생성
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.itemStatsManager = new ItemStatsManager();
  });
} else {
  window.itemStatsManager = new ItemStatsManager();
}
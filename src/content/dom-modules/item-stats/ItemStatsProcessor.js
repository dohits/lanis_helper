// 아이템 스탯 처리 모듈
import ITEM_COLORS from '../../../styles/item-colors.js';
import GradeCalculator from './GradeCalculator.js';
import RangeInfoAdder from './RangeInfoAdder.js';
import FinalTagAdder from './FinalTagAdder.js';

class ItemStatsProcessor {
  constructor() {
    this.rareItemsData = [];
    this.gradeCalculator = new GradeCalculator();
    this.rangeInfoAdder = new RangeInfoAdder();
    this.finalTagAdder = new FinalTagAdder();
  }

  async init() {
    await this.loadRareItemsData();
  }

  // Chrome 스토리지에서 희귀 아이템 데이터 로드
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
      this.rareItemsData = [];
    }
  }

  // 아이템 스탯 처리 메인 로직
  processItemStats() {
    try {
      // 더 유연한 선택자 사용
      const itemContainers = document.querySelectorAll('.MuiBox-root.css-38zrbw, .MuiBox-root[class*="css-"], .MuiPopover-root .MuiBox-root');
      let foundContainers = 0;
      let matchedItems = 0;
      
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
        
        // DOM에서 스탯 정보 추출
        const { domPowerMin, domPowerMax, domWeightMin, domWeightMax } = this.extractStatsFromDOM(container);
        
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
          this.rangeInfoAdder.addRangeInfoToStats(container, itemData, domPowerMin, domPowerMax, domWeightMin, domWeightMax);
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
            this.rangeInfoAdder.addRangeInfoToStats(container, tempItemData, domPowerMin, domPowerMax, domWeightMin, domWeightMax);
            container.classList.add('item-stats-processed');
          }
        }
        
        foundContainers++;
      });
      
    } catch (error) {
      console.error('아이템 스탯 처리 중 오류:', error);
    }
  }

  // DOM에서 스탯 정보 추출
  extractStatsFromDOM(container) {
    let domPowerMin = null, domPowerMax = null, domWeightMin = null, domWeightMax = null;
    
    // 더 유연한 스탯 컨테이너 선택자
    const statContainers = container.querySelectorAll('.MuiBox-root.css-gg4vpm, .MuiBox-root[class*="css-"], .MuiBox-root');
    
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

    return { domPowerMin, domPowerMax, domWeightMin, domWeightMax };
  }

  // 아이템 스탯 제거
  removeItemStats() {
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

  // 희귀 아이템 데이터 반환
  getRareItemsData() {
    return this.rareItemsData;
  }
}

export default ItemStatsProcessor; 
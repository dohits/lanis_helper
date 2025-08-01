import BaseModal from '../base/base-modal.js';
import { COMBINE_ITEM_CONFIGS, DISMANTLE_ITEM_CONFIGS, isCombineItem, isDismantleItem } from '../../../calculator/item-configs.js';
import ExpectedValueCalculator from '../../../calculator/expected-value-calculator.js';
import PriceFetcher from '../../../calculator/price-fetcher.js';

/**
 * 기댓값 계산기 모달
 * BaseModal을 상속받아 일관된 모달 구조를 제공
 */
export class ExpectedValueModal extends BaseModal {
  constructor() {
    super({
      id: 'expected-value-modal',
      title: '기댓값 계산기',
      className: 'expected-value-modal',
      contentClassName: 'expected-value-modal-content',
      maxWidth: '500px',
      maxHeight: '80vh',
      closeOnOutsideClick: true,
      closeOnEsc: true
    });

    // 계산기 및 가격 조회기 초기화
    this.calculator = new ExpectedValueCalculator();
    this.priceFetcher = new PriceFetcher();
    
    // 아이템별 설정 정보
    this.itemConfigs = COMBINE_ITEM_CONFIGS;
    this.dismantleConfigs = DISMANTLE_ITEM_CONFIGS;

    // UI 요소들
    this.itemSelect = null;
    this.priceSourceSection = null;
    this.resultSection = null;
    this.calculateBtn = null;
    this.avgPriceToggle = null;
    this.recentPriceToggle = null;
    this.manualInputToggle = null;
    this.recipeCostInput = null;
    this.recipeInputSection = null;
    this.multiInputContainer = null;
  }

  // 모달 열기 (오버라이드)
  open() {
    super.open();
    this.createContent();
    this.setupEvents();
    this.addSkeletonAnimation();
  }

  // 스켈레톤 애니메이션 CSS 추가
  addSkeletonAnimation() {
    if (!document.querySelector('#skeleton-animation-style')) {
      const style = document.createElement('style');
      style.id = 'skeleton-animation-style';
      style.textContent = `
        @keyframes skeleton-pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 모달 내용 생성
  createContent() {
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 20px;
      overflow-y: auto;
      height: 100%;
    `;

    // 상품 선택 섹션
    const itemSelectSection = this.createItemSelectSection();
    content.appendChild(itemSelectSection);

    // 시세 데이터 소스 선택 섹션
    this.priceSourceSection = this.createPriceSourceSection();
    content.appendChild(this.priceSourceSection);

    // 결과 섹션
    this.resultSection = this.createResultSection();
    content.appendChild(this.resultSection);

    this.setContent(content);
  }

  // 상품 선택 섹션 생성
  createItemSelectSection() {
    const section = document.createElement('div');
    section.style.marginBottom = '20px';

    const label = document.createElement('label');
    label.htmlFor = 'itemSelect';
    label.style.cssText = 'display: block; margin-bottom: 8px; font-weight: bold; color: #333;';
    label.textContent = '기댓값 계산 케이스 선택:';

    this.itemSelect = document.createElement('select');
    this.itemSelect.id = 'itemSelect';
    this.itemSelect.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '케이스를 선택하세요';
    this.itemSelect.appendChild(defaultOption);

    // 원본과 동일한 아이템 목록
    const items = [
      { value: 'vitality_potion', text: '[조합] 활력의 포션' },
      { value: 'seal_key', text: '[조합] 봉인의 열쇠' },
      { value: 'blue_crystal', text: '[조합] 푸른 결정' },
      { value: 'red_crystal', text: '[조합] 붉은 결정' },
      { value: 'high_grade_leather', text: '[조합] 고급 가죽끈' },
      { value: 'leather_strap', text: '[조합] 가죽끈' },
      { value: 'old_leather_strap', text: '[조합] 낡은 가죽끈' },
      { value: 'iron_hammer', text: '[조합] 쇠망치' },
      { value: 'white_equipment', text: '[분해] 흰색 등급 장비' },
      { value: 'blue_equipment', text: '[분해] 파랑 등급 장비' },
      { value: 'yellow_equipment', text: '[분해] 노랑 등급 장비' },
      { value: 'purple_equipment', text: '[분해] 보라 등급 장비' },
      { value: 'red_equipment', text: '[분해] 빨강 등급 장비' }
    ];

    items.forEach(item => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.text;
      this.itemSelect.appendChild(option);
    });

    section.appendChild(label);
    section.appendChild(this.itemSelect);

    return section;
  }

  // 시세 데이터 소스 선택 섹션 생성
  createPriceSourceSection() {
    const section = document.createElement('div');
    section.id = 'priceSourceSection';
    section.style.cssText = 'display: none; margin-bottom: 20px;';

    const sourceLabel = document.createElement('label');
    sourceLabel.style.cssText = 'display: block; margin-bottom: 8px; font-weight: bold; color: #333;';
    sourceLabel.textContent = '시세 데이터 소스:';

    // 토글 버튼 컨테이너
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = 'display: flex; gap: 10px; margin-bottom: 15px;';

    // 평균 거래가 토글
    this.avgPriceToggle = document.createElement('button');
    this.avgPriceToggle.id = 'avgPriceToggle';
    this.avgPriceToggle.textContent = '평균 거래가';
    this.avgPriceToggle.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; background: #f8f9fa; cursor: pointer; font-size: 12px;';
    this.avgPriceToggle.dataset.selected = 'false';

    // 최근 거래가 토글
    this.recentPriceToggle = document.createElement('button');
    this.recentPriceToggle.id = 'recentPriceToggle';
    this.recentPriceToggle.textContent = '최근 거래가';
    this.recentPriceToggle.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; background: #f8f9fa; cursor: pointer; font-size: 12px;';
    this.recentPriceToggle.dataset.selected = 'false';

    // 직접 입력 토글
    this.manualInputToggle = document.createElement('button');
    this.manualInputToggle.id = 'manualInputToggle';
    this.manualInputToggle.textContent = '직접 입력';
    this.manualInputToggle.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; background: #f8f9fa; cursor: pointer; font-size: 12px;';
    this.manualInputToggle.dataset.selected = 'false';

    toggleContainer.appendChild(this.avgPriceToggle);
    toggleContainer.appendChild(this.recentPriceToggle);
    toggleContainer.appendChild(this.manualInputToggle);

    // 레시피 입력 섹션
    this.recipeInputSection = document.createElement('div');
    this.recipeInputSection.id = 'recipeInputSection';
    this.recipeInputSection.style.cssText = 'display: none; margin-bottom: 20px;';

    // 기본 입력 필드 (활력의 포션용)
    const recipeLabel = document.createElement('label');
    recipeLabel.htmlFor = 'recipeCost';
    recipeLabel.style.cssText = 'display: block; margin-bottom: 8px; font-weight: bold; color: #333;';
    recipeLabel.textContent = '마녀의 레시피 시세 (G):';

    this.recipeCostInput = document.createElement('input');
    this.recipeCostInput.type = 'number';
    this.recipeCostInput.id = 'recipeCost';
    this.recipeCostInput.placeholder = '레시피 시세를 입력하세요';
    this.recipeCostInput.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;';

    // 봉인의 열쇠용 다중 입력 필드 컨테이너
    this.multiInputContainer = document.createElement('div');
    this.multiInputContainer.id = 'multiInputContainer';
    this.multiInputContainer.style.cssText = 'display: none;';

    this.recipeInputSection.appendChild(recipeLabel);
    this.recipeInputSection.appendChild(this.recipeCostInput);
    this.recipeInputSection.appendChild(this.multiInputContainer);

    section.appendChild(sourceLabel);
    section.appendChild(toggleContainer);
    section.appendChild(this.recipeInputSection);

    return section;
  }

  // 결과 섹션 생성
  createResultSection() {
    const section = document.createElement('div');
    section.id = 'resultSection';
    section.style.cssText = 'display: none; margin-top: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px; min-height: 100px;';

    const calculationResult = document.createElement('div');
    calculationResult.id = 'calculationResult';
    calculationResult.innerHTML = '<p style="text-align: center; color: #666;">케이스를 선택하고 계산 버튼을 클릭하세요.</p>';

    // 계산 버튼
    this.calculateBtn = document.createElement('button');
    this.calculateBtn.textContent = '계산하기';
    this.calculateBtn.style.cssText = `
      width: 100%;
      padding: 12px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 16px;
    `;
    this.calculateBtn.disabled = true;

    section.appendChild(calculationResult);
    section.appendChild(this.calculateBtn);

    return section;
  }

  // 이벤트 설정
  setupEvents() {
    this.setupItemSelectEvent();
    this.setupToggleEvents();
    this.setupCalculateEvent();
  }

  // 아이템 선택 이벤트
  setupItemSelectEvent() {
    this.itemSelect.addEventListener('change', () => {
      const selectedItem = this.itemSelect.value;
      if (selectedItem) {
        this.priceSourceSection.style.display = 'block';
        this.calculateBtn.disabled = false;
        this.updateInputFields(selectedItem);
      } else {
        this.priceSourceSection.style.display = 'none';
        this.calculateBtn.disabled = true;
        this.resultSection.style.display = 'none';
      }
    });
  }

  // 토글 이벤트
  setupToggleEvents() {
    const toggles = [this.avgPriceToggle, this.recentPriceToggle, this.manualInputToggle];

    const updateToggleStyles = () => {
      toggles.forEach(toggle => {
        toggle.style.background = '#f8f9fa';
        toggle.style.color = '#333';
        toggle.dataset.selected = 'false';
      });
    };

    const setupToggleClick = (selectedToggle) => {
      updateToggleStyles();
      selectedToggle.style.background = '#007bff';
      selectedToggle.style.color = 'white';
      selectedToggle.dataset.selected = 'true';
      
      // 직접 입력 선택 시 레시피 입력 섹션 표시
      if (selectedToggle === this.manualInputToggle) {
        this.recipeInputSection.style.display = 'block';
      } else {
        this.recipeInputSection.style.display = 'none';
      }
    };

    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => setupToggleClick(toggle));
    });
  }

  // 계산 이벤트
  setupCalculateEvent() {
    this.calculateBtn.addEventListener('click', async () => {
      const selectedItem = this.itemSelect.value;
      if (!selectedItem) return;

      this.showLoadingState();
      
      try {
        const selectedSource = this.getSelectedSource();
        const materialCosts = await this.getMaterialCosts(selectedItem, selectedSource);
        
        if (materialCosts) {
          if (isDismantleItem(selectedItem)) {
            const result = this.calculator.calculateDismantleExpectedValue(selectedItem, materialCosts);
            this.displayDismantleResult(selectedItem, result, selectedSource);
          } else {
            const result = this.calculator.calculateExpectedValue(selectedItem, materialCosts);
            this.displayCalculationResult(selectedItem, result, selectedSource);
          }
        }
      } catch (error) {
        console.error('Calculation error:', error);
        this.resultSection.querySelector('#calculationResult').innerHTML = '<p style="color: red; text-align: center;">계산 중 오류가 발생했습니다.</p>';
      } finally {
        this.hideLoadingState();
      }
    });
  }

  // 선택된 소스 가져오기
  getSelectedSource() {
    if (this.avgPriceToggle.dataset.selected === 'true') return this.avgPriceToggle;
    if (this.recentPriceToggle.dataset.selected === 'true') return this.recentPriceToggle;
    if (this.manualInputToggle.dataset.selected === 'true') return this.manualInputToggle;
    return null;
  }

  // 로딩 상태 표시
  showLoadingState() {
    this.calculateBtn.disabled = true;
    this.calculateBtn.textContent = '계산 중...';
    this.resultSection.querySelector('#calculationResult').innerHTML = this.createSkeletonTemplate();
    this.resultSection.style.display = 'block';
  }

  // 로딩 상태 숨김
  hideLoadingState() {
    this.calculateBtn.disabled = false;
    this.calculateBtn.textContent = '계산하기';
  }

  // 스켈레톤 템플릿 생성
  createSkeletonTemplate() {
    return `
      <div style="padding: 16px;">
        <div class="skeleton" style="height: 20px; margin-bottom: 12px; border-radius: 4px; background: #e0e0e0;"></div>
        <div class="skeleton" style="height: 16px; margin-bottom: 8px; border-radius: 4px; background: #e0e0e0;"></div>
        <div class="skeleton" style="height: 16px; margin-bottom: 8px; border-radius: 4px; background: #e0e0e0;"></div>
        <div class="skeleton" style="height: 16px; margin-bottom: 8px; border-radius: 4px; background: #e0e0e0;"></div>
      </div>
    `;
  }

  // 재료 비용 가져오기
  async getMaterialCosts(selectedItem, selectedSource) {
    if (selectedSource === this.manualInputToggle) {
      if (selectedItem === 'vitality_potion') {
        const recipeCost = parseInt(this.recipeCostInput.value) || 0;
        return recipeCost;
      } else {
        // 다중 입력 필드에서 값 가져오기
        const inputs = this.multiInputContainer.querySelectorAll('input');
        const costs = Array.from(inputs).map(input => parseInt(input.value) || 0);
        return costs;
      }
    }

    // 구글 시트에서 가격 가져오기
    try {
      if (selectedItem === 'vitality_potion') {
        const recipeCost = await this.priceFetcher.fetchItemPriceFromGoogleSheet('마녀의 레시피', selectedSource);
        return recipeCost;
      } else {
        // 다중 재료 아이템의 경우
        const config = this.itemConfigs[selectedItem];
        if (!config) return null;

        const materialCosts = {};
        for (const material of config.materials) {
          const price = await this.priceFetcher.fetchItemPriceFromGoogleSheet(material.name, selectedSource);
          materialCosts[material.key] = price;
        }
        return materialCosts;
      }
    } catch (error) {
      console.error('Price fetching error:', error);
      throw error;
    }
  }

  // 계산 결과 표시 (조합 아이템)
  displayCalculationResult(itemId, result, selectedSource) {
    const itemInfo = this.calculator.getItemInfo(itemId);
    const sourceText = this.getSourceText(selectedSource);
    
    // 재료 정보 생성
    let materialInfo = '';
    const config = this.itemConfigs[itemId];
    if (config) {
      if (config.type === 'single') {
        const material = config.materials[0];
        const cost = result.recipeCost;
        materialInfo = `
          <div style="margin-bottom: 8px;">
            <span style="color: #333;">재료 시세:</span>
          </div>
          <div style="margin-bottom: 8px; margin-left: 15px; font-size: 12px; color: #333;">
            <div>• ${material.name}: ${cost.toLocaleString()} G</div>
          </div>
        `;
      } else {
        materialInfo = `
          <div style="margin-bottom: 8px;">
            <span style="color: #333;">재료 시세:</span>
          </div>
          <div style="margin-bottom: 8px; margin-left: 15px; font-size: 12px; color: #333;">
            ${config.materials.map(material => 
              `<div>• ${material.name}: ${result.materialCosts[material.key].toLocaleString()} G</div>`
            ).join('')}
          </div>
        `;
      }
    }

    const template = this.createCalculationResultTemplate(itemInfo, sourceText, materialInfo, result);
    this.resultSection.querySelector('#calculationResult').innerHTML = template;
    this.resultSection.style.display = 'block';
  }

  // 분해 결과 표시
  displayDismantleResult(itemId, result, selectedSource) {
    const sourceText = this.getSourceText(selectedSource);
    const template = this.createDismantleResultTemplate(result, sourceText);
    this.resultSection.querySelector('#calculationResult').innerHTML = template;
    this.resultSection.style.display = 'block';
  }

  // 계산 결과 템플릿 생성
  createCalculationResultTemplate(itemInfo, sourceText, materialInfo, result, currentPrices = null) {
    let currentPriceInfo = '';
    
    if (currentPrices) {
      currentPriceInfo = `
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
          <div style="font-weight: bold; color: #333; margin-bottom: 10px;">
            ${itemInfo.name} 현재 시세
          </div>
          <div style="font-size: 12px; color: #333;">
            <div>• 최근 거래가: ${currentPrices.recent ? currentPrices.recent.toLocaleString() : 'N/A'} G</div>
            <div>• 평균 거래가: ${currentPrices.average ? currentPrices.average.toLocaleString() : 'N/A'} G</div>
          </div>
        </div>
      `;
    }

    return `
      <div style="margin-bottom: 15px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
          데이터 소스: ${sourceText}
        </div>
        <div style="font-weight: bold; color: #007bff; font-style: italic; font-size: 16px;">
          ${itemInfo.name} 최적 기댓값 계산 결과
        </div>
      </div>
      ${materialInfo}
      <div style="margin-bottom: 8px;">
        <span style="color: #333;">최적 조합 비용:</span> 
        <span style="font-weight: bold; color: #333;">${result.bestTotalCost.toLocaleString()} G</span>
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color: #333;">최적 조합:</span> 
        <span style="font-weight: bold; color: #28a745;">${result.bestCombination || `재료 ${result.bestRecipeCount}개`} (${(result.bestSuccessRate * 100).toFixed(0)}%)</span>
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color: #333;">기댓값:</span> 
        <span style="font-weight: bold; color: #dc3545; font-size: 18px;">${result.bestExpectedValue.toLocaleString()} G</span>
      </div>
      ${currentPriceInfo}
    `;
  }

  // 분해 결과 템플릿 생성
  createDismantleResultTemplate(result, sourceText) {
    return `
      <div style="margin-bottom: 15px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
          데이터 소스: ${sourceText}
        </div>
        <div style="font-weight: bold; color: #007bff; font-style: italic; font-size: 16px;">
          ${result.equipmentName} 분해 기댓값 계산 결과
        </div>
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color: #333;">분해 비용:</span> 
        <span style="font-weight: bold; color: #333;">${result.cost.toLocaleString()} G</span>
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color: #333;">총 기댓값:</span> 
        <span style="font-weight: bold; color: #28a745;">${result.totalExpectedValue.toLocaleString()} G</span>
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color: #333;">순 기댓값:</span> 
        <span style="font-weight: bold; color: ${result.isProfitable ? '#dc3545' : '#6c757d'}; font-size: 18px;">${result.netExpectedValue.toLocaleString()} G</span>
      </div>
    `;
  }

  // 소스 텍스트 가져오기
  getSourceText(selectedSource) {
    if (selectedSource === this.avgPriceToggle) return '평균 거래가';
    if (selectedSource === this.recentPriceToggle) return '최근 거래가';
    if (selectedSource === this.manualInputToggle) return '직접 입력';
    return '알 수 없음';
  }

  // 입력 필드 업데이트
  updateInputFields(selectedItem) {
    if (selectedItem === 'vitality_potion') {
      this.recipeInputSection.style.display = 'block';
      this.multiInputContainer.style.display = 'none';
    } else if (isCombineItem(selectedItem)) {
      this.recipeInputSection.style.display = 'none';
      this.multiInputContainer.style.display = 'none';
    } else if (isDismantleItem(selectedItem)) {
      this.createDismantleInputFields(selectedItem);
    }
  }

  // 분해 입력 필드 생성
  createDismantleInputFields(selectedItem) {
    const config = this.dismantleConfigs[selectedItem];
    if (!config || !config.rewards) return;

    this.recipeInputSection.style.display = 'block';
    this.multiInputContainer.style.display = 'block';
    this.multiInputContainer.innerHTML = '';

    Object.entries(config.rewards).forEach(([rewardKey, reward]) => {
      const label = document.createElement('label');
      label.htmlFor = rewardKey;
      label.style.cssText = 'display: block; margin-bottom: 8px; font-weight: bold; color: #333;';
      label.textContent = `${reward.name} 시세 (G):`;

      const input = document.createElement('input');
      input.type = 'number';
      input.id = rewardKey;
      input.placeholder = `${reward.name} 시세를 입력하세요`;
      input.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; margin-bottom: 12px;';

      this.multiInputContainer.appendChild(label);
      this.multiInputContainer.appendChild(input);
    });
  }
} 
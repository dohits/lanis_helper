import BaseModal from '../base/base-modal.js';
import { COMBINE_ITEM_CONFIGS, DISMANTLE_ITEM_CONFIGS, isCombineItem, isDismantleItem } from '../../../calculator/item-configs.js';
import ExpectedValueCalculator from '../../../calculator/expected-value-calculator.js';
import OfficialPriceFetcher from '../../../calculator/official-price-fetcher.js';

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
      maxWidth: '600px',
      maxHeight: '80vh',
      closeOnOutsideClick: true,
      closeOnEsc: true
    });

    // 계산기 및 가격 조회기 초기화
    this.calculator = new ExpectedValueCalculator();
    this.priceFetcher = new OfficialPriceFetcher();
    
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
    this.addSkeletonAnimation();
    this.createContent();
    this.setupEvents();
  }

  // 모달 내용 생성
  createContent() {
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 5px;
      height: 100%;
    `;

    // 상품 선택 섹션
    const itemSelectSection = this.createItemSelectSection();
    content.appendChild(itemSelectSection);

    // 시세 데이터 소스 선택 섹션
    this.priceSourceSection = this.createPriceSourceSection();
    content.appendChild(this.priceSourceSection);

    // 계산 버튼 섹션
    const calculateButtonSection = this.createCalculateButtonSection();
    content.appendChild(calculateButtonSection);

    // 결과 섹션
    this.resultSection = this.createResultSection();
    content.appendChild(this.resultSection);

    this.setContent(content);
  }

  // 상품 선택 섹션 생성
  createItemSelectSection() {
    const section = document.createElement('div');

    const label = this.createLabel('기댓값 계산 케이스 선택:');

    this.itemSelect = document.createElement('select');
    this.itemSelect.id = 'itemSelect';
    this.itemSelect.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      outline: none;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    `;

    // 포커스 효과
    this.itemSelect.addEventListener('focus', () => {
      this.itemSelect.style.borderColor = '#667eea';
    });
    this.itemSelect.addEventListener('blur', () => {
      this.itemSelect.style.borderColor = '#d1d5db';
    });

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
    section.style.cssText = 'display: none;';

    const sourceLabel = this.createLabel('시세 데이터 소스:');

    // 토글 버튼 컨테이너
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = 'display: flex; gap: 5px; margin-bottom: 15px;';

    // 평균가 토글
    this.avgPriceToggle = this.createToggleButton('평균가', 'avgPriceToggle');
    this.recentPriceToggle = this.createToggleButton('최근가', 'recentPriceToggle');
    this.manualInputToggle = this.createToggleButton('직접입력', 'manualInputToggle');

    toggleContainer.appendChild(this.avgPriceToggle);
    toggleContainer.appendChild(this.recentPriceToggle);
    toggleContainer.appendChild(this.manualInputToggle);

    // 레시피 입력 섹션
    this.recipeInputSection = document.createElement('div');
    this.recipeInputSection.id = 'recipeInputSection';
    this.recipeInputSection.style.cssText = 'display: none; margin-top: 10px;';

    // 기본 입력 필드 (활력의 포션용)
    const recipeLabel = this.createLabel('마녀의 레시피 시세 (G):');
    this.recipeCostInput = this.createInput('레시피 시세를 입력하세요', 'number');

    // 봉인의 열쇠용 다중 입력 필드 컨테이너
    this.multiInputContainer = document.createElement('div');
    this.multiInputContainer.id = 'multiInputContainer';
    this.multiInputContainer.style.cssText = 'display: none; margin-top: 10px;';

    this.recipeInputSection.appendChild(recipeLabel);
    this.recipeInputSection.appendChild(this.recipeCostInput);
    this.recipeInputSection.appendChild(this.multiInputContainer);

    section.appendChild(sourceLabel);
    section.appendChild(toggleContainer);
    section.appendChild(this.recipeInputSection);

    return section;
  }

  // 토글 버튼 생성
  createToggleButton(text, id) {
    const button = document.createElement('button');
    button.id = id;
    button.textContent = text;
    button.type = 'button';
    button.style.cssText = `
      padding: 8px 16px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: #f9fafb;
      color: #6b7280;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
      outline: none;
    `;
    button.dataset.selected = 'false';

    // 호버 효과
    button.addEventListener('mouseenter', () => {
      if (button.dataset.selected === 'false') {
        button.style.background = '#f3f4f6';
        button.style.borderColor = '#9ca3af';
      }
    });
    button.addEventListener('mouseleave', () => {
      if (button.dataset.selected === 'false') {
        button.style.background = '#f9fafb';
        button.style.borderColor = '#d1d5db';
      }
    });

    return button;
  }

  // 계산 버튼 섹션 생성
  createCalculateButtonSection() {
    const section = document.createElement('div');
    section.style.cssText = 'margin-top: 5px;';

    // 계산 버튼
    this.calculateBtn = this.createButton('계산하기', 'primary');
    this.calculateBtn.disabled = true;
    
    // 버튼을 가로로 길게 만들기
    this.calculateBtn.style.width = '100%';
    this.calculateBtn.style.margin = '0';
    this.calculateBtn.style.padding = '12px 16px';
    this.calculateBtn.style.fontSize = '14px';
    this.calculateBtn.style.fontWeight = '600';
    
    // 비활성화 상태 스타일 적용
    this.updateCalculateButtonStyle();

    section.appendChild(this.calculateBtn);
    return section;
  }

  // 계산 버튼 스타일 업데이트
  updateCalculateButtonStyle() {
    if (this.calculateBtn.disabled) {
      this.calculateBtn.style.background = '#d1d5db';
      this.calculateBtn.style.color = '#9ca3af';
      this.calculateBtn.style.cursor = 'not-allowed';
      this.calculateBtn.style.opacity = '0.6';
    } else {
      this.calculateBtn.style.background = '#667eea';
      this.calculateBtn.style.color = 'white';
      this.calculateBtn.style.cursor = 'pointer';
      this.calculateBtn.style.opacity = '1';
    }
  }

  // 직접 입력 유효성 검사
  validateDirectInput() {
    const selectedItem = this.itemSelect.value;
    const selectedSource = this.getSelectedSource();
    
    if (selectedSource !== this.manualInputToggle) {
      return true; // 직접 입력이 아닌 경우 유효
    }
    
    if (!selectedItem) {
      return false;
    }
    
    // 분해 아이템인 경우
    if (isDismantleItem(selectedItem)) {
      const inputs = this.multiInputContainer.querySelectorAll('input');
      for (const input of inputs) {
        const value = parseFloat(input.value);
        if (isNaN(value) || value <= 0 || value % 1 !== 0) {
          return false;
        }
      }
      return true;
    }
    
    // 조합 아이템인 경우
    const config = this.itemConfigs[selectedItem];
    if (!config) {
      return false;
    }
    
    if (config.type === 'single') {
      // 단일 재료
      const value = parseFloat(this.recipeCostInput.value);
      return !isNaN(value) && value > 0 && value % 1 === 0;
    } else {
      // 다중 재료
      const inputs = this.multiInputContainer.querySelectorAll('input');
      for (const input of inputs) {
        const value = parseFloat(input.value);
        if (isNaN(value) || value <= 0 || value % 1 !== 0) {
          return false;
        }
      }
      return true;
    }
  }

  // 버튼 활성화/비활성화 업데이트
  updateCalculateButtonState() {
    const selectedItem = this.itemSelect.value;
    const selectedSource = this.getSelectedSource();
    
    if (!selectedItem || !selectedSource) {
      this.calculateBtn.disabled = true;
    } else if (selectedSource === this.manualInputToggle) {
      // 직접 입력인 경우 유효성 검사
      this.calculateBtn.disabled = !this.validateDirectInput();
    } else {
      // 구글 시트 데이터인 경우 활성화
      this.calculateBtn.disabled = false;
    }
    
    this.updateCalculateButtonStyle();
  }

  // 결과 섹션 생성
  createResultSection() {
    const section = document.createElement('div');
    section.id = 'resultSection';
    section.style.cssText = 'display: none; margin-top: 15px;';

    const resultContainer = document.createElement('div');
    resultContainer.id = 'calculationResult';
    resultContainer.style.cssText = `
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      min-height: 100px;
    `;
    resultContainer.innerHTML = '<p style="text-align: center; color: #6b7280;">케이스를 선택하고 계산 버튼을 클릭하세요.</p>';

    section.appendChild(resultContainer);
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
        this.resultSection.style.display = 'none';
        
        // 분해 아이템이 아닌 경우에만 입력 필드 업데이트
        if (!isDismantleItem(selectedItem)) {
          this.updateInputFields(selectedItem);
        } else {
          // 분해 아이템인 경우 입력 필드 숨김
          this.recipeInputSection.style.display = 'none';
          this.recipeCostInput.style.display = 'none';
          // 라벨도 숨김
          const recipeLabel = this.recipeInputSection.querySelector('label');
          if (recipeLabel) {
            recipeLabel.style.display = 'none';
          }
        }
        
        // 현재 선택된 데이터 소스 확인
        const selectedSource = this.getSelectedSource();
        if (selectedSource) {
          // 직접 입력이 선택된 경우 입력 필드 표시
          if (selectedSource === this.manualInputToggle) {
            this.recipeInputSection.style.display = 'block';
            if (isDismantleItem(selectedItem)) {
              this.createDismantleInputFields(selectedItem);
            } else {
              // 조합 아이템인 경우에만 updateInputFields 호출
              this.updateInputFields(selectedItem);
            }
          }
        }
      } else {
        this.priceSourceSection.style.display = 'none';
        this.resultSection.style.display = 'none';
        this.recipeInputSection.style.display = 'none';
      }
      
      // 버튼 상태 업데이트
      this.updateCalculateButtonState();
    });
  }

  // 토글 이벤트
  setupToggleEvents() {
    const toggles = [this.avgPriceToggle, this.recentPriceToggle, this.manualInputToggle];

    const updateToggleStyles = () => {
      toggles.forEach(toggle => {
        toggle.style.background = '#f9fafb';
        toggle.style.color = '#6b7280';
        toggle.style.borderColor = '#d1d5db';
        toggle.dataset.selected = 'false';
      });
    };

    const setupToggleClick = (selectedToggle) => {
      updateToggleStyles();
      selectedToggle.style.background = '#667eea';
      selectedToggle.style.color = 'white';
      selectedToggle.style.borderColor = '#667eea';
      selectedToggle.dataset.selected = 'true';
      
      // 직접 입력 선택 시 레시피 입력 섹션 표시
      if (selectedToggle === this.manualInputToggle) {
        this.recipeInputSection.style.display = 'block';
        // 현재 선택된 아이템에 따라 입력 필드 업데이트
        const selectedItem = this.itemSelect.value;
        if (selectedItem) {
          if (isDismantleItem(selectedItem)) {
            this.createDismantleInputFields(selectedItem);
          } else {
            this.updateInputFields(selectedItem);
          }
        }
      } else {
        this.recipeInputSection.style.display = 'none';
        // 입력 필드 초기화
        if (this.recipeCostInput) {
          this.recipeCostInput.value = '';
        }
        if (this.multiInputContainer) {
          this.multiInputContainer.innerHTML = '';
        }
      }
      
      // 버튼 상태 업데이트
      this.updateCalculateButtonState();
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
            // 새로운 범용 계산 엔진 사용
            const result = this.calculator.calculateExpectedValue(selectedItem, materialCosts);
            
            // 결과 검증 및 기본값 설정
            if (!result) {
              throw new Error('계산 결과가 없습니다.');
            }
            
            // 필수 속성들이 없으면 기본값 설정
            if (typeof result.bestTotalCost === 'undefined') {
              result.bestTotalCost = 0;
            }
            if (typeof result.bestExpectedValue === 'undefined') {
              result.bestExpectedValue = 0;
            }
            if (typeof result.bestSuccessRate === 'undefined') {
              result.bestSuccessRate = 0;
            }
            if (typeof result.bestRecipeCount === 'undefined') {
              result.bestRecipeCount = 0;
            }
            if (typeof result.bestCombination === 'undefined') {
              result.bestCombination = '';
            }
            
            this.displayCalculationResult(selectedItem, result, selectedSource);
          }
        }
      } catch (error) {
        console.error('Calculation error:', error);
        this.resultSection.querySelector('#calculationResult').innerHTML = 
          '<p style="color: #dc3545; text-align: center;">계산 중 오류가 발생했습니다: ' + error.message + '</p>';
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
        <div style="height: 20px; margin-bottom: 12px; border-radius: 4px; background: #e0e0e0; animation: skeleton-pulse 1.5s ease-in-out infinite;"></div>
        <div style="height: 16px; margin-bottom: 8px; border-radius: 4px; background: #e0e0e0; animation: skeleton-pulse 1.5s ease-in-out infinite;"></div>
        <div style="height: 16px; margin-bottom: 8px; border-radius: 4px; background: #e0e0e0; animation: skeleton-pulse 1.5s ease-in-out infinite;"></div>
        <div style="height: 16px; margin-bottom: 8px; border-radius: 4px; background: #e0e0e0; animation: skeleton-pulse 1.5s ease-in-out infinite;"></div>
      </div>
    `;
  }

  // 재료 비용 가져오기
  async getMaterialCosts(selectedItem, selectedSource) {
    if (selectedSource === this.manualInputToggle) {
      const config = this.itemConfigs[selectedItem];
      const dismantleConfig = this.dismantleConfigs[selectedItem];
      
      if (config && config.type === 'single') {
        // 단일 재료 아이템 (활력의 포션, 낡은 가죽끈)
        const material = config.materials[0];
        const cost = parseInt(this.recipeCostInput.value) || 0;
        return { [material.key]: cost };
      } else if (config && config.type !== 'single') {
        // 다중 재료 아이템
        const inputs = this.multiInputContainer.querySelectorAll('input');
        const materialCosts = {};
        config.materials.forEach((material, index) => {
          const input = inputs[index];
          if (input) {
            materialCosts[material.key] = parseInt(input.value) || 0;
          }
        });
        return materialCosts;
      } else if (dismantleConfig) {
        // 분해 아이템의 경우 다중 입력 필드에서 값 가져오기
        const inputs = this.multiInputContainer.querySelectorAll('input');
        const costs = {};
        if (dismantleConfig.rewards) {
          Object.keys(dismantleConfig.rewards).forEach((rewardKey, index) => {
            const input = inputs[index];
            if (input) {
              costs[rewardKey] = parseInt(input.value) || 0;
            }
          });
        }
        return costs;
      }
    }

    // 구글 시트에서 가격 가져오기
    try {
      const config = this.itemConfigs[selectedItem];
      const dismantleConfig = this.dismantleConfigs[selectedItem];
      
      if (config && config.type === 'single') {
        // 단일 재료 아이템
        const material = config.materials[0];
        const price = await this.priceFetcher.getItemPrice(material.name, selectedSource);
        return { [material.key]: price };
      } else if (config && config.type !== 'single') {
        // 다중 재료 아이템
        const materialCosts = {};
        for (const material of config.materials) {
          const price = await this.priceFetcher.getItemPrice(material.name, selectedSource);
          materialCosts[material.key] = price;
        }
        return materialCosts;
      } else if (dismantleConfig) {
        // 분해 아이템의 경우
        const materialCosts = {};
        for (const [rewardKey, reward] of Object.entries(dismantleConfig.rewards)) {
          const price = await this.priceFetcher.getItemPrice(reward.name, selectedSource);
          materialCosts[rewardKey] = price;
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
        const cost = result.recipeCost || 0;
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
            ${config.materials.map(material => {
              const cost = result.materialCosts && result.materialCosts[material.key] ? result.materialCosts[material.key] : 0;
              return `<div>• ${material.name}: ${cost.toLocaleString()} G</div>`;
            }).join('')}
          </div>
        `;
      }
    }

    // 현재 시세 가져오기
    this.getCurrentPrices(itemInfo.name).then(currentPrices => {
      const template = this.createCalculationResultTemplate(itemInfo, sourceText, materialInfo, result, currentPrices);
      this.resultSection.querySelector('#calculationResult').innerHTML = template;
      this.resultSection.style.display = 'block';
    }).catch(() => {
      const template = this.createCalculationResultTemplate(itemInfo, sourceText, materialInfo, result);
      this.resultSection.querySelector('#calculationResult').innerHTML = template;
      this.resultSection.style.display = 'block';
    });
  }

  // 분해 결과 표시
  async displayDismantleResult(itemId, result, selectedSource) {
    const config = this.dismantleConfigs[itemId];
    
    if (!config) {
      console.error('분해 설정을 찾을 수 없습니다.');
      return;
    }

    // 보상 아이템들의 현재 시세 가져오기
    const currentPrices = {};
    for (const [rewardKey, reward] of Object.entries(config.rewards)) {
      try {
        const prices = await this.getCurrentPrices(reward.name);
        currentPrices[reward.name] = prices;
      } catch (error) {
        console.error(`${reward.name} 현재 시세를 가져오는 중 오류:`, error);
        currentPrices[reward.name] = null;
      }
    }

    const template = this.createDismantleResultTemplate(config, result, selectedSource, currentPrices);
    this.resultSection.querySelector('#calculationResult').innerHTML = template;
    this.resultSection.style.display = 'block';
  }

  // 계산 결과 템플릿 생성
  createCalculationResultTemplate(itemInfo, sourceText, materialInfo, result, currentPrices = null) {
    let currentPriceInfo = '';
    
    if (currentPrices) {
      currentPriceInfo = `
        <div style="margin-top: 15px; padding-top: 12px; border-top: 1px solid #eee;">
          <div style="font-weight: bold; color: #333; margin-bottom: 8px;">
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
      <div style="margin-bottom: 15px;">
        <span style="color: #333;">기댓값:</span> 
        <span style="font-weight: bold; color: #007bff;">${result.bestExpectedValue.toLocaleString()} G</span>
      </div>
      ${currentPriceInfo}
    `;
  }

  // 분해 결과 템플릿 생성
  createDismantleResultTemplate(config, result, selectedSource, currentPrices = null) {
    // 보상 아이템 정보 생성
    const rewardInfo = result.rewards.map(reward => 
      `<div>• ${reward.name}: ${reward.min}~${reward.max}개 (평균 ${reward.average}개)</div>`
    ).join('');

    // 보상 아이템 현재 시세 정보 생성
    let currentPriceInfo = '';
    if (currentPrices) {
      const priceInfo = result.rewards.map(reward => {
        const prices = currentPrices[reward.name];
        if (prices) {
          return `
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
                ${reward.name}:
              </div>
              <div style="font-size: 12px; color: #333; margin-left: 15px;">
                <div>• 최근 거래가: ${prices.recent ? prices.recent.toLocaleString() : 'N/A'} G</div>
                <div>• 평균 거래가: ${prices.average ? prices.average.toLocaleString() : 'N/A'} G</div>
              </div>
            </div>
          `;
        }
        return '';
      }).join('');
      
      if (priceInfo) {
        currentPriceInfo = `
          <div style="margin-top: 15px; padding-top: 12px; border-top: 1px solid #eee;">
            <div style="font-weight: bold; color: #333; margin-bottom: 8px;">
              보상 아이템 현재 시세
            </div>
            ${priceInfo}
          </div>
        `;
      }
    }

    let sourceText = '';
    if (selectedSource.id === 'avgPriceToggle') {
      sourceText = '평균가';
    } else if (selectedSource.id === 'recentPriceToggle') {
      sourceText = '최근가';
    } else if (selectedSource.id === 'manualInputToggle') {
      sourceText = '직접입력';
    }

    return `
      <div style="margin-bottom: 15px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
          데이터 소스: ${sourceText}
        </div>
        <div style="font-weight: bold; color: #007bff; font-style: italic; font-size: 16px;">
          ${config.name} 분해 기댓값 계산 결과
        </div>
      </div>
      
      <div style="margin-bottom: 8px;">
        <span style="color: #333;">보상 아이템:</span>
      </div>
      <div style="margin-bottom: 15px; margin-left: 15px; font-size: 12px; color: #333;">
        ${rewardInfo}
      </div>
      
      <div style="margin-bottom: 8px;">
        <span style="color: #333;">최소 기댓값:</span> 
        <span style="font-weight: bold; color: #333;">${result.minExpectedValue.toLocaleString()} G</span>
      </div>
      
      <div style="margin-bottom: 8px;">
        <span style="color: #333;">최대 기댓값:</span> 
        <span style="font-weight: bold; color: #333;">${result.maxExpectedValue.toLocaleString()} G</span>
      </div>
      
      <div style="margin-bottom: 15px;">
        <span style="color: #333;">평균 기댓값:</span> 
        <span style="font-weight: bold; color: #007bff;">${result.totalExpectedValue.toLocaleString()} G</span>
      </div>
      
      ${currentPriceInfo}
    `;
  }

  // 소스 텍스트 가져오기
  getSourceText(selectedSource) {
    if (selectedSource === this.avgPriceToggle) return '평균가';
    if (selectedSource === this.recentPriceToggle) return '최근가';
    if (selectedSource === this.manualInputToggle) return '직접입력';
    return '알 수 없음';
  }

  // 현재 시세 가져오기
  async getCurrentPrices(itemName) {
    try {
      return await this.priceFetcher.getCurrentPrices(itemName);
    } catch (error) {
      console.error('현재 시세를 가져오는 중 오류:', error);
      return null;
    }
  }

  // 입력 필드 업데이트
  updateInputFields(selectedItem) {
    const config = this.itemConfigs[selectedItem];
    
    // 기존 ExpectedValueUIManager와 동일한 방식으로 DOM 요소 찾기
    const recipeLabel = this.recipeInputSection.querySelector('label');
    const recipeCostInput = this.recipeCostInput;
    const multiInputContainer = this.multiInputContainer;

    if (!recipeLabel || !recipeCostInput || !multiInputContainer) {
      console.error('필요한 DOM 요소를 찾을 수 없습니다.');
      return;
    }

    if (config && config.type === 'single') {
      // 단일 재료 (조합 아이템)
      recipeLabel.textContent = `${config.materials[0].name} 시세 (G):`;
      recipeCostInput.placeholder = `${config.materials[0].name} 시세를 입력하세요`;
      recipeCostInput.style.display = 'block';
      multiInputContainer.style.display = 'none';
      
      // 기존 이벤트 리스너 제거 (cloneNode로 새로운 요소로 교체)
      const newRecipeCostInput = recipeCostInput.cloneNode(true);
      recipeCostInput.parentNode.replaceChild(newRecipeCostInput, recipeCostInput);
      this.recipeCostInput = newRecipeCostInput;
      
      // 새로운 이벤트 리스너 추가
      this.recipeCostInput.addEventListener('input', () => {
        this.updateCalculateButtonState();
      });
    } else if (config && config.type !== 'single') {
      // 다중 재료 (조합 아이템)
      recipeLabel.textContent = '재료 시세 (G):';
      recipeCostInput.style.display = 'none';
      multiInputContainer.style.display = 'block';
      
      // 기존 필드 제거
      multiInputContainer.innerHTML = '';
      
      // 새로운 입력 필드들 생성
      config.materials.forEach(material => {
        const materialDiv = document.createElement('div');
        materialDiv.style.cssText = 'margin-bottom: 12px;';
        
        const materialLabel = document.createElement('label');
        materialLabel.htmlFor = material.key;
        materialLabel.style.cssText = 'display: block; margin-bottom: 4px; font-weight: bold; color: #333; font-size: 12px;';
        materialLabel.textContent = material.name + ':';
        
        const materialInput = document.createElement('input');
        materialInput.type = 'number';
        materialInput.id = material.key;
        materialInput.placeholder = `${material.name} 시세를 입력하세요`;
        materialInput.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;';
        
        // 실시간 유효성 검사 이벤트 추가
        materialInput.addEventListener('input', () => {
          this.updateCalculateButtonState();
        });
        
        materialDiv.appendChild(materialLabel);
        materialDiv.appendChild(materialInput);
        multiInputContainer.appendChild(materialDiv);
      });
    }
  }

  // 분해 입력 필드 생성
  createDismantleInputFields(selectedItem) {
    const config = this.dismantleConfigs[selectedItem];
    if (!config || !config.rewards) return;

    this.recipeInputSection.style.display = 'block';
    this.multiInputContainer.style.display = 'block';
    this.recipeCostInput.style.display = 'none'; // 단일 입력 필드 숨김
    
    // 라벨도 숨김
    const recipeLabel = this.recipeInputSection.querySelector('label');
    if (recipeLabel) {
      recipeLabel.style.display = 'none';
    }
    
    this.multiInputContainer.innerHTML = '';

    Object.entries(config.rewards).forEach(([rewardKey, reward]) => {
      const materialDiv = document.createElement('div');
      materialDiv.style.cssText = 'margin-bottom: 12px;';
      
      const materialLabel = document.createElement('label');
      materialLabel.htmlFor = rewardKey;
      materialLabel.style.cssText = 'display: block; margin-bottom: 4px; font-weight: bold; color: #333; font-size: 12px;';
      materialLabel.textContent = reward.name + ':';
      
      const materialInput = document.createElement('input');
      materialInput.type = 'number';
      materialInput.id = rewardKey;
      materialInput.placeholder = `${reward.name} 시세를 입력하세요`;
      materialInput.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;';
      
      // 실시간 유효성 검사 이벤트 추가
      materialInput.addEventListener('input', () => {
        this.updateCalculateButtonState();
      });
      
      materialDiv.appendChild(materialLabel);
      materialDiv.appendChild(materialInput);
      this.multiInputContainer.appendChild(materialDiv);
    });
  }
}
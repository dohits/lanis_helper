/**
 * 기댓값 계산기 UI 관리 모듈
 * 모달 이벤트 처리, 입력 필드 관리, 결과 표시 등을 담당
 */
export class ExpectedValueUIManager {
  constructor(calculator, priceFetcher) {
    this.calculator = calculator;
    this.priceFetcher = priceFetcher;
    
    // 아이템별 설정 정보
    this.itemConfigs = {
      vitality_potion: {
        name: '활력의 포션',
        materials: [{ name: '마녀의 레시피', key: 'recipe' }],
        type: 'single'
      },
      seal_key: {
        name: '봉인의 열쇠',
        materials: [
          { name: '붉은 결정', key: 'redCrystal' },
          { name: '푸른 결정', key: 'blueCrystal' },
          { name: '고급 가죽끈', key: 'highGradeLeather' }
        ],
        type: 'multi'
      },
      blue_crystal: {
        name: '푸른 결정',
        materials: [
          { name: '푸른 구슬', key: 'blueBead' },
          { name: '슬라임의 체액', key: 'slimeFluid' }
        ],
        type: 'multi'
      },
      red_crystal: {
        name: '붉은 결정',
        materials: [
          { name: '붉은 구슬', key: 'redBead' },
          { name: '까마귀의 발톱', key: 'crowClaw' }
        ],
        type: 'multi'
      },
      old_leather_strap: {
        name: '낡은 가죽끈',
        materials: [{ name: '낡은 가죽', key: 'oldLeather' }],
        type: 'single'
      },
      leather_strap: {
        name: '가죽끈',
        materials: [
          { name: '가죽', key: 'leather' },
          { name: '낡은 가죽끈', key: 'oldLeatherStrap' }
        ],
        type: 'single_material'
      },
      high_grade_leather: {
        name: '고급 가죽끈',
        materials: [
          { name: '고급 가죽', key: 'highGradeLeather' },
          { name: '가죽끈', key: 'leatherStrap' }
        ],
        type: 'single_material'
      },
      iron_hammer: {
        name: '쇠망치',
        materials: [
          { name: '나무 막대기', key: 'woodenStick' },
          { name: '코크스', key: 'coke' },
          { name: '철광석', key: 'ironOre' }
        ],
        type: 'multi'
      }
    };
  }

  // 기댓값 계산기 모달 생성
  createExpectedValueModal() {
    // 기존 모달이 있으면 제거
    const existingModal = document.querySelector('.expected-value-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'expected-value-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
    `;

    const title = document.createElement('h3');
    title.textContent = '기댓값 계산기';
    title.style.marginBottom = '20px';
    title.style.textAlign = 'center';

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 15px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    `;
    closeButton.onclick = () => modal.remove();

    const content = document.createElement('div');
    
    // 상품 선택 섹션
    const itemSelectSection = document.createElement('div');
    itemSelectSection.style.marginBottom = '20px';
    
    const itemLabel = document.createElement('label');
    itemLabel.htmlFor = 'itemSelect';
    itemLabel.style.cssText = 'display: block; margin-bottom: 8px; font-weight: bold; color: #333;';
    itemLabel.textContent = '기댓값 계산 케이스 선택:';
    
    const itemSelect = document.createElement('select');
    itemSelect.id = 'itemSelect';
    itemSelect.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '케이스를 선택하세요';
    itemSelect.appendChild(defaultOption);
    
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
      itemSelect.appendChild(option);
    });
    
    itemSelectSection.appendChild(itemLabel);
    itemSelectSection.appendChild(itemSelect);
    
    // 시세 데이터 소스 선택 섹션
    const priceSourceSection = document.createElement('div');
    priceSourceSection.id = 'priceSourceSection';
    priceSourceSection.style.cssText = 'display: none; margin-bottom: 20px;';
    
    const sourceLabel = document.createElement('label');
    sourceLabel.style.cssText = 'display: block; margin-bottom: 8px; font-weight: bold; color: #333;';
    sourceLabel.textContent = '시세 데이터 소스:';
    
    // 토글 버튼 컨테이너
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = 'display: flex; gap: 10px; margin-bottom: 15px;';
    
    // 평균 거래가 토글
    const avgPriceToggle = document.createElement('button');
    avgPriceToggle.id = 'avgPriceToggle';
    avgPriceToggle.textContent = '평균 거래가';
    avgPriceToggle.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; background: #f8f9fa; cursor: pointer; font-size: 12px;';
    avgPriceToggle.dataset.selected = 'false';
    
    // 최근 거래가 토글
    const recentPriceToggle = document.createElement('button');
    recentPriceToggle.id = 'recentPriceToggle';
    recentPriceToggle.textContent = '최근 거래가';
    recentPriceToggle.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; background: #f8f9fa; cursor: pointer; font-size: 12px;';
    recentPriceToggle.dataset.selected = 'false';
    
    // 직접 입력 토글
    const manualInputToggle = document.createElement('button');
    manualInputToggle.id = 'manualInputToggle';
    manualInputToggle.textContent = '직접 입력';
    manualInputToggle.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; background: #f8f9fa; cursor: pointer; font-size: 12px;';
    manualInputToggle.dataset.selected = 'false';
    
    toggleContainer.appendChild(avgPriceToggle);
    toggleContainer.appendChild(recentPriceToggle);
    toggleContainer.appendChild(manualInputToggle);
    
    // 레시피 입력 섹션
    const recipeInputSection = document.createElement('div');
    recipeInputSection.id = 'recipeInputSection';
    recipeInputSection.style.cssText = 'display: none; margin-bottom: 20px;';
    
    // 기본 입력 필드 (활력의 포션용)
    const recipeLabel = document.createElement('label');
    recipeLabel.htmlFor = 'recipeCost';
    recipeLabel.style.cssText = 'display: block; margin-bottom: 8px; font-weight: bold; color: #333;';
    recipeLabel.textContent = '마녀의 레시피 시세 (G):';
    
    const recipeCostInput = document.createElement('input');
    recipeCostInput.type = 'number';
    recipeCostInput.id = 'recipeCost';
    recipeCostInput.placeholder = '레시피 시세를 입력하세요';
    recipeCostInput.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;';
    
    // 봉인의 열쇠용 다중 입력 필드 컨테이너
    const multiInputContainer = document.createElement('div');
    multiInputContainer.id = 'multiInputContainer';
    multiInputContainer.style.cssText = 'display: none;';
    
    priceSourceSection.appendChild(sourceLabel);
    priceSourceSection.appendChild(toggleContainer);
    recipeInputSection.appendChild(recipeLabel);
    recipeInputSection.appendChild(recipeCostInput);
    recipeInputSection.appendChild(multiInputContainer);
    
    // 결과 섹션
    const resultSection = document.createElement('div');
    resultSection.id = 'resultSection';
    resultSection.style.cssText = 'display: none; margin-bottom: 20px;';
    
    const resultTitle = document.createElement('h4');
    resultTitle.style.cssText = 'margin-bottom: 10px; color: #333;';
    resultTitle.textContent = '계산 결과';
    
    const calculationResult = document.createElement('div');
    calculationResult.id = 'calculationResult';
    calculationResult.style.cssText = 'background: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #007bff;';
    calculationResult.textContent = '계산 결과가 여기에 표시됩니다';
    
    resultSection.appendChild(resultTitle);
    resultSection.appendChild(calculationResult);
    
    // 버튼 섹션
    const buttonSection = document.createElement('div');
    buttonSection.style.textAlign = 'center';
    
    const calculateBtn = document.createElement('button');
    calculateBtn.id = 'calculateBtn';
    calculateBtn.textContent = '계산하기';
    calculateBtn.style.cssText = 'padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '닫기';
    closeBtn.style.cssText = 'padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;';
    closeBtn.onclick = () => modal.remove();
    
    buttonSection.appendChild(calculateBtn);
    buttonSection.appendChild(closeBtn);
    
    // 모든 섹션을 content에 추가
    content.appendChild(itemSelectSection);
    content.appendChild(priceSourceSection);
    content.appendChild(recipeInputSection);
    content.appendChild(resultSection);
    content.appendChild(buttonSection);

    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(content);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // ESC 키로 닫기
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    // 이벤트 핸들러 추가 (모달이 DOM에 추가된 후)
    setTimeout(() => {
      this.setupModalEvents(modal);
    }, 0);

    return modal;
  }

  // 모달 이벤트 설정
  setupModalEvents(modal) {
    const itemSelect = modal.querySelector('#itemSelect');
    const priceSourceSection = modal.querySelector('#priceSourceSection');
    const recipeInputSection = modal.querySelector('#recipeInputSection');
    const recipeCostInput = modal.querySelector('#recipeCost');
    const resultSection = modal.querySelector('#resultSection');
    const calculateBtn = modal.querySelector('#calculateBtn');
    
    // 토글 버튼들
    const avgPriceToggle = modal.querySelector('#avgPriceToggle');
    const recentPriceToggle = modal.querySelector('#recentPriceToggle');
    const manualInputToggle = modal.querySelector('#manualInputToggle');

    this.setupToggleEvents(modal, avgPriceToggle, recentPriceToggle, manualInputToggle, recipeInputSection, recipeCostInput);
    this.setupItemSelectEvent(modal, itemSelect, priceSourceSection, resultSection, avgPriceToggle);
    this.setupCalculateEvent(modal, calculateBtn, itemSelect, manualInputToggle, recipeCostInput);
  }

  // 토글 버튼 이벤트 설정
  setupToggleEvents(modal, avgPriceToggle, recentPriceToggle, manualInputToggle, recipeInputSection, recipeCostInput) {
    const updateToggleStyles = () => {
      const toggles = [avgPriceToggle, recentPriceToggle, manualInputToggle];
      toggles.forEach(toggle => {
        if (toggle.dataset.selected === 'true') {
          toggle.style.background = '#007bff';
          toggle.style.color = 'white';
          toggle.style.borderColor = '#007bff';
        } else {
          toggle.style.background = '#f8f9fa';
          toggle.style.color = '#333';
          toggle.style.borderColor = '#ddd';
        }
      });
    };

    const setupToggleClick = (selectedToggle) => {
      [avgPriceToggle, recentPriceToggle, manualInputToggle].forEach(toggle => {
        toggle.dataset.selected = 'false';
      });
      selectedToggle.dataset.selected = 'true';
      updateToggleStyles();
      
      // 직접 입력이 선택된 경우에만 입력 필드 표시
      if (selectedToggle === manualInputToggle) {
        recipeInputSection.style.display = 'block';
        this.updateInputFields(modal, modal.querySelector('#itemSelect').value);
      } else {
        recipeInputSection.style.display = 'none';
        recipeCostInput.value = '';
        this.clearMultiInputFields(modal);
      }
    };

    avgPriceToggle.addEventListener('click', () => setupToggleClick(avgPriceToggle));
    recentPriceToggle.addEventListener('click', () => setupToggleClick(recentPriceToggle));
    manualInputToggle.addEventListener('click', () => setupToggleClick(manualInputToggle));
  }

  // 아이템 선택 이벤트 설정
  setupItemSelectEvent(modal, itemSelect, priceSourceSection, resultSection, avgPriceToggle) {
    itemSelect.addEventListener('change', (e) => {
      const selectedItem = e.target.value;
      const supportedItems = Object.keys(this.itemConfigs);
      const equipmentItems = ['white_equipment', 'blue_equipment', 'yellow_equipment', 'purple_equipment', 'red_equipment'];
      
      if (supportedItems.includes(selectedItem)) {
        // 등급 장비 아이템들은 시세 데이터 소스 필드를 숨김
        if (equipmentItems.includes(selectedItem)) {
          priceSourceSection.style.display = 'none';
          modal.querySelector('#recipeInputSection').style.display = 'none';
          resultSection.style.display = 'none';
          this.clearMultiInputFields(modal);
        } else {
          priceSourceSection.style.display = 'block';
          resultSection.style.display = 'none';
          // 기본값으로 평균 거래가 선택
          avgPriceToggle.click();
        }
      } else {
        priceSourceSection.style.display = 'none';
        modal.querySelector('#recipeInputSection').style.display = 'none';
        resultSection.style.display = 'none';
        this.clearMultiInputFields(modal);
      }
    });
  }

  // 계산 버튼 이벤트 설정
  setupCalculateEvent(modal, calculateBtn, itemSelect, manualInputToggle, recipeCostInput) {
    calculateBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const selectedItem = itemSelect.value;
      const equipmentItems = ['white_equipment', 'blue_equipment', 'yellow_equipment', 'purple_equipment', 'red_equipment'];

      if (!selectedItem) {
        alert('상품을 선택해주세요.');
        return;
      }

      // 등급 장비 아이템들 체크 (준비중인 아이템들)
      if (equipmentItems.includes(selectedItem)) {
        const resultSection = modal.querySelector('#resultSection');
        const calculationResult = modal.querySelector('#calculationResult');
        if (resultSection && calculationResult) {
          calculationResult.innerHTML = '<div style="color: #dc3545; text-align: center;">계산 로직이 준비 중입니다.</div>';
          resultSection.style.display = 'block';
        }
        return;
      }

      const selectedSource = modal.querySelector('[data-selected="true"]');
      if (!selectedSource) {
        alert('시세 데이터 소스를 선택해주세요.');
        return;
      }

      // 로딩 상태 시작
      this.showLoadingState(modal, calculateBtn);

      try {
        const materialCosts = await this.getMaterialCosts(modal, selectedItem, selectedSource, manualInputToggle, recipeCostInput);
        
        // 단일 재료 아이템의 경우 recipeCost를 추출
        const config = this.itemConfigs[selectedItem];
        let result;
        if (config.type === 'single') {
          const material = config.materials[0];
          const recipeCost = materialCosts[material.key];
          result = this.calculator.calculateExpectedValue(selectedItem, recipeCost);
        } else {
          result = this.calculator.calculateExpectedValue(selectedItem, materialCosts);
        }
        
        this.displayCalculationResult(modal, selectedItem, result, selectedSource);
      } catch (error) {
        alert('계산 중 오류가 발생했습니다: ' + error.message);
      } finally {
        // 로딩 상태 종료
        this.hideLoadingState(modal, calculateBtn);
      }
    });
  }

  // 로딩 상태 표시
  showLoadingState(modal, calculateBtn) {
    // 버튼 비활성화 및 로딩 텍스트
    calculateBtn.disabled = true;
    calculateBtn.textContent = '계산 중...';
    calculateBtn.style.cssText = 'padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: not-allowed; margin-right: 10px;';

    // 결과 섹션에 스켈레톤 표시
    const resultSection = modal.querySelector('#resultSection');
    const calculationResult = modal.querySelector('#calculationResult');
    
    if (resultSection && calculationResult) {
      resultSection.style.display = 'block';
      calculationResult.innerHTML = this.createSkeletonTemplate();
    }
  }

  // 로딩 상태 숨김
  hideLoadingState(modal, calculateBtn) {
    // 버튼 활성화 및 원래 텍스트
    calculateBtn.disabled = false;
    calculateBtn.textContent = '계산하기';
    calculateBtn.style.cssText = 'padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;';
  }

  // 스켈레톤 템플릿 생성
  createSkeletonTemplate() {
    return `
      <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #007bff;">
        <div style="margin-bottom: 15px;">
          <div style="height: 20px; background: #e9ecef; border-radius: 4px; margin-bottom: 8px; animation: pulse 1.5s infinite;"></div>
          <div style="height: 16px; background: #e9ecef; border-radius: 4px; width: 60%; animation: pulse 1.5s infinite;"></div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <div style="height: 18px; background: #e9ecef; border-radius: 4px; margin-bottom: 8px; animation: pulse 1.5s infinite;"></div>
          <div style="height: 16px; background: #e9ecef; border-radius: 4px; width: 70%; animation: pulse 1.5s infinite;"></div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <div style="height: 18px; background: #e9ecef; border-radius: 4px; margin-bottom: 8px; animation: pulse 1.5s infinite;"></div>
          <div style="height: 16px; background: #e9ecef; border-radius: 4px; width: 50%; animation: pulse 1.5s infinite;"></div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <div style="height: 18px; background: #e9ecef; border-radius: 4px; margin-bottom: 8px; animation: pulse 1.5s infinite;"></div>
          <div style="height: 16px; background: #e9ecef; border-radius: 4px; width: 80%; animation: pulse 1.5s infinite;"></div>
        </div>
        
        <div>
          <div style="height: 18px; background: #e9ecef; border-radius: 4px; margin-bottom: 8px; animation: pulse 1.5s infinite;"></div>
          <div style="height: 16px; background: #e9ecef; border-radius: 4px; width: 40%; animation: pulse 1.5s infinite;"></div>
        </div>
      </div>
      
      <style>
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      </style>
    `;
  }

  // 재료 비용 가져오기
  async getMaterialCosts(modal, selectedItem, selectedSource, manualInputToggle, recipeCostInput) {
    const config = this.itemConfigs[selectedItem];
    if (!config) {
      throw new Error('지원하지 않는 아이템입니다.');
    }

    if (config.type === 'single') {
      return await this.getSingleMaterialCost(modal, selectedItem, selectedSource, manualInputToggle, recipeCostInput);
    } else {
      return await this.getMultiMaterialCosts(modal, selectedItem, selectedSource, manualInputToggle);
    }
  }

  // 단일 재료 비용 가져오기
  async getSingleMaterialCost(modal, selectedItem, selectedSource, manualInputToggle, recipeCostInput) {
    const config = this.itemConfigs[selectedItem];
    const material = config.materials[0];
    let cost = 0;

    if (selectedSource === manualInputToggle) {
      if (!recipeCostInput || !recipeCostInput.value) {
        throw new Error('재료 시세를 입력해주세요.');
      }
      cost = parseInt(recipeCostInput.value) || 0;
      if (cost <= 0) {
        throw new Error('재료 시세를 입력해주세요.');
      }
    } else {
      cost = await this.priceFetcher.fetchItemPriceFromGoogleSheet(material.name, selectedSource);
      if (cost <= 0) {
        throw new Error(`구글 시트에서 ${material.name} 시세를 가져올 수 없습니다.`);
      }
    }

    return { [material.key]: cost };
  }

  // 다중 재료 비용 가져오기
  async getMultiMaterialCosts(modal, selectedItem, selectedSource, manualInputToggle) {
    const config = this.itemConfigs[selectedItem];
    const materialCosts = {};

    if (selectedSource === manualInputToggle) {
      // 직접 입력
      for (const material of config.materials) {
        const inputElement = modal.querySelector(`#${material.key}`);
        if (!inputElement || !inputElement.value) {
          throw new Error('모든 재료의 시세를 입력해주세요.');
        }
        const cost = parseInt(inputElement.value) || 0;
        if (cost <= 0) {
          throw new Error('모든 재료의 시세를 입력해주세요.');
        }
        materialCosts[material.key] = cost;
      }
    } else {
      // 구글 시트에서 가져오기
      for (const material of config.materials) {
        const cost = await this.priceFetcher.fetchItemPriceFromGoogleSheet(material.name, selectedSource);
        if (cost <= 0) {
          throw new Error(`구글 시트에서 ${material.name} 시세를 가져올 수 없습니다.`);
        }
        materialCosts[material.key] = cost;
      }
    }

    // 평균 계산
    const costs = Object.values(materialCosts);
    materialCosts.average = Math.round(costs.reduce((sum, cost) => sum + cost, 0) / costs.length);

    return materialCosts;
  }

  // 단일 재료 비용 가져오기 (수정)
  async getSingleMaterialCost(modal, selectedItem, selectedSource, manualInputToggle, recipeCostInput) {
    const config = this.itemConfigs[selectedItem];
    const material = config.materials[0];
    let cost = 0;

    if (selectedSource === manualInputToggle) {
      cost = parseInt(recipeCostInput.value) || 0;
      if (cost <= 0) {
        throw new Error('재료 시세를 입력해주세요.');
      }
    } else {
      cost = await this.priceFetcher.fetchItemPriceFromGoogleSheet(material.name, selectedSource);
      if (cost <= 0) {
        throw new Error(`구글 시트에서 ${material.name} 시세를 가져올 수 없습니다.`);
      }
    }

    return { [material.key]: cost };
  }

  // 입력 필드 업데이트
  updateInputFields(modal, selectedItem) {
    const config = this.itemConfigs[selectedItem];
    if (!config) return;

    const recipeLabel = modal.querySelector('label[for="recipeCost"]');
    const recipeCostInput = modal.querySelector('#recipeCost');
    const multiInputContainer = modal.querySelector('#multiInputContainer');

    if (!recipeLabel || !recipeCostInput || !multiInputContainer) {
      console.error('필요한 DOM 요소를 찾을 수 없습니다.');
      return;
    }

    if (config.type === 'single') {
      // 단일 재료
      recipeLabel.textContent = `${config.materials[0].name} 시세 (G):`;
      recipeCostInput.placeholder = `${config.materials[0].name} 시세를 입력하세요`;
      recipeCostInput.style.display = 'block';
      multiInputContainer.style.display = 'none';
    } else {
      // 다중 재료
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
        
        materialDiv.appendChild(materialLabel);
        materialDiv.appendChild(materialInput);
        multiInputContainer.appendChild(materialDiv);
      });
    }
  }

  // 다중 입력 필드 초기화
  clearMultiInputFields(modal) {
    const multiInputContainer = modal.querySelector('#multiInputContainer');
    if (multiInputContainer) {
      multiInputContainer.innerHTML = '';
    }
  }

  // 계산 결과 표시
  displayCalculationResult(modal, itemId, result, selectedSource) {
    const resultSection = modal.querySelector('#resultSection');
    const calculationResult = modal.querySelector('#calculationResult');
    const itemInfo = this.calculator.getItemInfo(itemId);

    if (!resultSection || !calculationResult) {
      console.error('결과 표시 요소를 찾을 수 없습니다.');
      return;
    }

    const config = this.itemConfigs[itemId];
    if (!config) {
      calculationResult.innerHTML = '<div style="color: #dc3545;">계산 로직이 준비 중입니다.</div>';
      resultSection.style.display = 'block';
      return;
    }

    // 데이터 소스 표시 텍스트
    let sourceText = '';
    if (selectedSource.id === 'avgPriceToggle') {
      sourceText = '평균 거래가';
    } else if (selectedSource.id === 'recentPriceToggle') {
      sourceText = '최근 거래가';
    } else if (selectedSource.id === 'manualInputToggle') {
      sourceText = '직접 입력';
    }

    // 재료 정보 생성
    let materialInfo = '';
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

    // 현재 시세 가져오기
    this.getCurrentPrices(itemInfo.name).then(currentPrices => {
      const template = this.createCalculationResultTemplate(itemInfo, sourceText, materialInfo, result, currentPrices);
      calculationResult.innerHTML = template;
      resultSection.style.display = 'block';
    }).catch(() => {
      const template = this.createCalculationResultTemplate(itemInfo, sourceText, materialInfo, result);
      calculationResult.innerHTML = template;
      resultSection.style.display = 'block';
    });
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
      <div style="margin-bottom: 15px;">
        <span style="color: #333;">기댓값:</span> 
        <span style="font-weight: bold; color: #007bff;">${result.bestExpectedValue.toLocaleString()} G</span>
      </div>
      ${currentPriceInfo}
    `;
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
} 
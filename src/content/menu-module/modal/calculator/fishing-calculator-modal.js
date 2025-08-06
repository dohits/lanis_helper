import BaseModal from '../base/base-modal.js';
import { FishingLevelCalculator } from '../../../calculator/fish/fishing-level-calculator.js';
import { FishingUIHelper } from '../../../calculator/fish/fishing-ui-helper.js';
import { FishingRewardCalculator } from '../../../calculator/fish/fishing-reward-calculator.js';

/**
 * 낚시 계산기 모달
 * BaseModal을 상속받아 일관된 모달 구조를 제공
 */
export class FishingCalculatorModal extends BaseModal {
  constructor() {
    super({
      id: 'fishing-calculator-modal',
      title: '낚시 계산기',
      className: 'fishing-calculator-modal',
      contentClassName: 'fishing-calculator-modal-content',
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '95vw',
      height: 'auto',
      closeOnOutsideClick: true,
      closeOnEsc: true
    });

    // 계산기 초기화
    this.calculator = new FishingLevelCalculator();
    
    // UI 요소들
    this.contentContainer = null;
    this.resultContainer = null;
  }

  // 모달 열기 (오버라이드)
  open() {
    super.open();
    
    // modal-body 패딩 제거
    if (this.body) {
      this.body.style.padding = '0';
    }
    
    // max-width를 800px로 설정
    if (this.content) {
      this.content.style.maxWidth = '800px';
    }
    
    this.createContent();
  }

  // 콘텐츠 생성
  createContent() {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 0px;
      padding: 16px;
      overflow-y: auto;
      min-height: 400px;
      max-height: calc(95vh - 120px);
    `;



    // 토글 버튼 섹션
    const toggleSection = document.createElement('div');
    toggleSection.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      justify-content: center;
      flex-wrap: wrap;
    `;

    // 토글 버튼들 생성
    const buttons = [
      { id: 'tab1', text: '기댓값', active: true },
      { id: 'tab2', text: '시뮬레이터', active: false },
      { id: 'tab3', text: '확률표', active: false }
    ];

    buttons.forEach(button => {
      const btn = document.createElement('button');
      btn.id = button.id;
      btn.textContent = button.text;
      btn.style.cssText = `
        padding: 8px 12px;
        border: 2px solid #007bff;
        background: ${button.active ? '#007bff' : 'white'};
        color: ${button.active ? 'white' : '#007bff'};
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        transition: all 0.3s ease;
        flex: 1;
        min-width: 80px;
        white-space: nowrap;
      `;
      
      btn.addEventListener('click', () => {
        this.switchTab(button.id);
      });
      
      toggleSection.appendChild(btn);
    });

    container.appendChild(toggleSection);

         // 콘텐츠 영역
     this.contentArea = document.createElement('div');
     this.contentArea.id = 'fishing-content-area';
     this.contentArea.style.cssText = `
       flex: 1;
       min-height: 300px;
       overflow-y: auto;
     `;
    container.appendChild(this.contentArea);

    // 초기 탭 설정
    this.currentTab = 'tab1';
    this.showTabContent('tab1').catch(error => {
      console.error('초기 탭 콘텐츠 로드 실패:', error);
    });

    // BaseModal의 setContent 메서드 사용
    this.setContent(container);
  }

  // 탭 전환
  async switchTab(tabId) {
    // 모든 버튼 비활성화
    const buttons = document.querySelectorAll('#tab1, #tab2, #tab3');
    buttons.forEach(btn => {
      btn.style.background = 'white';
      btn.style.color = '#007bff';
    });

    // 선택된 버튼 활성화
    const selectedBtn = document.getElementById(tabId);
    if (selectedBtn) {
      selectedBtn.style.background = '#007bff';
      selectedBtn.style.color = 'white';
    }

    // 콘텐츠 전환
    this.currentTab = tabId;
    await this.showTabContent(tabId);
  }

  // 탭 콘텐츠 표시
  async showTabContent(tabId) {
    if (!this.contentArea) return;

    this.contentArea.innerHTML = '';

    switch (tabId) {
      case 'tab1':
        await this.showTab1Content();
        break;
      case 'tab2':
        this.showTab2Content();
        break;
      case 'tab3':
        this.showTab3Content();
        break;
    }
  }

    // 예비1 탭 콘텐츠 (보상 계산)
  async showTab1Content() {
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 8px;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 100%;
      overflow-x: hidden;
    `;

    // 제목 섹션 제거됨

    // 시세 소스 선택 섹션
    const sourceSection = document.createElement('div');
    sourceSection.style.cssText = `
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s ease;
    `;

    const recentBtn = document.createElement('button');
    recentBtn.textContent = '최신 시세';
    recentBtn.id = 'recentPriceBtn';
    recentBtn.style.cssText = `
      padding: 6px 12px;
      border: 2px solid #28a745;
      background: #28a745;
      color: white;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      font-size: 12px;
      transition: all 0.3s ease;
      flex: 1;
      min-width: 80px;
      white-space: nowrap;
    `;

    const avgBtn = document.createElement('button');
    avgBtn.textContent = '평균 시세';
    avgBtn.id = 'avgPriceBtn';
    avgBtn.style.cssText = `
      padding: 6px 12px;
      border: 2px solid #28a745;
      background: white;
      color: #28a745;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      font-size: 12px;
      transition: all 0.3s ease;
      flex: 1;
      min-width: 80px;
      white-space: nowrap;
    `;

    sourceSection.appendChild(recentBtn);
    sourceSection.appendChild(avgBtn);
    content.appendChild(sourceSection);

    // 애니메이션으로 토글 버튼 표시
    setTimeout(() => {
      if (sourceSection) {
        sourceSection.style.opacity = '1';
        sourceSection.style.transform = 'translateY(0)';
      }
    }, 100);

    // 로딩 상태
    const loadingSection = document.createElement('div');
    loadingSection.id = 'loadingSection';
    loadingSection.style.cssText = `
      text-align: center;
      padding: 40px;
      color: #666;
      font-size: 14px;
    `;
    loadingSection.innerHTML = '시세 데이터를 불러오는 중...';
    content.appendChild(loadingSection);

    // 결과 섹션
    const resultSection = document.createElement('div');
    resultSection.id = 'rewardResultSection';
    resultSection.style.cssText = `
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      max-width: 100%;
    `;
    content.appendChild(resultSection);

    this.contentArea.appendChild(content);

    // 버튼 이벤트 설정
    recentBtn.addEventListener('click', () => this.loadRewardData('recent'));
    avgBtn.addEventListener('click', () => this.loadRewardData('average'));

    // 초기 데이터 로드 (DOM 요소들이 완전히 생성된 후)
    setTimeout(() => {
      this.loadRewardData('recent').catch(error => {
        console.error('초기 데이터 로드 실패:', error);
      });
    }, 100);
  }

  // 보상 데이터 로드
  async loadRewardData(priceType) {
    // DOM 요소들이 완전히 생성될 때까지 대기
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const loadingSection = document.getElementById('loadingSection');
      const resultSection = document.getElementById('rewardResultSection');
      const recentBtn = document.getElementById('recentPriceBtn');
      const avgBtn = document.getElementById('avgPriceBtn');

      if (loadingSection && resultSection && recentBtn && avgBtn) {
        break;
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('rewardResultSection');
    const recentBtn = document.getElementById('recentPriceBtn');
    const avgBtn = document.getElementById('avgPriceBtn');

    // DOM 요소들이 존재하는지 확인
    if (!loadingSection || !resultSection || !recentBtn || !avgBtn) {
      console.error('필요한 DOM 요소를 찾을 수 없습니다.');
      return;
    }

    // 버튼 상태 업데이트
    if (priceType === 'recent') {
      recentBtn.style.background = '#28a745';
      recentBtn.style.color = 'white';
      avgBtn.style.background = 'white';
      avgBtn.style.color = '#28a745';
    } else {
      recentBtn.style.background = 'white';
      recentBtn.style.color = '#28a745';
      avgBtn.style.background = '#28a745';
      avgBtn.style.color = 'white';
    }

    // 로딩 표시
    loadingSection.style.display = 'block';
    resultSection.innerHTML = '';

    try {
      // 보상 계산기 초기화
      const rewardCalculator = new FishingRewardCalculator();
      
      // 모든 단계의 보상 계산
      const results = await rewardCalculator.calculateAllLevelRewards(priceType);
      
      // 결과 표시
      const rewardResults = rewardCalculator.createRewardResults(results, priceType);
      resultSection.appendChild(rewardResults);
      
      // 로딩 숨기기
      loadingSection.style.display = 'none';
    } catch (error) {
      console.error('보상 데이터 로드 실패:', error);
      if (loadingSection) {
        loadingSection.innerHTML = '시세 데이터 로드에 실패했습니다. 다시 시도해주세요.';
        loadingSection.style.color = '#dc3545';
      }
    }
  }

  // 시뮬레이터 탭 콘텐츠
  showTab2Content() {
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0px;
    `;



    // 서브 토글 버튼 섹션
    const subToggleSection = document.createElement('div');
    subToggleSection.id = 'simulator-sub-toggle';
    subToggleSection.style.cssText = `
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 16px;
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s ease;
      flex-wrap: wrap;
    `;

    // 서브 토글 버튼들 생성
    const subButtons = [
      { id: 'sub-interactive', text: '인터렉티브', active: true },
      { id: 'sub-direct', text: '다이렉트', active: false }
    ];

    subButtons.forEach(button => {
      const btn = document.createElement('button');
      btn.id = button.id;
      btn.textContent = button.text;
      btn.style.cssText = `
        padding: 6px 12px;
        border: 2px solid #28a745;
        background: ${button.active ? '#28a745' : 'white'};
        color: ${button.active ? 'white' : '#28a745'};
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 12px;
        transition: all 0.3s ease;
        flex: 1;
        min-width: 80px;
        white-space: nowrap;
      `;
      
      btn.addEventListener('click', () => {
        this.switchSubTab(button.id);
      });
      
      subToggleSection.appendChild(btn);
    });

    content.appendChild(subToggleSection);

         // 시뮬레이터 콘텐츠 영역
     this.simulatorContentArea = document.createElement('div');
     this.simulatorContentArea.id = 'simulator-content-area';
     this.simulatorContentArea.style.cssText = `
       flex: 1;
       min-height: 300px;
       overflow-y: auto;
     `;
    content.appendChild(this.simulatorContentArea);

    this.contentArea.appendChild(content);

    // 애니메이션으로 서브 토글 버튼 표시
    setTimeout(() => {
      const subToggle = document.getElementById('simulator-sub-toggle');
      if (subToggle) {
        subToggle.style.opacity = '1';
        subToggle.style.transform = 'translateY(0)';
      }
    }, 300);

    // 초기 서브 탭 설정
    this.currentSubTab = 'sub-interactive';
    this.showSubTabContent('sub-interactive');
  }

  // 서브 탭 전환
  switchSubTab(subTabId) {
    // 모든 서브 버튼 비활성화
    const subButtons = document.querySelectorAll('#sub-interactive, #sub-direct');
    subButtons.forEach(btn => {
      btn.style.background = 'white';
      btn.style.color = '#28a745';
    });

    // 선택된 서브 버튼 활성화
    const selectedSubBtn = document.getElementById(subTabId);
    if (selectedSubBtn) {
      selectedSubBtn.style.background = '#28a745';
      selectedSubBtn.style.color = 'white';
    }

    // 콘텐츠 전환
    this.currentSubTab = subTabId;
    this.showSubTabContent(subTabId);
  }

  // 서브 탭 콘텐츠 표시
  showSubTabContent(subTabId) {
    if (!this.simulatorContentArea) return;

    this.simulatorContentArea.innerHTML = '';

    switch (subTabId) {
      case 'sub-interactive':
        this.showInteractiveSimulator();
        break;
      case 'sub-direct':
        this.showDirectSimulator();
        break;
    }
  }

  // 인터렉티브 시뮬레이터
  showInteractiveSimulator() {
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px;
      max-width: 100%;
      overflow-x: hidden;
      height: 100%;
    `;

    // 현재 상태 섹션 (카드 스타일)
    const statusSection = document.createElement('div');
    statusSection.style.cssText = `
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #dee2e6;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 4px;
    `;
    
    const statusHeader = document.createElement('h5');
    statusHeader.textContent = '🎯 현재 상태';
    statusHeader.style.cssText = `
      margin: 0 0 12px 0;
      color: #495057;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    statusSection.appendChild(statusHeader);
    
    const statusGrid = document.createElement('div');
    statusGrid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      font-size: 13px;
    `;
    
    const statusItems = [
      { label: '현재 단계', id: 'currentLevel', value: '1', unit: '단계', icon: '🎣' },
      { label: '총 시도 횟수', id: 'totalAttempts', value: '0', unit: '회', icon: '🔄' },
      { label: '총 물고기 소모', id: 'totalFish', value: '0', unit: '개', icon: '🐟' },
      { label: '누적 물고기', id: 'cumulativeFish', value: '0', unit: '개', icon: '📊' }
    ];
    
    statusItems.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.cssText = `
        background: rgba(255, 255, 255, 0.7);
        padding: 10px;
        border-radius: 8px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        min-height: 60px;
        justify-content: center;
      `;
      
      itemDiv.innerHTML = `
        <div style="color: #6c757d; font-size: 11px; margin-bottom: 4px; font-weight: 500;">
          ${item.icon} ${item.label}
        </div>
        <div style="color: #212529; font-size: 16px; font-weight: 600;">
          <span id="${item.id}">${item.value}</span>${item.unit}
        </div>
      `;
      statusGrid.appendChild(itemDiv);
    });
    
    statusSection.appendChild(statusGrid);
    content.appendChild(statusSection);

    // 버튼 섹션 (카드 스타일)
    const buttonSection = document.createElement('div');
    buttonSection.style.cssText = `
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #dee2e6;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    `;

    const upgradeBtn = document.createElement('button');
    upgradeBtn.textContent = '🎣 업그레이드';
    upgradeBtn.style.cssText = `
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 140px;
      box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
      position: relative;
      overflow: hidden;
    `;
    
    upgradeBtn.addEventListener('mouseenter', () => {
      upgradeBtn.style.transform = 'translateY(-2px)';
      upgradeBtn.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.4)';
    });
    
    upgradeBtn.addEventListener('mouseleave', () => {
      upgradeBtn.style.transform = 'translateY(0)';
      upgradeBtn.style.boxShadow = '0 2px 8px rgba(0, 123, 255, 0.3)';
    });
    
    upgradeBtn.addEventListener('click', () => this.upgrade());

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '🔄 초기화';
    resetBtn.style.cssText = `
      background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 140px;
      box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
      position: relative;
      overflow: hidden;
    `;
    
    resetBtn.addEventListener('mouseenter', () => {
      resetBtn.style.transform = 'translateY(-2px)';
      resetBtn.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.4)';
    });
    
    resetBtn.addEventListener('mouseleave', () => {
      resetBtn.style.transform = 'translateY(0)';
      resetBtn.style.boxShadow = '0 2px 8px rgba(108, 117, 125, 0.3)';
    });
    
    resetBtn.addEventListener('click', () => this.resetSimulator());

    buttonSection.appendChild(upgradeBtn);
    buttonSection.appendChild(resetBtn);
    content.appendChild(buttonSection);

    // 결과 표시 영역 (카드 스타일)
    const resultSection = document.createElement('div');
    resultSection.id = 'upgradeResult';
    resultSection.style.cssText = `
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #dee2e6;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-align: center;
      font-weight: 600;
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    `;
    
    const resultContent = document.createElement('div');
    resultContent.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    `;
    
    resultContent.innerHTML = `
      <div style="color: #6c757d; font-size: 12px; font-weight: 500;">
        ⚡ 시뮬레이션 결과
      </div>
      <div style="color: #adb5bd; font-size: 13px;">
        결과가 여기에 표시됩니다
      </div>
    `;
    
    resultSection.appendChild(resultContent);
    content.appendChild(resultSection);

    // 히스토리 섹션 (카드 스타일)
    const historySection = document.createElement('div');
    historySection.style.cssText = `
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #dee2e6;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      height: 280px;
      display: flex;
      flex-direction: column;
    `;
    
    const historyHeader = document.createElement('h5');
    historyHeader.textContent = '📜 업그레이드 히스토리';
    historyHeader.style.cssText = `
      margin: 0 0 12px 0;
      color: #495057;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    historySection.appendChild(historyHeader);
    
    const historyContainer = document.createElement('div');
    historyContainer.id = 'upgradeHistory';
    historyContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(0, 0, 0, 0.1);
      padding: 12px;
      border-radius: 8px;
      color: #495057;
      font-size: 13px;
    `;
    
    const emptyState = document.createElement('div');
    emptyState.style.cssText = `
      text-align: center;
      color: #adb5bd;
      padding: 40px 20px;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      height: 100%;
      justify-content: center;
    `;
    emptyState.innerHTML = `
      <div style="font-size: 24px; opacity: 0.5;">🎣</div>
      <div>히스토리가 여기에 표시됩니다</div>
      <div style="font-size: 11px; opacity: 0.7;">낚시 시도하기 버튼을 눌러보세요!</div>
    `;
    
    historyContainer.appendChild(emptyState);
    historySection.appendChild(historyContainer);
    content.appendChild(historySection);

    this.simulatorContentArea.appendChild(content);

    // 시뮬레이터 상태 초기화
    this.initSimulatorState();
  }

  // 시뮬레이터 상태 초기화
  initSimulatorState() {
    this.simulatorState = {
      currentLevel: 1,
      totalAttempts: 0,
      totalFish: 0,
      cumulativeFish: 0,
      history: []
    };
    this.updateSimulatorUI();
  }

  // 낚시 시도
  upgrade() {
    const prob = this.calculator.probabilities[this.simulatorState.currentLevel];
    if (!prob) return;
    
    this.simulatorState.totalAttempts++;
    this.simulatorState.totalFish += this.calculator.fishPerAttempt;
    
    const random = Math.random() * 100;
    let cumulative = 0;
    let result = '';
    let newLevel = this.simulatorState.currentLevel;
    
    // plus2
    cumulative += prob.plus2;
    if (random < cumulative) {
      newLevel = Math.min(this.simulatorState.currentLevel + 2, this.calculator.maxLevel);
      result = `🎉 +2! ${this.simulatorState.currentLevel}단계 → ${newLevel}단계`;
    } else {
      // plus1
      cumulative += prob.plus1;
      if (random < cumulative) {
        newLevel = Math.min(this.simulatorState.currentLevel + 1, this.calculator.maxLevel);
        result = `👍 +1! ${this.simulatorState.currentLevel}단계 → ${newLevel}단계`;
      } else {
        // zero
        cumulative += prob.zero;
        if (random < cumulative) {
          result = `➡️ 유지! ${this.simulatorState.currentLevel}단계 유지`;
        } else {
          // minus1
          cumulative += prob.minus1;
          if (random < cumulative) {
            newLevel = Math.max(this.simulatorState.currentLevel - 1, 1);
            result = `👎 -1! ${this.simulatorState.currentLevel}단계 → ${newLevel}단계`;
          } else {
            // reset
            newLevel = 1;
            result = `💥 초기화! ${this.simulatorState.currentLevel}단계 → 1단계`;
          }
        }
      }
    }
    
    // 히스토리에 추가
    const historyEntry = {
      attempt: this.simulatorState.totalAttempts,
      fish: this.calculator.fishPerAttempt,
      fromLevel: this.simulatorState.currentLevel,
      toLevel: newLevel,
      result: result,
      timestamp: new Date().toLocaleTimeString()
    };
    
    this.simulatorState.history.push(historyEntry);
    this.simulatorState.currentLevel = newLevel;
    
    // UI 업데이트
    this.updateSimulatorUI();
    this.showUpgradeResult(result);
    this.updateHistory();
  }

  // 시뮬레이터 UI 업데이트
  updateSimulatorUI() {
    const currentLevelEl = document.getElementById('currentLevel');
    const totalAttemptsEl = document.getElementById('totalAttempts');
    const totalFishEl = document.getElementById('totalFish');
    const cumulativeFishEl = document.getElementById('cumulativeFish');
    
    if (currentLevelEl) currentLevelEl.textContent = this.simulatorState.currentLevel;
    if (totalAttemptsEl) totalAttemptsEl.textContent = this.simulatorState.totalAttempts;
    if (totalFishEl) totalFishEl.textContent = this.simulatorState.totalFish;
    
    // 누적 물고기 계산 (마코프 체인 기준)
    if (this.simulatorState.currentLevel > 1) {
      this.simulatorState.cumulativeFish = this.calculator.calculateExpectedFishToLevel(this.simulatorState.currentLevel);
    } else {
      this.simulatorState.cumulativeFish = 0;
    }
    if (cumulativeFishEl) cumulativeFishEl.textContent = this.simulatorState.cumulativeFish.toFixed(1);
  }

  // 업그레이드 결과 표시
  showUpgradeResult(result) {
    const resultDiv = document.getElementById('upgradeResult');
    if (!resultDiv) return;
    
    // 결과에 따른 색상 및 이모지 설정
    let bgColor, textColor, emoji, borderColor;
    if (result.includes('🎉')) {
      bgColor = 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)';
      textColor = '#155724';
      borderColor = '#c3e6cb';
      emoji = '🎉';
    } else if (result.includes('👍')) {
      bgColor = 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)';
      textColor = '#0c5460';
      borderColor = '#bee5eb';
      emoji = '👍';
    } else if (result.includes('➡️')) {
      bgColor = 'linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%)';
      textColor = '#856404';
      borderColor = '#ffeeba';
      emoji = '➡️';
    } else if (result.includes('👎')) {
      bgColor = 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)';
      textColor = '#721c24';
      borderColor = '#f5c6cb';
      emoji = '👎';
    } else {
      bgColor = 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)';
      textColor = '#721c24';
      borderColor = '#f5c6cb';
      emoji = '💥';
    }
    
    resultDiv.style.background = bgColor;
    resultDiv.style.border = `1px solid ${borderColor}`;
    resultDiv.style.transform = 'scale(1.02)';
    resultDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    
    resultDiv.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
        <div style="color: ${textColor}; font-size: 14px; font-weight: 600;">
          ${emoji} ${result}
        </div>
        <div style="color: ${textColor}; font-size: 12px; opacity: 0.8;">
          물고기 5개 소모
        </div>
      </div>
    `;
    
    // 3초 후 원래 상태로 복원
    setTimeout(() => {
      if (resultDiv) {
        resultDiv.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
        resultDiv.style.border = '1px solid #dee2e6';
        resultDiv.style.transform = 'scale(1)';
        resultDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        resultDiv.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <div style="color: #6c757d; font-size: 12px; font-weight: 500;">
              ⚡ 시뮬레이션 결과
            </div>
            <div style="color: #adb5bd; font-size: 13px;">
              결과가 여기에 표시됩니다
            </div>
          </div>
        `;
      }
    }, 3000);
  }

  // 히스토리 업데이트
  updateHistory() {
    const historyDiv = document.getElementById('upgradeHistory');
    if (!historyDiv) return;
    
    let html = '';
    
    // 최근 10개만 표시
    const recentHistory = this.simulatorState.history.slice(-10).reverse();
    
    if (recentHistory.length === 0) {
      html = `
        <div style="text-align: center; color: #adb5bd; padding: 40px 20px; font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; justify-content: center;">
          <div style="font-size: 24px; opacity: 0.5;">🎣</div>
          <div>히스토리가 여기에 표시됩니다</div>
          <div style="font-size: 11px; opacity: 0.7;">낚시 시도하기 버튼을 눌러보세요!</div>
        </div>
      `;
    } else {
      recentHistory.forEach((entry, index) => {
        // 결과에 따른 색상 설정
        let bgColor, textColor, borderColor;
        if (entry.result.includes('🎉')) {
          bgColor = 'rgba(212, 237, 218, 0.3)';
          textColor = '#155724';
          borderColor = '#c3e6cb';
        } else if (entry.result.includes('👍')) {
          bgColor = 'rgba(209, 236, 241, 0.3)';
          textColor = '#0c5460';
          borderColor = '#bee5eb';
        } else if (entry.result.includes('➡️')) {
          bgColor = 'rgba(255, 243, 205, 0.3)';
          textColor = '#856404';
          borderColor = '#ffeeba';
        } else if (entry.result.includes('👎')) {
          bgColor = 'rgba(248, 215, 218, 0.3)';
          textColor = '#721c24';
          borderColor = '#f5c6cb';
        } else {
          bgColor = 'rgba(248, 215, 218, 0.3)';
          textColor = '#721c24';
          borderColor = '#f5c6cb';
        }
        
        html += `
          <div style="
            margin: 6px 0;
            padding: 10px;
            background: ${bgColor};
            border-left: 3px solid ${borderColor};
            border-radius: 6px;
            color: ${textColor};
            font-size: 12px;
            transition: all 0.2s ease;
          ">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 600; font-size: 11px; opacity: 0.8;">
                #${entry.attempt} · ${entry.timestamp}
              </span>
            </div>
            <div style="font-weight: 600; font-size: 13px;">
              ${entry.result}
            </div>
            <div style="font-size: 11px; opacity: 0.7; margin-top: 2px;">
              물고기 ${entry.fish}개 소모
            </div>
          </div>
        `;
      });
    }
    
    historyDiv.innerHTML = html;
    historyDiv.scrollTop = 0; // 최신 항목이 위에 오도록
  }

  // 시뮬레이터 초기화
  resetSimulator() {
    this.simulatorState = {
      currentLevel: 1,
      totalAttempts: 0,
      totalFish: 0,
      cumulativeFish: 0,
      history: []
    };
    
    this.updateSimulatorUI();
    
    const historyDiv = document.getElementById('upgradeHistory');
    const resultDiv = document.getElementById('upgradeResult');
    
    if (historyDiv) {
      historyDiv.innerHTML = `
        <div style="text-align: center; color: #adb5bd; padding: 40px 20px; font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; justify-content: center;">
          <div style="font-size: 24px; opacity: 0.5;">🎣</div>
          <div>히스토리가 여기에 표시됩니다</div>
          <div style="font-size: 11px; opacity: 0.7;">낚시 시도하기 버튼을 눌러보세요!</div>
        </div>
      `;
    }
    if (resultDiv) {
      resultDiv.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
      resultDiv.style.border = '1px solid #dee2e6';
      resultDiv.style.transform = 'scale(1)';
      resultDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      resultDiv.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
          <div style="color: #6c757d; font-size: 12px; font-weight: 500;">
            ⚡ 시뮬레이션 결과
          </div>
          <div style="color: #adb5bd; font-size: 13px;">
            결과가 여기에 표시됩니다
          </div>
        </div>
      `;
    }
  }

           // 다이렉트 시뮬레이터
    showDirectSimulator() {
      const content = document.createElement('div');
      content.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
        height: 100%;
      `;

      // 입력 섹션
      const inputSection = document.createElement('div');
      inputSection.id = 'directSimulationInputSection';
      inputSection.style.cssText = `
        background: #f8f9fa;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #e9ecef;
      `;
      inputSection.innerHTML = `
        <h5 style="margin: 0 0 12px 0; color: #333; font-size: 16px;">시뮬레이션 설정</h5>
        <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
          <div>
            <label for="targetLevel" style="display: block; margin-bottom: 4px; font-weight: bold; color: #333; font-size: 14px;">목표 단계:</label>
            <input type="number" id="targetLevel" min="2" max="10" value="5" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
          </div>
          <div>
            <label for="simulationCount" style="display: block; margin-bottom: 4px; font-weight: bold; color: #333; font-size: 14px;">시뮬레이션 횟수:</label>
            <input type="number" id="simulationCount" min="100" max="100000" value="1000" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
          </div>
        </div>
      `;
      content.appendChild(inputSection);

      // 버튼 섹션 (결과 영역 위에 배치)
      const buttonSection = document.createElement('div');
      buttonSection.id = 'directSimulationButtonSection';
      buttonSection.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      `;

      const runBtn = document.createElement('button');
      runBtn.id = 'runDirectSimulationBtn';
      runBtn.textContent = '🎯 시뮬레이션 실행';
              runBtn.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          min-width: 140px;
        `;
      runBtn.addEventListener('mouseenter', () => {
        runBtn.style.transform = 'translateY(-2px)';
        runBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
      });
      runBtn.addEventListener('mouseleave', () => {
        runBtn.style.transform = 'translateY(0)';
        runBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
      });
      runBtn.addEventListener('click', () => this.runDirectSimulation());

      const resetBtn = document.createElement('button');
      resetBtn.id = 'resetDirectSimulationBtn';
      resetBtn.textContent = '⚙️ 설정 변경';
              resetBtn.style.cssText = `
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
          min-width: 140px;
        `;
      resetBtn.addEventListener('mouseenter', () => {
        resetBtn.style.transform = 'translateY(-2px)';
        resetBtn.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.6)';
      });
      resetBtn.addEventListener('mouseleave', () => {
        resetBtn.style.transform = 'translateY(0)';
        resetBtn.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.4)';
      });
      resetBtn.addEventListener('click', () => this.resetDirectSimulation());

      buttonSection.appendChild(runBtn);
      buttonSection.appendChild(resetBtn);
      content.appendChild(buttonSection);

      // 결과 표시 영역 (flex column으로 설정)
      const resultSection = document.createElement('div');
      resultSection.id = 'directSimulationResult';
      resultSection.style.cssText = `
        margin: 8px 0;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
        font-weight: bold;
        min-height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        color: #666;
      `;
      resultSection.innerHTML = `<span style="color: #999; font-size: 14px;">시뮬레이션 결과가 여기에 표시됩니다</span>`;
      content.appendChild(resultSection);

      this.simulatorContentArea.appendChild(content);
    }

   // 다이렉트 시뮬레이션 실행
   runDirectSimulation() {
     const targetLevel = parseInt(document.getElementById('targetLevel').value);
     const simulationCount = parseInt(document.getElementById('simulationCount').value);
     
     if (!targetLevel || !simulationCount) {
       alert('목표 단계와 시뮬레이션 횟수를 입력해주세요.');
       return;
     }

     const resultDiv = document.getElementById('directSimulationResult');
     resultDiv.innerHTML = '<div style="color: #666;">시뮬레이션 실행 중...</div>';

     // 비동기로 시뮬레이션 실행
     setTimeout(() => {
       const results = this.simulateMultipleTimes(targetLevel, simulationCount);
       this.displayDirectSimulationResults(results, targetLevel, simulationCount);
     }, 100);
   }

   

   // 여러 번 시뮬레이션 실행
   simulateMultipleTimes(targetLevel, count) {
     let successCount = 0;
     let totalAttempts = 0;
     let totalFish = 0;
     let minAttempts = Infinity;
     let maxAttempts = 0;
     let minFish = Infinity;
     let maxFish = 0;
     let totalEfficiency = 0;
     let expectedFish = 0;

     for (let i = 0; i < count; i++) {
       const result = this.simulateToTargetLevel(targetLevel);
       if (result.success) {
         // 목표 레벨에 도달한 경우 성공으로 간주
         successCount++;
         totalAttempts += result.attempts;
         totalFish += result.totalFish;
         totalEfficiency += result.efficiency;
         expectedFish = result.expectedFish; // 모든 결과가 동일한 기댓값을 가짐
         minAttempts = Math.min(minAttempts, result.attempts);
         maxAttempts = Math.max(maxAttempts, result.attempts);
         minFish = Math.min(minFish, result.totalFish);
         maxFish = Math.max(maxFish, result.totalFish);
       }
     }

     // 기댓값 이하로 도달한 비율 계산
     let efficientCount = 0;
     for (let i = 0; i < count; i++) {
       const result = this.simulateToTargetLevel(targetLevel);
       if (result.success && result.totalFish <= result.expectedFish) {
         efficientCount++;
       }
     }
     
     return {
       totalSimulations: count,
       successCount,
       failedCount: count - successCount,
       successRate: (successCount / count) * 100,
       efficientRate: (efficientCount / count) * 100, // 기댓값 이하 비율
       averageAttempts: successCount > 0 ? totalAttempts / successCount : 0,
       averageFish: successCount > 0 ? totalFish / successCount : 0,
       averageEfficiency: successCount > 0 ? totalEfficiency / successCount : 0,
       expectedFish: expectedFish,
       minAttempts: minAttempts === Infinity ? 0 : minAttempts,
       maxAttempts,
       minFish: minFish === Infinity ? 0 : minFish,
       maxFish
     };
   }

   // 목표 레벨까지 시뮬레이션 (마코프 체인 기댓값 기준)
   simulateToTargetLevel(targetLevel) {
     let level = 1;
     let attempts = 0;
     let totalFish = 0;
     
     // 마코프 체인으로 계산된 기댓값 (기준치)
     const expectedFishToTarget = this.calculator.calculateExpectedFishToLevel(targetLevel);

     while (level < targetLevel) {
       attempts++;
       totalFish += this.calculator.fishPerAttempt;

       const prob = this.calculator.probabilities[level];
       if (!prob) break;

       const random = Math.random() * 100;
       let cumulative = 0;

       // plus2
       cumulative += prob.plus2;
       if (random < cumulative) {
         level = Math.min(level + 2, this.calculator.maxLevel);
         continue;
       }

       // plus1
       cumulative += prob.plus1;
       if (random < cumulative) {
         level = Math.min(level + 1, this.calculator.maxLevel);
         continue;
       }

       // zero
       cumulative += prob.zero;
       if (random < cumulative) {
         continue;
       }

       // minus1
       cumulative += prob.minus1;
       if (random < cumulative) {
         level = Math.max(1, level - 1);
         continue;
       }

       // reset
       cumulative += prob.reset;
       if (random < cumulative) {
         level = 1;
         continue;
       }
     }

     // 성공 기준: 목표 레벨에 도달했을 때 (기댓값은 참고용)
     const success = level >= targetLevel;

     return {
       success: success,
       attempts,
       totalFish,
       finalLevel: level,
       expectedFish: expectedFishToTarget,
       efficiency: success ? (expectedFishToTarget / totalFish * 100) : 0
     };
   }

   // 실패한 경우 남은 시도 횟수 추정
   estimateRemainingAttempts(currentLevel, targetLevel) {
     let estimatedAttempts = 0;
     
     for (let level = currentLevel; level < targetLevel; level++) {
       const prob = this.calculator.probabilities[level];
       if (prob) {
         const successRate = prob.plus1 + prob.plus2;
         if (successRate > 0) {
           estimatedAttempts += 1 / (successRate / 100);
         } else {
           estimatedAttempts += 1000;
         }
       }
     }
     
     return Math.ceil(estimatedAttempts);
   }

                                                               // 다이렉트 시뮬레이션 결과 표시
       displayDirectSimulationResults(results, targetLevel, simulationCount) {
         const resultDiv = document.getElementById('directSimulationResult');
         
         const html = `
           <div style="text-align: center; color: #333;">
             <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
               <h3 style="margin: 0 0 10px 0; font-size: 24px;">🎯 시뮬레이션 결과</h3>
               <p style="margin: 0; font-size: 16px; opacity: 0.9;">${simulationCount.toLocaleString()}회 시뮬레이션 완료</p>
             </div>
             
             <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
               <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                 <div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border-radius: 10px;">
                   <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">${targetLevel}</div>
                   <div style="font-size: 14px; opacity: 0.9;">목표 단계</div>
                 </div>
                 <div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border-radius: 10px;">
                   <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">${results.efficientRate.toFixed(1)}%</div>
                   <div style="font-size: 14px; opacity: 0.9;">기댓값 이하 비율</div>
                 </div>
               </div>
               
               <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                 <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; border-left: 4px solid #28a745;">
                   <div style="font-weight: bold; color: #28a745; margin-bottom: 5px;">평균 시도 횟수</div>
                   <div style="font-size: 18px; font-weight: bold;">${results.averageAttempts.toFixed(1)}회</div>
                 </div>
                 <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; border-left: 4px solid #17a2b8;">
                   <div style="font-weight: bold; color: #17a2b8; margin-bottom: 5px;">평균 물고기</div>
                   <div style="font-size: 18px; font-weight: bold;">${results.averageFish.toFixed(1)}개</div>
                 </div>
               </div>
               
               <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                 <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; border-left: 4px solid #ffc107;">
                   <div style="font-weight: bold; color: #ffc107; margin-bottom: 5px;">기댓값 (마코프 체인)</div>
                   <div style="font-size: 18px; font-weight: bold;">${results.expectedFish.toFixed(1)}개</div>
                 </div>
                 <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; border-left: 4px solid #20c997;">
                   <div style="font-weight: bold; color: #20c997; margin-bottom: 5px;">평균 효율성</div>
                   <div style="font-size: 18px; font-weight: bold;">${results.averageEfficiency.toFixed(1)}%</div>
                 </div>
               </div>
               
               <div style="background: #e9ecef; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                 <div style="font-weight: bold; color: #495057; margin-bottom: 10px;">📊 상세 통계</div>
                 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                   <div><strong>성공:</strong> ${results.successCount}회</div>
                   <div><strong>실패:</strong> ${results.failedCount}회</div>
                   <div><strong>최소 시도:</strong> ${results.minAttempts}회</div>
                   <div><strong>최대 시도:</strong> ${results.maxAttempts}회</div>
                   <div><strong>최소 물고기:</strong> ${results.minFish}개</div>
                   <div><strong>최대 물고기:</strong> ${results.maxFish}개</div>
                 </div>
               </div>
               
               <div style="text-align: center; margin-top: 20px; padding: 15px; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); border-radius: 10px;">
                 <div style="font-weight: bold; color: #495057; margin-bottom: 5px;">💡 성공 기준</div>
                 <div style="font-size: 12px; color: #6c757d;">
                   • <strong>성공률:</strong> 기댓값 이하로 목표 레벨 도달한 비율<br>
                   • <strong>평균:</strong> 모든 목표 달성 케이스의 평균<br>
                   • <strong>효율성:</strong> 기댓값 대비 실제 소모 물고기 비율<br>
                   • 1회 시도당 물고기 5개를 소모합니다
                 </div>
               </div>
             </div>
           </div>
         `;
         
         resultDiv.innerHTML = html;
         
         // 결과 표시 후 버튼 섹션을 숨기고 결과 상단에 액션 버튼 추가
         const buttonSection = document.getElementById('directSimulationButtonSection');
         if (buttonSection) {
           buttonSection.style.display = 'none';
         }
         
         // 결과 상단에 액션 버튼 추가 (결과 카드 내부 상단에 배치)
         const actionButtons = document.createElement('div');
         actionButtons.style.cssText = `
           margin-bottom: 20px;
           display: flex;
           gap: 10px;
           justify-content: center;
         `;
         
         const rerunBtn = document.createElement('button');
         rerunBtn.textContent = '🔄 다시 시뮬레이션';
         rerunBtn.style.cssText = `
           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
           color: white;
           border: none;
           padding: 12px 24px;
           border-radius: 20px;
           font-size: 14px;
           font-weight: bold;
           cursor: pointer;
           transition: all 0.3s ease;
           box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
         `;
         rerunBtn.addEventListener('click', () => this.runDirectSimulation());
         
         const settingsBtn = document.createElement('button');
         settingsBtn.textContent = '⚙️ 설정 변경';
         settingsBtn.style.cssText = `
           background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
           color: white;
           border: none;
           padding: 12px 24px;
           border-radius: 20px;
           font-size: 14px;
           font-weight: bold;
           cursor: pointer;
           transition: all 0.3s ease;
           box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
         `;
         settingsBtn.addEventListener('click', () => this.resetDirectSimulation());
         
         actionButtons.appendChild(rerunBtn);
         actionButtons.appendChild(settingsBtn);
         
         // 결과 카드 내부 상단에 버튼들을 추가
         const resultContent = resultDiv.querySelector('div');
         if (resultContent) {
           resultContent.insertBefore(actionButtons, resultContent.firstChild);
         }
       }

           // 다이렉트 시뮬레이션 설정 변경
      resetDirectSimulation() {
        const resultDiv = document.getElementById('directSimulationResult');
        resultDiv.innerHTML = `<span style="color: #999; font-size: 14px;">시뮬레이션 결과가 여기에 표시됩니다</span>`;
        
        // 버튼 섹션을 다시 표시
        const buttonSection = document.getElementById('directSimulationButtonSection');
        if (buttonSection) {
          buttonSection.style.display = 'flex';
        }
      }

   

  // 확률표 탭 콘텐츠
  showTab3Content() {
         const content = document.createElement('div');
     content.style.cssText = `
      margin: 10px 0;
       height: 100%;
     `;
    content.innerHTML = `
      <h4 style="margin: 0 0 5px 0; color: #333;">등급별 레벨업 확률</h4>
      <p style="margin: 0 0 10px 0; color: #666; font-size: 11px;">* 소수점 반올림</p>
    `;
    content.appendChild(FishingUIHelper.createProbabilityTable());
    this.contentArea.appendChild(content);
  }

  // 계산 및 결과 표시 (향후 사용을 위해 보존)
  calculateAndDisplay(currentLevel, targetLevel) {
    // 향후 기능 구현을 위해 보존
  }

  // 결과 표시 (향후 사용을 위해 보존)
  displayResult(result) {
    // 향후 기능 구현을 위해 보존
  }

  // 모달 닫기 시 정리
  close() {
    super.close();
  }
}

export default FishingCalculatorModal; 
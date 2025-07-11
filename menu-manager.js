// 메뉴 관리자
class MenuManager {
  constructor() {
    console.log('MenuManager 생성자 호출됨');
    this.menuConfig = null;
    this.settings = {};
    this.quickButtons = [];
    console.log('MenuManager 생성자 완료');
    // init()은 외부에서 호출하도록 변경
  }

  async init() {
    await this.loadMenuConfig();
    this.loadSettings();
    this.loadQuickButtons();
    this.createMenuUI();
    this.bindEvents();
  }

  async loadMenuConfig() {
    try {
      const response = await fetch(chrome.runtime.getURL('menu-config.json'));
      this.menuConfig = await response.json();
      console.log('메뉴 설정 로드 완료:', this.menuConfig);
    } catch (error) {
      console.error('메뉴 설정 로드 실패:', error);
      // 기본 설정 사용
      this.menuConfig = {
        mainMenu: {
          button: { icon: "⚡", text: "", title: "Lanis Helper 메뉴" },
          items: [
            { id: "exchange", icon: "🏪", text: "거래소", title: "거래소 퀵버튼 메뉴" },
            { id: "settings", icon: "⚙️", text: "설정", title: "설정 메뉴" }
          ]
        },
        quickButtonOptions: {
          move: { text: "▶️", title: "거래소로 이동하여 검색 실행" },
          reset: { text: "⚙️", title: "퀵버튼 설정 변경" }
        }
      };
    }
  }

  loadSettings() {
    try {
      // 구버전 방식으로 chrome.storage.sync 사용
      chrome.storage.sync.get({
        profileLink: true,
        feature2: false,
        feature3: false,
        showItemStats: true  // 구버전 방식으로 변경
      }, (items) => {
        this.settings = items;
        console.log('설정 로드 완료:', this.settings);
      });
    } catch (error) {
      console.error('설정 로드 실패:', error);
      this.settings = { 
        profileLink: true, 
        feature2: false, 
        feature3: false, 
        showItemStats: true 
      };
    }
  }

  loadQuickButtons() {
    try {
      const savedQuickButtons = localStorage.getItem('lanisHelperQuickButtons');
      this.quickButtons = savedQuickButtons ? JSON.parse(savedQuickButtons) : [];
      console.log('퀵버튼 로드 완료:', this.quickButtons);
    } catch (error) {
      console.error('퀵버튼 로드 실패:', error);
      this.quickButtons = [];
    }
  }

  createMenuUI() {
    this.removeExistingMenu();
    // 메인 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'quick-buttons-container';

    // 메인 메뉴 버튼
    const mainButton = document.createElement('button');
    mainButton.className = 'main-menu-button';
    mainButton.innerHTML = this.menuConfig.mainMenu.button.icon;
    mainButton.title = this.menuConfig.mainMenu.button.title;
    mainButton.addEventListener('click', () => this.toggleMainMenuRow());

    // 가로 서브버튼 컨테이너
    const mainMenuRow = document.createElement('div');
    mainMenuRow.className = 'main-menu-row';

    // 거래소/설정 버튼 생성 (메인 버튼과 동일한 디자인)
    this.menuConfig.mainMenu.items.forEach(item => {
      // 설정 버튼은 비활성화
      if (item.id === 'settings') return;
      
      const button = document.createElement('button');
      button.className = 'main-menu-item';
      button.setAttribute('data-menu-id', item.id);
      button.innerHTML = item.icon; // 아이콘만 표시
      button.title = item.title;
      button.addEventListener('click', () => this.handleMainMenuItemClick(item));
      mainMenuRow.appendChild(button);
    });

    container.appendChild(mainButton);
    container.appendChild(mainMenuRow);
    document.body.appendChild(container);

    // 외부 클릭 이벤트 리스너
    document.addEventListener('click', (e) => this.closeAllMenusOnOutsideClick(e));
  }

  removeExistingMenu() {
    const existingContainer = document.querySelector('.quick-buttons-container');
    if (existingContainer) {
      existingContainer.remove();
    }
  }

  bindEvents() {
    // ESC 키로 메뉴 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllMenus();
      }
    });
  }

  toggleMainMenuRow() {
    const mainMenuRow = document.querySelector('.main-menu-row');
    if (!mainMenuRow) return;
    const isOpen = mainMenuRow.classList.contains('show');
    if (isOpen) {
      mainMenuRow.classList.remove('show');
    } else {
      mainMenuRow.classList.add('show');
    }
  }

  handleMainMenuItemClick(item) {
    // 서브메뉴가 이미 열려있으면 닫기
    this.closeAllSubMenus();
    const btn = document.querySelector(`.main-menu-item[data-menu-id="${item.id}"]`);
    if (!btn) return;
    // 서브메뉴 팝업 생성
    const subMenu = document.createElement('div');
    subMenu.className = 'sub-menu-popup';
    // 위치 조정(버튼 위, 스크롤 고려)
    const rect = btn.getBoundingClientRect();
    subMenu.style.position = 'fixed'; // absolute에서 fixed로 변경
    subMenu.style.left = `${rect.left + rect.width/2}px`;
    subMenu.style.top = `${rect.top - 8}px`; // bottom 대신 top 사용
    subMenu.style.transform = 'translateX(-50%) translateY(-100%)'; // 위로 배치
    subMenu.style.zIndex = 10010;
    // 서브메뉴 내용 생성
    if (item.id === 'exchange') {
      this.createQuickButtonsSubMenu(subMenu);
    } else if (item.id === 'settings') {
      this.createSettingsSubMenu(subMenu);
    }
    document.body.appendChild(subMenu);
    setTimeout(() => subMenu.classList.add('show'), 10);
    // 외부 클릭 시 닫기
    setTimeout(() => {
      document.addEventListener('mousedown', this._subMenuOutsideHandler = (e) => {
        if (!subMenu.contains(e.target) && !btn.contains(e.target)) {
          this.closeAllSubMenus();
        }
      });
    }, 50);
  }

  toggleExchangeSubMenu(item) {
    console.log('거래소 서브메뉴 토글');
    const subMenuContainer = document.querySelector('.sub-menu-container');
    if (!subMenuContainer) return;
    
    const isOpen = subMenuContainer.classList.contains('show');
    
    if (isOpen) {
      subMenuContainer.classList.remove('show');
      console.log('거래소 서브메뉴 닫기');
    } else {
      this.closeAllSubMenus();
      this.createQuickButtonsSubMenu(subMenuContainer);
      subMenuContainer.classList.add('show');
      console.log('거래소 서브메뉴 열기');
    }
  }

  toggleSettingsSubMenu(item) {
    console.log('설정 서브메뉴 토글');
    const subMenuContainer = document.querySelector('.sub-menu-container');
    if (!subMenuContainer) return;
    
    const isOpen = subMenuContainer.classList.contains('show');
    
    if (isOpen) {
      subMenuContainer.classList.remove('show');
      console.log('설정 서브메뉴 닫기');
    } else {
      this.closeAllSubMenus();
      this.createSettingsSubMenu(subMenuContainer);
      subMenuContainer.classList.add('show');
      console.log('설정 서브메뉴 열기');
    }
  }

  createQuickButtonsSubMenu(container) {
    container.innerHTML = '';
    
    // 퀵버튼들 생성 (텍스트로 변경)
    for (let i = 0; i < 3; i++) {
      // 퀵버튼과 리셋 버튼을 감싸는 컨테이너
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'quick-button-group';
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '8px';
      buttonContainer.style.alignItems = 'center';
      
      // 퀵버튼
      const quickButton = document.createElement('button');
      quickButton.className = 'main-menu-item sub-menu-item'; // sub-menu-item 클래스 추가
      
      // 설정된 아이템 이름이 있으면 사용, 없으면 기본 텍스트
      const buttonText = this.quickButtons[i]?.keyword || `퀵${i + 1}`;
      quickButton.innerHTML = buttonText;
      quickButton.title = this.quickButtons[i]?.name || `퀵버튼 ${i + 1}`;
      
      quickButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleQuickButtonClick(i);
      });
      
      // 리셋 버튼
      const resetButton = document.createElement('button');
      resetButton.className = 'main-menu-item sub-menu-item reset-btn';
      resetButton.innerHTML = '리셋'; // 휴지통 아이콘 대신 텍스트
      resetButton.title = `퀵${i + 1} 리셋`;
      resetButton.style.width = '40px';
      resetButton.style.height = '32px';
      resetButton.style.fontSize = '0.5rem';
      
      resetButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetQuickButton(i);
      });
      
      buttonContainer.appendChild(quickButton);
      buttonContainer.appendChild(resetButton);
      container.appendChild(buttonContainer);
    }
  }

  createSettingsSubMenu(container) {
    /*
    container.innerHTML = '';
    
    const settingsConfig = this.menuConfig.mainMenu.settings.subMenu.items;
    settingsConfig.forEach(setting => {
      const settingButton = document.createElement('button');
      settingButton.className = 'main-menu-item sub-menu-item'; // sub-menu-item 클래스 추가
      settingButton.innerHTML = setting.text; // 아이콘 대신 텍스트 사용
      settingButton.title = setting.title;
      
      if (this.settings[setting.id]) {
        settingButton.classList.add('active');
      }
      
      settingButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSetting(setting.id);
        if (this.settings[setting.id]) {
          settingButton.classList.add('active');
        } else {
          settingButton.classList.remove('active');
        }
      });
      
      container.appendChild(settingButton);
    });
    */
  }

  closeAllSubMenus() {
    document.querySelectorAll('.sub-menu-popup').forEach(el => el.remove());
    if (this._subMenuOutsideHandler) {
      document.removeEventListener('mousedown', this._subMenuOutsideHandler);
      this._subMenuOutsideHandler = null;
    }
  }

  closeAllMenusOnOutsideClick(event) {
    const container = document.querySelector('.quick-buttons-container');
    if (container && !container.contains(event.target)) {
      this.closeAllSubMenus();
    }
  }

  closeAllMenus() {
    this.closeAllSubMenus();
  }

  toggleSetting(settingId) {
    console.log('설정 토글:', settingId);
    this.settings[settingId] = !this.settings[settingId];
    
    // 구버전 방식으로 chrome.storage.sync에 저장
    try {
      chrome.storage.sync.set(this.settings, () => {
        console.log('설정 저장 완료:', this.settings);
      });
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
    
    // 설정에 따른 기능 실행
    this.executeSettingAction(settingId);
  }

  executeSettingAction(settingId) {
    switch (settingId) {
      case 'profileLink':
        if (this.settings[settingId]) {
          window.userProfileManager.processUserNames();
          // 동적 콘텐츠 처리 시작
          window.userProfileManager.processDynamicContent();
        } else {
          window.userProfileManager.removeUserNames();
        }
        break;
      case 'showItemStats':  // 구버전 방식으로 변경
        if (this.settings[settingId]) {
          window.itemStatsManager.processItemStats();
        } else {
          window.itemStatsManager.removeItemStats();
        }
        break;
      case 'quickButtons':
        if (this.settings[settingId]) {
          this.createMenuUI();
        } else {
          this.removeExistingMenu();
        }
        break;
    }
  }

  handleQuickButtonClick(index) {
    console.log('퀵버튼 클릭:', index);
    
    // 퀵버튼이 설정되지 않았거나 빈 객체인 경우 설정창 열기
    if (!this.quickButtons[index] || Object.keys(this.quickButtons[index]).length === 0) {
      console.log('퀵버튼이 설정되지 않음, 설정창 열기');
      this.openQuickSettingsModal(index);
      return;
    }
    
    // 퀵버튼이 설정된 경우 바로 실행
    console.log('퀵버튼 바로 실행:', this.quickButtons[index]);
    window.lanisHelper.executeQuickSearch(this.quickButtons[index], index);
  }

  showQuickButtonOptions(index) {
    console.log('퀵버튼 옵션 표시 시작', index);
    
    this.removeQuickButtonOptions();
    
    const button = document.querySelector(`.sub-menu-popup .main-menu-item:nth-child(${index + 1})`);
    if (!button) {
      console.log('퀵버튼을 찾을 수 없음');
      return;
    }
    
    const buttonRect = button.getBoundingClientRect();
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'quick-button-options';
    optionsContainer.style.left = `${buttonRect.right + 12}px`;
    optionsContainer.style.top = `${buttonRect.top}px`;
    
    const optionsConfig = this.menuConfig.quickButtonOptions;
    
    // 이동 버튼
    const moveConfig = optionsConfig.move;
    const moveButton = document.createElement('button');
    moveButton.className = 'quick-option-button move';
    moveButton.innerHTML = moveConfig.text;
    moveButton.title = moveConfig.title;
    
    moveButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('이동 버튼 클릭됨', index);
      window.lanisHelper.executeQuickSearch(this.quickButtons[index], index);
      this.removeQuickButtonOptions();
    });
    
    // 재설정 버튼
    const resetConfig = optionsConfig.reset;
    const resetButton = document.createElement('button');
    resetButton.className = 'quick-option-button reset';
    resetButton.innerHTML = resetConfig.text;
    resetButton.title = resetConfig.title;
    
    resetButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('재설정 버튼 클릭됨', index);
      window.lanisHelper.openQuickSettingsModal(index);
      this.removeQuickButtonOptions();
    });
    
    optionsContainer.appendChild(moveButton);
    optionsContainer.appendChild(resetButton);
    
    document.body.appendChild(optionsContainer);
    console.log('옵션 컨테이너 추가 완료', optionsContainer);
    
    optionsContainer.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    setTimeout(() => {
      document.addEventListener('click', (e) => this.closeOptionsOnOutsideClick(e));
    }, 100);
  }

  closeOptionsOnOutsideClick(event) {
    const optionsContainer = document.querySelector('.quick-button-options');
    if (optionsContainer && !optionsContainer.contains(event.target)) {
      console.log('외부 클릭으로 옵션 닫기');
      this.removeQuickButtonOptions();
    }
  }

  removeQuickButtonOptions() {
    const optionsContainer = document.querySelector('.quick-button-options');
    if (optionsContainer) {
      optionsContainer.remove();
    }
  }

  openQuickSettingsModal(index) {
    window.lanisHelper.openQuickSettingsModal(index);
  }

  resetQuickButton(index) {
    console.log(`퀵${index + 1} 리셋`);
    // 퀵버튼 설정 제거
    this.quickButtons[index] = {};
    // 로컬 스토리지 업데이트
    try {
      localStorage.setItem('lanisHelperQuickButtons', JSON.stringify(this.quickButtons));
      console.log('퀵버튼 리셋 완료:', this.quickButtons);
    } catch (error) {
      console.error('퀵버튼 리셋 실패:', error);
    }
    // 서브메뉴 닫기
    this.closeAllSubMenus();
  }

  // 공개 메서드들
  getSettings() {
    return this.settings;
  }

  getQuickButtons() {
    return this.quickButtons;
  }

  updateQuickButtons(quickButtons) {
    this.quickButtons = quickButtons;
    try {
      localStorage.setItem('lanisHelperQuickButtons', JSON.stringify(this.quickButtons));
      console.log('퀵버튼 업데이트 완료:', this.quickButtons);
    } catch (error) {
      console.error('퀵버튼 업데이트 실패:', error);
    }
  }
}

// 전역 인스턴스 생성 (개선된 버전)
console.log('MenuManager 클래스 정의 완료');
console.log('MenuManager 인스턴스 생성 시작');
console.log('현재 window 객체:', Object.keys(window).filter(key => key.includes('Manager') || key.includes('Engine')));

// DOM이 준비된 후에 인스턴스 생성
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료 - MenuManager 인스턴스 생성');
    window.menuManager = new MenuManager();
    console.log('MenuManager 인스턴스 생성 완료:', window.menuManager);
    console.log('생성 후 window 객체:', Object.keys(window).filter(key => key.includes('Manager') || key.includes('Engine')));
  });
} else {
  console.log('DOM 이미 로드됨 - MenuManager 인스턴스 즉시 생성');
  window.menuManager = new MenuManager();
  console.log('MenuManager 인스턴스 생성 완료:', window.menuManager);
  console.log('생성 후 window 객체:', Object.keys(window).filter(key => key.includes('Manager') || key.includes('Engine')));
} 
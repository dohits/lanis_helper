// 메뉴 관리자
class MenuManager {
  constructor() {
    this.menuConfig = null;
    this.settings = {};
    this.quickButtons = [];
    this.equipmentButtons = [];
    // init()은 외부에서 호출하도록 변경
  }

  async init() {
    await this.loadMenuConfig();
    this.loadSettings();
    this.loadQuickButtons();
    this.loadEquipmentButtons();
    this.createMenuUI();
    this.bindEvents();
    
    // 인벤토리 페이지에서 대기 중인 장비 변경 작업 확인
    this.checkPendingEquipmentChange();
    
    // 어빌리티 페이지에서 대기 중인 어빌리티 변경 작업 확인
    this.checkPendingAbilityChange();
    
    // 스킬 관리 페이지에서 대기 중인 스킬 활성화 작업 확인
    this.checkPendingSkillActivation();
  }

  async loadMenuConfig() {
    try {
      const response = await fetch(chrome.runtime.getURL('menu-module/menu-config.json'));
      this.menuConfig = await response.json();
    } catch (error) {
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
      });
    } catch (error) {
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
    } catch (error) {
      this.quickButtons = [];
    }
  }

  checkPendingEquipmentChange() {
    // 인벤토리 페이지에서만 실행
    if (!window.location.href.includes('lanis.me/inventory')) {
      return;
    }

    try {
      const pendingData = sessionStorage.getItem('lanisHelperPendingEquipment');
      if (pendingData) {
        const { equipmentSet, shouldRunAbility, timestamp } = JSON.parse(pendingData);
        
        // 30초 이내의 요청만 처리 (오래된 요청 무시)
        if (Date.now() - timestamp < 30000) {
          // 대기 중인 작업 제거
          sessionStorage.removeItem('lanisHelperPendingEquipment');
          
          // DOM이 완전히 로드될 때까지 대기 후 장비 변경 실행
          this.waitForInventoryDOM(equipmentSet, shouldRunAbility);
        } else {
          // 오래된 요청 제거
          sessionStorage.removeItem('lanisHelperPendingEquipment');
        }
      } else {
        // 대기 중인 장비 변경 작업 없음
      }
    } catch (error) {
      sessionStorage.removeItem('lanisHelperPendingEquipment');
    }
  }

  checkPendingAbilityChange() {
    // 어빌리티 페이지에서만 실행
    if (!window.location.href.includes('lanis.me/abilities')) {
      return;
    }

    try {
      const pendingData = sessionStorage.getItem('lanisHelperPendingAbility');
      if (pendingData) {
        const { equipmentSet, isCombined, timestamp } = JSON.parse(pendingData);
        
        // 30초 이내의 요청만 처리 (오래된 요청 무시)
        if (Date.now() - timestamp < 30000) {
          // 대기 중인 작업 제거
          sessionStorage.removeItem('lanisHelperPendingAbility');
          
          // DOM이 완전히 로드될 때까지 대기 후 어빌리티 변경 실행
          this.waitForAbilityDOM(equipmentSet, isCombined);
        } else {
          // 오래된 요청 제거
          sessionStorage.removeItem('lanisHelperPendingAbility');
        }
      }
    } catch (error) {
      sessionStorage.removeItem('lanisHelperPendingAbility');
    }
  }

  checkPendingSkillActivation() {
    // 스킬 관리 페이지에서만 실행
    if (!window.location.href.includes('lanis.me/skill-management')) {
      return;
    }

    try {
      const pendingData = sessionStorage.getItem('lanisHelperPendingSkill');
      if (pendingData) {
        const { skillNumber, timestamp } = JSON.parse(pendingData);
        
        // 30초 이내의 요청만 처리 (오래된 요청 무시)
        if (Date.now() - timestamp < 30000) {
          // 대기 중인 작업 제거
          sessionStorage.removeItem('lanisHelperPendingSkill');
          
          // DOM이 완전히 로드될 때까지 대기 후 스킬 활성화 실행
          this.waitForSkillManagementDOM(skillNumber);
        } else {
          // 오래된 요청 제거
          sessionStorage.removeItem('lanisHelperPendingSkill');
          
          // 오래된 요청이면 최종 모달 표시
          this.showFinalCompleteModal();
        }
      }
    } catch (error) {
      sessionStorage.removeItem('lanisHelperPendingSkill');
      
      // 오류 발생 시에도 최종 모달 표시
      this.showFinalCompleteModal();
    }
  }

  waitForInventoryDOM(equipmentSet, shouldRunAbility) {
    // DOM이 이미 준비되어 있는지 먼저 확인
    const checkDOMReady = () => {
      const tabs = document.querySelectorAll('.MuiTab-root');
      const table = document.querySelector('.MuiTable-root');
      return tabs.length > 0 && table;
    };
    
    // 이미 준비되어 있으면 즉시 실행
    if (checkDOMReady()) {
      this.performEquipmentChange(equipmentSet, shouldRunAbility);
      return;
    }
    
    // DOM이 준비될 때까지 짧은 간격으로 확인 (100ms)
    let attempts = 0;
    const maxAttempts = 50; // 최대 5초
    
    const checkAndExecute = () => {
      attempts++;
      
      if (checkDOMReady()) {
        this.performEquipmentChange(equipmentSet, shouldRunAbility);
        return;
      }
      
      if (attempts >= maxAttempts) {
        return;
      }
      
      // 다음 프레임에서 다시 확인
      requestAnimationFrame(checkAndExecute);
    };
    
    // 즉시 첫 번째 확인 시작
    requestAnimationFrame(checkAndExecute);
  }

  waitForAbilityDOM(equipmentSet, isCombined) {
    // DOM이 이미 준비되어 있는지 먼저 확인
    const checkDOMReady = () => {
      const tabs = document.querySelectorAll('.MuiTab-root');
      const cards = document.querySelectorAll('.MuiCard-root');
      return tabs.length > 0 && cards.length > 0;
    };
    
    // 이미 준비되어 있으면 즉시 실행
    if (checkDOMReady()) {
      this.performAbilityChange(equipmentSet, isCombined);
      return;
    }
    
    // DOM이 준비될 때까지 짧은 간격으로 확인
    let attempts = 0;
    const maxAttempts = 50; // 최대 5초
    
    const checkAndExecute = () => {
      attempts++;
      
      if (checkDOMReady()) {
        this.performAbilityChange(equipmentSet, isCombined);
        return;
      }
      
      if (attempts >= maxAttempts) {
        return;
      }
      
      // 다음 프레임에서 다시 확인
      requestAnimationFrame(checkAndExecute);
    };
    
    // 즉시 첫 번째 확인 시작
    requestAnimationFrame(checkAndExecute);
  }

  loadEquipmentButtons() {
    try {
      const savedEquipmentButtons = localStorage.getItem('lanisHelperEquipmentButtons');
      this.equipmentButtons = savedEquipmentButtons ? JSON.parse(savedEquipmentButtons) : [];
    } catch (error) {
      this.equipmentButtons = [];
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
    // 이벤트 전파 방지
    event.stopPropagation();
  }

  handleMainMenuItemClick(item) {
    // 서브메뉴가 이미 열려있으면 닫기
    this.closeAllSubMenus();
    const btn = document.querySelector(`.main-menu-item[data-menu-id="${item.id}"]`);
    if (!btn) return;
    // 서브메뉴 팝업 생성
    const subMenu = document.createElement('div');
    subMenu.className = 'sub-menu-popup';
    // 위치 조정(버튼 오른쪽, 스크롤 고려)
    const rect = btn.getBoundingClientRect();
    subMenu.style.position = 'fixed'; // absolute에서 fixed로 변경
    subMenu.style.left = `${rect.right + 16}px`; // 오른쪽으로 배치
    subMenu.style.top = `${rect.top + rect.height/2}px`; // 버튼 중앙 높이
    subMenu.style.transform = 'translateY(-50%)'; // 세로 중앙 정렬
    subMenu.style.zIndex = 10010;
    // 서브메뉴 내용 생성
    if (item.id === 'equipment') {
      this.createEquipmentButtonsSubMenu(subMenu);
    } else if (item.id === 'exchange') {
      this.createQuickButtonsSubMenu(subMenu);
    } else if (item.id === 'itemGuide') {
      this.createItemGuideSubMenu(subMenu);
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
    const subMenuContainer = document.querySelector('.sub-menu-container');
    if (!subMenuContainer) return;
    
    const isOpen = subMenuContainer.classList.contains('show');
    
    if (isOpen) {
      subMenuContainer.classList.remove('show');
    } else {
      this.closeAllSubMenus();
      this.createQuickButtonsSubMenu(subMenuContainer);
      subMenuContainer.classList.add('show');
    }
  }

  toggleSettingsSubMenu(item) {
    const subMenuContainer = document.querySelector('.sub-menu-container');
    if (!subMenuContainer) return;
    
    const isOpen = subMenuContainer.classList.contains('show');
    
    if (isOpen) {
      subMenuContainer.classList.remove('show');
    } else {
      this.closeAllSubMenus();
      this.createSettingsSubMenu(subMenuContainer);
      subMenuContainer.classList.add('show');
    }
  }

  createEquipmentButtonsSubMenu(container) {
    container.innerHTML = '';
    
    // 기존 장비 버튼들 표시
    this.equipmentButtons.forEach((button, index) => {
      if (button && Object.keys(button).length > 0) {
        // 메인 버튼과 수정/삭제 버튼을 같은 행에 배치
        const buttonRow = document.createElement('div');
        buttonRow.style.display = 'flex';
        buttonRow.style.gap = '2px';
        buttonRow.style.margin = '0 auto 4px auto';
        buttonRow.style.marginBottom = '4px';
        buttonRow.style.width = '180px';
        buttonRow.style.maxWidth = '180px';
        buttonRow.style.alignItems = 'center';
        buttonRow.style.minWidth = '0';
        buttonRow.style.overflow = 'hidden';
        
        // 메인 장비 버튼 (좌측)
        const equipmentButton = document.createElement('button');
        equipmentButton.className = 'main-menu-item sub-menu-item';
        equipmentButton.style.flex = '1';
        equipmentButton.style.height = '32px';
        equipmentButton.style.backgroundColor = 'white';
        equipmentButton.style.color = '#333';
        equipmentButton.style.border = '1px solid #ddd';
        equipmentButton.style.borderRadius = '6px';
        equipmentButton.style.fontSize = '12px';
        equipmentButton.style.fontWeight = 'bold';
        equipmentButton.style.whiteSpace = 'nowrap';
        equipmentButton.style.overflow = 'hidden';
        equipmentButton.style.textOverflow = 'ellipsis';
        equipmentButton.style.boxSizing = 'border-box';
        equipmentButton.style.minWidth = '0';
        equipmentButton.style.maxWidth = 'calc(100% - 84px)';
        equipmentButton.style.padding = '0 8px';
        
        const buttonText = button.name || `장비${index + 1}`;
        equipmentButton.innerHTML = buttonText;
        equipmentButton.title = button.name || `장비 세트 ${index + 1}`;
        
        // 장비 버튼 클릭 이벤트
        equipmentButton.setAttribute('data-index', index);
        equipmentButton.addEventListener('click', (e) => {
          const buttonIndex = parseInt(e.target.getAttribute('data-index'));
          this.handleEquipmentButtonClick(buttonIndex);
        });
        
        // 수정 버튼 (우측)
        const editButton = document.createElement('button');
        editButton.className = 'main-menu-item sub-menu-item edit-btn';
        editButton.innerHTML = '수정';
        editButton.title = `장비${index + 1} 수정`;
        editButton.style.width = '35px';
        editButton.style.height = '32px';
        editButton.style.backgroundColor = '#10b981';
        editButton.style.color = 'white';
        editButton.style.border = 'none';
        editButton.style.borderRadius = '6px';
        editButton.style.fontSize = '10px';
        editButton.style.fontWeight = 'bold';
        editButton.style.boxSizing = 'border-box';
        editButton.style.flexShrink = '0';
        editButton.style.minWidth = '40px';
        editButton.style.padding = '0';
        
        editButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openEquipmentSettingsModal(index);
        });
        
        // 삭제 버튼 (우측)
        const deleteButton = document.createElement('button');
        deleteButton.className = 'main-menu-item sub-menu-item delete-btn';
        deleteButton.innerHTML = '삭제';
        deleteButton.title = `장비${index + 1} 삭제`;
        deleteButton.style.width = '35px';
        deleteButton.style.height = '32px';
        deleteButton.style.backgroundColor = '#ef4444';
        deleteButton.style.color = 'white';
        deleteButton.style.border = 'none';
        deleteButton.style.borderRadius = '6px';
        deleteButton.style.fontSize = '10px';
        deleteButton.style.fontWeight = 'bold';
        deleteButton.style.boxSizing = 'border-box';
        deleteButton.style.flexShrink = '0';
        deleteButton.style.minWidth = '40px';
        deleteButton.style.padding = '0';
        
        deleteButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteEquipmentButton(index);
        });
        
        buttonRow.appendChild(equipmentButton);
        buttonRow.appendChild(editButton);
        buttonRow.appendChild(deleteButton);
        container.appendChild(buttonRow);
      }
    });
    
    // 추가 버튼 (항상 마지막에 표시)
    const addButton = document.createElement('button');
    addButton.className = 'main-menu-item sub-menu-item add-btn';
    addButton.innerHTML = '+ 추가';
    addButton.title = '새 장비 세트 추가';
    addButton.style.width = '100%';
    addButton.style.height = '40px';
    addButton.style.marginTop = '8px';
    addButton.style.backgroundColor = '#10b981';
    addButton.style.color = 'white';
    addButton.style.border = 'none';
    addButton.style.borderRadius = '6px';
    addButton.style.fontSize = '14px';
    addButton.style.fontWeight = 'bold';
    addButton.style.boxSizing = 'border-box';
    addButton.style.display = 'block';
    
    addButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.addNewEquipmentButton();
    });
    
    container.appendChild(addButton);
  }

  createQuickButtonsSubMenu(container) {
    container.innerHTML = '';
    
    // 기존 퀵버튼들 표시
    this.quickButtons.forEach((button, index) => {
      if (button && Object.keys(button).length > 0) {
        // 메인 버튼과 수정/삭제 버튼을 같은 행에 배치
        const buttonRow = document.createElement('div');
        buttonRow.style.display = 'flex';
        buttonRow.style.gap = '2px';
        buttonRow.style.margin = '0 auto 4px auto';
        buttonRow.style.marginBottom = '4px';
        buttonRow.style.width = '180px';
        buttonRow.style.maxWidth = '180px';
        buttonRow.style.alignItems = 'center';
        buttonRow.style.minWidth = '0';
        buttonRow.style.overflow = 'hidden';
        
        // 메인 퀵버튼 (좌측)
        const quickButton = document.createElement('button');
        quickButton.className = 'main-menu-item sub-menu-item';
        quickButton.style.flex = '1';
        quickButton.style.height = '32px';
        quickButton.style.backgroundColor = 'white';
        quickButton.style.color = '#333';
        quickButton.style.border = '1px solid #ddd';
        quickButton.style.borderRadius = '6px';
        quickButton.style.fontSize = '12px';
        quickButton.style.fontWeight = 'bold';
        quickButton.style.whiteSpace = 'nowrap';
        quickButton.style.overflow = 'hidden';
        quickButton.style.textOverflow = 'ellipsis';
        quickButton.style.boxSizing = 'border-box';
        quickButton.style.minWidth = '0';
        quickButton.style.maxWidth = 'calc(100% - 84px)';
        quickButton.style.padding = '0 8px';
        
        const buttonText = button.keyword || `퀵${index + 1}`;
        quickButton.innerHTML = buttonText;
        quickButton.title = button.name || `퀵버튼 ${index + 1}`;
        
        quickButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleQuickButtonClick(index);
        });
        
        // 수정 버튼 (우측)
        const editButton = document.createElement('button');
        editButton.className = 'main-menu-item sub-menu-item edit-btn';
        editButton.innerHTML = '수정';
        editButton.title = `퀵${index + 1} 수정`;
        editButton.style.width = '35px';
        editButton.style.height = '32px';
        editButton.style.backgroundColor = '#10b981';
        editButton.style.color = 'white';
        editButton.style.border = 'none';
        editButton.style.borderRadius = '6px';
        editButton.style.fontSize = '10px';
        editButton.style.fontWeight = 'bold';
        editButton.style.boxSizing = 'border-box';
        editButton.style.flexShrink = '0';
        editButton.style.minWidth = '40px';
        editButton.style.padding = '0';
        
        editButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openQuickSettingsModal(index);
        });
        
        // 삭제 버튼 (우측)
        const deleteButton = document.createElement('button');
        deleteButton.className = 'main-menu-item sub-menu-item delete-btn';
        deleteButton.innerHTML = '삭제';
        deleteButton.title = `퀵${index + 1} 삭제`;
        deleteButton.style.width = '35px';
        deleteButton.style.height = '32px';
        deleteButton.style.backgroundColor = '#ef4444';
        deleteButton.style.color = 'white';
        deleteButton.style.border = 'none';
        deleteButton.style.borderRadius = '6px';
        deleteButton.style.fontSize = '10px';
        deleteButton.style.fontWeight = 'bold';
        deleteButton.style.boxSizing = 'border-box';
        deleteButton.style.flexShrink = '0';
        deleteButton.style.minWidth = '40px';
        deleteButton.style.padding = '0';
        
        deleteButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteQuickButton(index);
        });
        
        buttonRow.appendChild(quickButton);
        buttonRow.appendChild(editButton);
        buttonRow.appendChild(deleteButton);
        container.appendChild(buttonRow);
      }
    });
    
    // 추가 버튼 (항상 마지막에 표시)
    const addButton = document.createElement('button');
    addButton.className = 'main-menu-item sub-menu-item add-btn';
    addButton.innerHTML = '+ 추가';
    addButton.title = '새 퀵버튼 추가';
    addButton.style.width = '100%';
    addButton.style.height = '40px';
    addButton.style.marginTop = '8px';
    addButton.style.backgroundColor = '#10b981';
    addButton.style.color = 'white';
    addButton.style.border = 'none';
    addButton.style.borderRadius = '6px';
    addButton.style.fontSize = '14px';
    addButton.style.fontWeight = 'bold';
    addButton.style.boxSizing = 'border-box';
    addButton.style.display = 'block';
    
    addButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.addNewQuickButton();
    });
    
    container.appendChild(addButton);
  }

  createItemGuideSubMenu(container) {
    container.innerHTML = '';
    
    // 아이템 도감 열기 버튼 생성
    const guideButton = document.createElement('button');
    guideButton.className = 'main-menu-item sub-menu-item';
    guideButton.innerHTML = '도감 열기';
    guideButton.title = '아이템 도감 열기';
    guideButton.style.fontWeight = 'bold';
    
    guideButton.addEventListener('click', (e) => {
      e.stopPropagation();
      // 아이템 도감 모달 열기
      this.openItemGuideModal();
      this.closeAllSubMenus();
    });
    
    container.appendChild(guideButton);
  }

  createSettingsSubMenu(container) {
    container.innerHTML = '';
    
    // 위키 이동 버튼 생성
    const wikiButton = document.createElement('button');
    wikiButton.className = 'main-menu-item sub-menu-item';
    wikiButton.innerHTML = '위키 이동';
    wikiButton.title = 'Lanis 위키로 이동';
    wikiButton.style.fontWeight = 'bold';
    
    wikiButton.addEventListener('click', (e) => {
      e.stopPropagation();
      // 위키 페이지 열기
      window.open('https://laniswiki.lovestoblog.com/', '_blank');
      this.closeAllSubMenus();
    });
    
    // 라니스 이동 버튼 생성
    const lanisButton = document.createElement('button');
    lanisButton.className = 'main-menu-item sub-menu-item';
    lanisButton.innerHTML = '라니스 이동';
    lanisButton.title = 'Lanis 게임으로 이동';
    lanisButton.style.fontWeight = 'bold';
    
    lanisButton.addEventListener('click', (e) => {
      e.stopPropagation();
      // 라니스 게임 페이지 열기
      window.open('https://lanis.me/', '_blank');
      this.closeAllSubMenus();
    });
    
    container.appendChild(wikiButton);
    container.appendChild(lanisButton);
  }

  closeAllSubMenus() {
    const subMenus = document.querySelectorAll('.sub-menu-popup');
    subMenus.forEach(menu => {
      menu.remove();
    });
    
    // 외부 클릭 핸들러 제거
    if (this._subMenuOutsideHandler) {
      document.removeEventListener('mousedown', this._subMenuOutsideHandler);
      this._subMenuOutsideHandler = null;
    }
  }

  // 아이템 도감 모달 열기
  openItemGuideModal() {
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('itemGuideModal');
    if (existingModal) {
      existingModal.remove();
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.id = 'itemGuideModal';
    modal.className = 'item-guide-modal';
    modal.innerHTML = `
      <div class="item-guide-content">
        <div class="item-guide-header">
          <h3>아이템 도감</h3>
          <button class="close-button" onclick="this.closest('.item-guide-modal').remove()">×</button>
        </div>
        <div class="item-guide-search">
          <input type="text" id="itemSearchInput" placeholder="아이템명 검색..." class="search-input">
          <input type="text" id="abilitySearchInput" placeholder="어빌리티 검색..." class="search-input">
        </div>
        <div class="item-guide-attributes">
          <div class="attribute-title">속성 필터</div>
          <div class="attribute-buttons">
            <button class="attribute-btn" data-attribute="물">물</button>
            <button class="attribute-btn" data-attribute="불">불</button>
            <button class="attribute-btn" data-attribute="번개">번개</button>
            <button class="attribute-btn" data-attribute="바람">바람</button>
            <button class="attribute-btn" data-attribute="별">별</button>
            <button class="attribute-btn" data-attribute="빛">빛</button>
            <button class="attribute-btn" data-attribute="어둠">어둠</button>
            <button class="attribute-btn" data-attribute="무">무</button>
          </div>
        </div>
        <div class="item-guide-categories">
          <div class="main-categories">
            <button class="category-btn main-category active" data-category="">전체</button>
            <button class="category-btn main-category" data-category="무기">무기</button>
            <button class="category-btn main-category" data-category="방어구">방어구</button>
            <button class="category-btn main-category" data-category="장신구">장신구</button>
          </div>
          <div class="sub-categories" id="subCategories" style="display: none;">
            <button class="category-btn sub-category active" data-category="">전체</button>
            <button class="category-btn sub-category" data-category="검">검</button>
            <button class="category-btn sub-category" data-category="도끼">도끼</button>
            <button class="category-btn sub-category" data-category="창">창</button>
            <button class="category-btn sub-category" data-category="활">활</button>
            <button class="category-btn sub-category" data-category="너클">너클</button>
            <button class="category-btn sub-category" data-category="지팡이">지팡이</button>
            <button class="category-btn sub-category" data-category="나이프">나이프</button>
            <button class="category-btn sub-category" data-category="미확인">미확인</button>
          </div>
        </div>
        <div class="item-guide-list" id="itemGuideList">
          <div style="text-align: center; color: #666; padding: 20px;">아이템을 로드하는 중...</div>
        </div>
        <div class="item-guide-footer">
          총 <span id="itemGuideCount">0</span>개 아이템
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // 모달 외부 클릭 시 닫기 이벤트 추가
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // 아이템 데이터 로드 및 표시
    this.loadAndDisplayItems();
    
    // 검색 및 필터 이벤트 리스너 추가
    setTimeout(() => {
      const searchInput = document.getElementById('itemSearchInput');
      const abilitySearchInput = document.getElementById('abilitySearchInput');
      
      if (searchInput) {
        searchInput.addEventListener('input', () => this.filterItems());
      }
      
      if (abilitySearchInput) {
        abilitySearchInput.addEventListener('input', () => this.filterItems());
      }
      
      // 속성 버튼 이벤트
      const attributeButtons = document.querySelectorAll('.attribute-btn');
      attributeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          btn.classList.toggle('active');
          this.filterItems();
        });
      });
      
      // 메인 카테고리 버튼 이벤트
      const mainCategories = document.querySelectorAll('.main-category');
      mainCategories.forEach(btn => {
        btn.addEventListener('click', (e) => {
          // 활성 상태 변경
          mainCategories.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          const category = btn.getAttribute('data-category');
          this.handleMainCategoryChange(category);
        });
      });
      
      // 서브 카테고리 버튼 이벤트
      const subCategories = document.querySelectorAll('.sub-category');
      subCategories.forEach(btn => {
        btn.addEventListener('click', (e) => {
          // 활성 상태 변경
          subCategories.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          this.filterItems();
        });
      });
    }, 100);
  }

  // 아이템 데이터 로드 및 표시
  async loadAndDisplayItems() {
    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['rareItems'], resolve);
      });

      if (result.rareItems && result.rareItems.length > 0) {
        this.displayItems(result.rareItems);
      } else {
        document.getElementById('itemGuideList').innerHTML = 
          '<div style="text-align: center; color: #666; padding: 20px;">스캔된 아이템이 없습니다.<br>먼저 아이템 데이터를 수집해주세요.</div>';
        document.getElementById('itemGuideCount').textContent = '0';
      }
    } catch (error) {
      document.getElementById('itemGuideList').innerHTML = 
        '<div style="text-align: center; color: #666; padding: 20px;">데이터 로드 중 오류가 발생했습니다.</div>';
    }
  }

  // 아이템 목록 표시
  displayItems(items) {
    const listContainer = document.getElementById('itemGuideList');
    const countElement = document.getElementById('itemGuideCount');
    
    if (!listContainer || !countElement) return;

    // 아이템을 가나다순으로 정렬
    items.sort((a, b) => {
      const nameA = (a.name || '').trim();
      const nameB = (b.name || '').trim();
      return nameA.localeCompare(nameB, 'ko');
    });

    let itemsHtml = '';
    items.forEach((item) => {
      const itemName = item.name || '알 수 없는 아이템';
      const powerRange = item.power_min && item.power_max ? `${item.power_min}-${item.power_max}` : 'N/A';
      const weightRange = item.weight_min && item.weight_max ? `${item.weight_min}-${item.weight_max}` : 'N/A';
      const weaponType = item.weapon_type || 'N/A';
      const abilities = item.abilities && item.abilities.length > 0 ? item.abilities.join(', ') : 'N/A';
      const attributes = item.attributes && item.attributes.length > 0 ? item.attributes.join(', ') : 'N/A';
      
      // 타입이 N/A가 아닐 때만 괄호로 표시
      const typeDisplay = weaponType !== 'N/A' ? ` (${weaponType})` : '';
      
      // 카테고리 분류
      let mainCategory = '';
      let subCategory = '';
      
      if (weaponType !== 'N/A') {
        const categories = weaponType.split('/');
        if (categories.length >= 2) {
          mainCategory = categories[0]; // 첫 번째는 메인 카테고리
          subCategory = categories[1]; // 두 번째는 서브 카테고리
        } else {
          mainCategory = categories[0];
          // 메인 카테고리가 무기인데 서브카테고리가 없는 경우 "미확인"으로 분류
          if (mainCategory === '무기') {
            subCategory = '미확인';
          }
        }
      }
      
      // 카테고리별 아이콘 설정
      let categoryIcon = '⚔️'; // 기본 아이콘
      
      if (mainCategory === '무기') {
        switch(subCategory) {
          case '검': categoryIcon = '🗡️'; break;
          case '도끼': categoryIcon = '🪓'; break;
          case '창': categoryIcon = '🔱'; break;
          case '활': categoryIcon = '🏹'; break;
          case '너클': categoryIcon = '🥊'; break;
          case '지팡이': categoryIcon = '🪄'; break;
          case '나이프': categoryIcon = '🔪'; break;
          case '미확인': categoryIcon = '❓'; break;
          default: categoryIcon = '⚔️';
        }
      } else if (mainCategory === '방어구') {
        categoryIcon = '🛡️';
      } else if (mainCategory === '장신구') {
        categoryIcon = '💎';
      }
      
      itemsHtml += `
        <div class="item-guide-item" data-name="${itemName.toLowerCase()}" data-main-category="${mainCategory.toLowerCase()}" data-sub-category="${subCategory.toLowerCase()}" data-abilities="${abilities.toLowerCase()}" data-attributes="${attributes.toLowerCase()}">
          <div class="item-name">
            <span class="item-icon">${categoryIcon}</span>
            ${itemName}${typeDisplay}
          </div>
          <div class="item-stats">위력: ${powerRange} | 무게: ${weightRange}</div>
          <div class="item-attributes">속성: ${attributes}</div>
          <div class="item-abilities">어빌리티: ${abilities}</div>
        </div>
      `;
    });

    listContainer.innerHTML = itemsHtml;
    countElement.textContent = items.length;
  }

  // 메인 카테고리 변경 처리
  handleMainCategoryChange(category) {
    const subCategories = document.getElementById('subCategories');
    
    if (category === '무기') {
      // 무기 카테고리일 때만 서브카테고리 표시
      subCategories.style.display = 'block';
      // 서브카테고리 전체 버튼 활성화
      document.querySelectorAll('.sub-category').forEach(btn => btn.classList.remove('active'));
      document.querySelector('.sub-category[data-category=""]').classList.add('active');
    } else {
      // 다른 카테고리일 때 서브카테고리 숨김
      subCategories.style.display = 'none';
    }
    
    this.filterItems();
  }

  // 검색/필터
  filterItems() {
    const searchInput = document.getElementById('itemSearchInput');
    const abilitySearchInput = document.getElementById('abilitySearchInput');
    const items = document.querySelectorAll('.item-guide-item');
    
    if (!searchInput || !abilitySearchInput) return;

    const searchTerm = searchInput.value.toLowerCase();
    const abilitySearchTerm = abilitySearchInput.value.toLowerCase();
    const selectedMainCategory = document.querySelector('.main-category.active').getAttribute('data-category');
    const selectedSubCategory = document.querySelector('.sub-category.active')?.getAttribute('data-category') || '';
    
    // 활성화된 속성 버튼들 가져오기
    const activeAttributes = Array.from(document.querySelectorAll('.attribute-btn.active')).map(btn => 
      btn.getAttribute('data-attribute').toLowerCase()
    );
    
    let visibleCount = 0;

    items.forEach(item => {
      const itemName = item.getAttribute('data-name');
      const itemMainCategory = item.getAttribute('data-main-category');
      const itemSubCategory = item.getAttribute('data-sub-category');
      const itemAbilities = item.getAttribute('data-abilities');
      const itemAttributes = item.getAttribute('data-attributes');
      
      const matchesSearch = itemName.includes(searchTerm);
      const matchesAbility = itemAbilities.includes(abilitySearchTerm);
      const matchesMainCategory = !selectedMainCategory || itemMainCategory === selectedMainCategory;
      const matchesSubCategory = !selectedSubCategory || itemSubCategory === selectedSubCategory;
      
      // 속성 매칭 (활성화된 속성이 없으면 모든 아이템 표시, 있으면 해당 속성만)
      const matchesAttribute = activeAttributes.length === 0 || 
        activeAttributes.some(attr => itemAttributes.includes(attr));
      
      if (matchesSearch && matchesAbility && matchesAttribute && matchesMainCategory && matchesSubCategory) {
        item.style.display = 'block';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    // 표시된 아이템 수 업데이트
    const countElement = document.getElementById('itemGuideCount');
    if (countElement) {
      countElement.textContent = visibleCount;
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
    this.settings[settingId] = !this.settings[settingId];
    
    // 구버전 방식으로 chrome.storage.sync에 저장
    try {
      chrome.storage.sync.set(this.settings, () => {
      });
    } catch (error) {
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

  handleEquipmentButtonClick(index) {
    // 장비 버튼이 설정되지 않았거나 빈 객체인 경우 설정창 열기
    if (!this.equipmentButtons[index] || Object.keys(this.equipmentButtons[index]).length === 0) {
      this.openEquipmentSettingsModal(index);
    return;
    }
    
    const equipmentSet = this.equipmentButtons[index];
    
    // 빈 값 필터링 (공백 제거 후 빈 문자열인 경우 제외)
    const hasEquipment = (equipmentSet.weapon && equipmentSet.weapon.trim()) || 
                        (equipmentSet.armor && equipmentSet.armor.trim()) || 
                        (equipmentSet.accessory && equipmentSet.accessory.trim());
    const hasAbility = (equipmentSet.jobAbility && equipmentSet.jobAbility.trim()) || 
                      (equipmentSet.mainAbility && equipmentSet.mainAbility.trim());
    
    if (hasEquipment && hasAbility) {
      this.executeEquipmentChange(equipmentSet, index, true); // 어빌리티도 실행
    } else if (hasEquipment) {
      this.executeEquipmentChange(equipmentSet, index, false);
    } else if (hasAbility) {
      this.executeAbilityChange(equipmentSet, index, false);
    } else {
      this.openEquipmentSettingsModal(index);
    }
  }

  executeEquipmentChange(equipmentSet, index, shouldRunAbility) {
    // 중복 실행 방지: 기존 대기 작업 덮어쓰기
    const pendingData = {
      equipmentSet,
      shouldRunAbility,
      timestamp: Date.now()
    };
    sessionStorage.setItem('lanisHelperPendingEquipment', JSON.stringify(pendingData));
    
    if (window.location.href.includes('lanis.me/inventory')) {
      this.performEquipmentChange(equipmentSet, shouldRunAbility);
    } else {
      window.location.href = 'https://lanis.me/inventory';
    }
  }

  executeAbilityChange(equipmentSet, index, isCombined) {
    // 중복 실행 방지: 기존 대기 작업 덮어쓰기
    sessionStorage.setItem('lanisHelperPendingAbility', JSON.stringify({
      equipmentSet,
      isCombined,
      timestamp: Date.now()
    }));
    if (window.location.href.includes('lanis.me/abilities')) {
      // abilities 페이지에 이미 있어도 강제로 새로고침
      window.location.reload();
    } else {
      window.location.href = 'https://lanis.me/abilities';
    }
  }

  async performEquipmentChange(equipmentSet, shouldRunAbility) {
    try {
      if (!window.location.href.includes('lanis.me/inventory')) return;
      const tabs = document.querySelectorAll('.MuiTab-root');
      const table = document.querySelector('.MuiTable-root');
      if (tabs.length === 0 || !table) {
        setTimeout(() => this.performEquipmentChange(equipmentSet, shouldRunAbility), 1000);
        return;
      }
      const { weapon, armor, accessory, skillNumber } = equipmentSet;
      let equippedCount = 0;
      const totalItems = [weapon, armor, accessory].filter(item => item && item.trim()).length;
      if (weapon && weapon.trim()) if (await this.equipItem(weapon, '무기')) equippedCount++;
      if (armor && armor.trim()) if (await this.equipItem(armor, '방어구')) equippedCount++;
      if (accessory && accessory.trim()) if (await this.equipItem(accessory, '장신구')) equippedCount++;
      
      if (shouldRunAbility) {
        this.saveResultToSession({equipmentCount: equippedCount, equipmentTotal: totalItems, abilityCount: 0, abilityTotal: 0, skillNumber});
        this.executeAbilityChange(equipmentSet, null, true);
      } else {
        this.saveResultToSession({equipmentCount: equippedCount, equipmentTotal: totalItems, abilityCount: 0, abilityTotal: 0, skillNumber});
        if (skillNumber) {
          this.activateSkill(skillNumber);
        } else {
          this.showFinalCompleteModal();
        }
      }
    } catch (error) {
      this.showEquipmentErrorModal();
    }
  }

  async performAbilityChange(equipmentSet, isCombined) {
    try {
      if (!window.location.href.includes('lanis.me/abilities')) return;
      const tabs = document.querySelectorAll('.MuiTab-root');
      const cards = document.querySelectorAll('.MuiCard-root');
      if (tabs.length === 0 || cards.length === 0) {
        setTimeout(() => this.performAbilityChange(equipmentSet, isCombined), 1000);
        return;
      }
      const { jobAbility, jobAbilityTab, mainAbility, mainAbilityTab, skillNumber } = equipmentSet;
      let equippedCount = 0;
      const totalItems = [jobAbility, mainAbility].filter(item => item && item.trim()).length;
      if (jobAbility && jobAbility.trim()) if (await this.equipAbility(jobAbility, 'job', jobAbilityTab)) equippedCount++;
      if (mainAbility && mainAbility.trim()) if (await this.equipAbility(mainAbility, 'main', mainAbilityTab)) equippedCount++;
      
      if (isCombined) {
        // 통합 변경: 장비 결과를 세션에서 읽어와서 합산
        const equipmentResult = sessionStorage.getItem('lanisHelperEquipmentResult');
        let equipmentCount = 0, equipmentTotal = 0;
        if (equipmentResult) {
          try {
            const parsed = JSON.parse(equipmentResult);
            equipmentCount = Number(parsed.equipmentCount) || 0;
            equipmentTotal = Number(parsed.equipmentTotal) || 0;
          } catch {}
        }
        this.saveResultToSession({equipmentCount, equipmentTotal, abilityCount: equippedCount, abilityTotal: totalItems, skillNumber});
        if (skillNumber) {
          this.activateSkill(skillNumber);
        } else {
          this.showFinalCompleteModal();
        }
      } else {
        // 어빌리티만 변경
        this.saveResultToSession({equipmentCount: 0, equipmentTotal: 0, abilityCount: equippedCount, abilityTotal: totalItems, skillNumber});
        if (skillNumber) {
          this.activateSkill(skillNumber);
        } else {
          this.showFinalCompleteModal();
        }
      }
    } catch (error) {
      this.showAbilityErrorModal();
    }
  }

  async equipItem(itemName, category) {
    try {
      // 이미 착용 중인지 확인 (장착 중인 장비 테이블에서 확인)
      const equippedTable = document.querySelector('.MuiTableBody-root');
      if (equippedTable) {
        const equippedItems = equippedTable.querySelectorAll('.MuiTypography-body1');
        for (const item of equippedItems) {
          if (item.textContent.includes(itemName)) {
            return false;
          }
        }
      }

      // 해당 카테고리 탭 클릭
      const tabs = document.querySelectorAll('.MuiTab-root');
      let tabClicked = false;
      
      for (const tab of tabs) {
        if (tab.textContent.includes(category)) {
          tab.click();
          tabClicked = true;
          
          // 탭 전환 후 아이템 테이블이 로드될 때까지 감지
          await this.waitForTabContent(category);
          break;
        }
      }

      if (!tabClicked) {
        return false;
      }

      // 아이템 테이블이 로드될 때까지 대기
      await this.waitForItemTable();

      // 아이템 찾기 및 장착
      const itemRows = document.querySelectorAll('.MuiTableBody-root .MuiTableRow-root');
      for (const row of itemRows) {
        const itemElement = row.querySelector('.MuiTypography-body1');
        if (itemElement) {
          const itemText = itemElement.textContent.trim();
          
          if (itemText.includes(itemName)) {
            const equipButton = row.querySelector('button');
            if (equipButton && equipButton.textContent.includes('장착')) {
              equipButton.click();
              
              // 장착 완료를 감지하여 즉시 진행
              await this.waitForEquipComplete(equipButton, itemName);
              return true;
            }
          }
        }
      }

      return false;

    } catch (error) {
      return false;
    }
  }

  async equipAbility(abilityName, type, abilityTab) {
    try {
      // 탭 전환이 필요한 경우 먼저 탭 전환
      if (abilityTab && abilityTab.trim()) {
        const tabs = document.querySelectorAll('.MuiTab-root');
        let tabClicked = false;
        
        for (const tab of tabs) {
          if (tab.textContent.trim() === abilityTab.trim()) {
            tab.click();
            tabClicked = true;
            
            // 탭 전환 후 어빌리티 카드가 로드될 때까지 감지
            await this.waitForAbilityTabContent(abilityTab);
            break;
          }
        }

        if (!tabClicked) {
          return false;
        }
      }

      // 이미 장착 중인지 확인 (장착된 어빌리티 섹션에서 확인)
      const equippedAbilities = document.querySelectorAll('.css-3caazb .MuiTypography-subtitle1');
      for (const ability of equippedAbilities) {
        if (ability.textContent.trim() === abilityName.trim()) {
          return false;
        }
      }

      // 어빌리티 카드들을 찾아서 해당 어빌리티 검색
      const abilityCards = document.querySelectorAll('.MuiCard-root');
      for (const card of abilityCards) {
        const abilityTitle = card.querySelector('.MuiTypography-subtitle1');
        if (abilityTitle) {
          const titleText = abilityTitle.textContent.trim();
          
          if (titleText === abilityName.trim()) {
            // 직업 어빌리티 버튼 찾기
            if (type === 'job') {
              const jobButton = card.querySelector('button');
              if (jobButton && jobButton.textContent.includes('직업')) {
                jobButton.click();
                
                // 어빌리티 장착 완료를 감지하여 즉시 진행
                await this.waitForAbilityEquipComplete(jobButton, abilityName);
                return true;
              }
            }
            // 메인 어빌리티 버튼 찾기
            else if (type === 'main') {
              const buttons = card.querySelectorAll('button');
              let found = false;
              for (const button of buttons) {
                if (button.textContent.includes('메인')) {
                  button.click();
                  
                  // 어빌리티 장착 완료를 감지하여 즉시 진행
                  await this.waitForAbilityEquipComplete(button, abilityName);
                  found = true;
                  return true;
                }
              }
              if (!found) {
              }
            }
          }
        }
      }

      return false;

    } catch (error) {
      return false;
    }
  }

  async waitForItemTable() {
    // 아이템 테이블이 로드될 때까지 대기
    let attempts = 0;
    const maxAttempts = 20; // 최대 10초 대기
    
    while (attempts < maxAttempts) {
      const table = document.querySelector('.MuiTableBody-root');
      const rows = table ? table.querySelectorAll('.MuiTableRow-root') : [];
      
      if (rows.length > 0) {
        return;
    }
    
      await this.wait(500);
      attempts++;
    }
    
    // 아이템 테이블 로드 타임아웃
  }

  async waitForTabContent(category) {
    let attempts = 0;
    const maxAttempts = 10; // 최대 5초 대기

    while (attempts < maxAttempts) {
      const table = document.querySelector('.MuiTableBody-root');
      if (table && table.querySelectorAll('.MuiTableRow-root').length > 0) {
        return;
      }
      await this.wait(500);
      attempts++;
    }
    // 아이템 테이블 로드 타임아웃
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitForEquipComplete(equipButton, itemName) {
    let attempts = 0;
    const maxAttempts = 20; // 최대 2초 대기
    
    while (attempts < maxAttempts) {
      // 버튼이 비활성화되었거나 텍스트가 변경되었는지 확인
      if (equipButton.disabled || !equipButton.textContent.includes('장착')) {
        return;
      }
      
      // 또는 이미 착용 중인지 확인
      const equippedTable = document.querySelector('.MuiTableBody-root');
      if (equippedTable) {
        const equippedItems = equippedTable.querySelectorAll('.MuiTypography-body1');
        for (const item of equippedItems) {
          if (item.textContent.includes(itemName)) {
            return;
          }
        }
      }
      
      await this.wait(100);
      attempts++;
    }
  }

  showEquipmentCompleteModal(equippedCount, totalItems) {
    const modal = document.createElement('div');
    modal.className = 'equipment-complete-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>장비 변경 완료</h3>
        <p>${equippedCount}개 / ${totalItems}개 아이템을 착용했습니다.</p>
        <button class="close-btn">확인</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
  }

  showCombinedCompleteModal(equipmentCount, equipmentTotal, abilityCount, abilityTotal, skillNumber = null) {
    const modal = document.createElement('div');
    modal.className = 'combined-complete-modal';
    
    equipmentCount = Number(equipmentCount) || 0;
    equipmentTotal = Number(equipmentTotal) || 0;
    abilityCount = Number(abilityCount) || 0;
    abilityTotal = Number(abilityTotal) || 0;
    
    const totalEquipped = equipmentCount + abilityCount;
    const totalItems = equipmentTotal + abilityTotal;
    
    // 스킬 활성화 문구 생성
    const skillText = skillNumber ? `<p><strong>스킬:</strong> ${skillNumber}번 스킬 활성화 완료</p>` : '';
    
    modal.innerHTML = `
      <div class="modal-content">
        <h3>모든 작업 완료</h3>
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>장비:</strong> ${equipmentCount}개 / ${equipmentTotal}개 장착</p>
          <p><strong>어빌리티:</strong> ${abilityCount}개 / ${abilityTotal}개 장착</p>
          ${skillText}
          <hr style="margin: 15px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p><strong>총합:</strong> ${totalEquipped}개 / ${totalItems}개 완료</p>
        </div>
        <button class="close-btn">확인</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
  }

  showAbilityCompleteModal(equippedCount, totalItems) {
    const modal = document.createElement('div');
    modal.className = 'ability-complete-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>어빌리티 변경 완료</h3>
        <p>${equippedCount}개 / ${totalItems}개 어빌리티를 장착했습니다.</p>
        <button class="close-btn">확인</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
  }

  showAbilityErrorModal() {
    const modal = document.createElement('div');
    modal.className = 'ability-error-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>어빌리티 변경 실패</h3>
        <p>어빌리티 변경 중 오류가 발생했습니다.</p>
        <button class="close-btn">확인</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
  }

  showEquipmentErrorModal() {
    const modal = document.createElement('div');
    modal.className = 'equipment-error-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>장비 변경 실패</h3>
        <p>장비 변경 중 오류가 발생했습니다.</p>
        <button class="close-btn">확인</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
  }

  openEquipmentSettingsModal(index) {
    this.createEquipmentSettingsModal(index);
  }

  createEquipmentSettingsModal(index) {
    const equipment = this.equipmentButtons[index] || {
      name: `장비 세트 ${index + 1}`,
      weapon: '',
      armor: '',
      accessory: '',
      jobAbility: '',
      jobAbilityTab: '',
      mainAbility: '',
      mainAbilityTab: '',
      skillNumber: null
    };

    const modal = document.createElement('div');
    modal.className = 'equipment-settings-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>장비 세트 설정</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="form-group">
          <label class="form-label">장비 세트 이름</label>
          <input type="text" class="form-input" id="equipment-name" value="${equipment.name}" placeholder="장비 세트 이름을 입력하세요">
        </div>
        <h4 style="margin: 20px 0 10px 0; color: #374151;">장비 설정</h4>
        <div class="form-group">
          <label class="form-label">무기</label>
          <input type="text" class="form-input" id="equipment-weapon" value="${equipment.weapon}" placeholder="무기 이름을 입력하세요">
        </div>
        <div class="form-group">
          <label class="form-label">방어구</label>
          <input type="text" class="form-input" id="equipment-armor" value="${equipment.armor}" placeholder="방어구 이름을 입력하세요">
        </div>
        <div class="form-group">
          <label class="form-label">장신구</label>
          <input type="text" class="form-input" id="equipment-accessory" value="${equipment.accessory}" placeholder="장신구 이름을 입력하세요">
        </div>
        <h4 style="margin: 20px 0 10px 0; color: #374151;">어빌리티 설정</h4>
        <div class="form-group">
          <label class="form-label">직업 어빌리티 탭</label>
          <select class="form-input" id="equipment-jobAbilityTab">
            <option value="검술" ${equipment.jobAbilityTab === '검술' || !equipment.jobAbilityTab ? 'selected' : ''}>검술</option>
            <option value="마술" ${equipment.jobAbilityTab === '마술' ? 'selected' : ''}>마술</option>
            <option value="신술" ${equipment.jobAbilityTab === '신술' ? 'selected' : ''}>신술</option>
            <option value="궁술" ${equipment.jobAbilityTab === '궁술' ? 'selected' : ''}>궁술</option>
            <option value="체술" ${equipment.jobAbilityTab === '체술' ? 'selected' : ''}>체술</option>
            <option value="인술" ${equipment.jobAbilityTab === '인술' ? 'selected' : ''}>인술</option>
          </select>
          <label class="form-label" style="margin-top: 10px;">직업 어빌리티</label>
          <input type="text" class="form-input" id="equipment-jobAbility" value="${equipment.jobAbility}" placeholder="직업 어빌리티 이름을 입력하세요">
        </div>
        <div class="form-group">
          <label class="form-label">메인 어빌리티 탭</label>
          <select class="form-input" id="equipment-mainAbilityTab">
            <option value="검술" ${equipment.mainAbilityTab === '검술' || !equipment.mainAbilityTab ? 'selected' : ''}>검술</option>
            <option value="마술" ${equipment.mainAbilityTab === '마술' ? 'selected' : ''}>마술</option>
            <option value="신술" ${equipment.mainAbilityTab === '신술' ? 'selected' : ''}>신술</option>
            <option value="궁술" ${equipment.mainAbilityTab === '궁술' ? 'selected' : ''}>궁술</option>
            <option value="체술" ${equipment.mainAbilityTab === '체술' ? 'selected' : ''}>체술</option>
            <option value="인술" ${equipment.mainAbilityTab === '인술' ? 'selected' : ''}>인술</option>
          </select>
          <label class="form-label" style="margin-top: 10px;">메인 어빌리티</label>
          <input type="text" class="form-input" id="equipment-mainAbility" value="${equipment.mainAbility}" placeholder="메인 어빌리티 이름을 입력하세요">
        </div>
        <h4 style="margin: 20px 0 10px 0; color: #374151;">스킬 설정</h4>
        <div class="form-group">
          <label class="form-label">자동 활성화할 스킬 번호</label>
          <div class="skill-toggle-container" style="display: flex; gap: 10px; margin-top: 10px;">
            <button type="button" class="skill-toggle-btn ${equipment.skillNumber === 1 ? 'active' : ''}" data-skill="1" style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 4px; background: ${equipment.skillNumber === 1 ? '#3b82f6' : '#fff'}; color: ${equipment.skillNumber === 1 ? '#fff' : '#374151'}; cursor: pointer;">1번</button>
            <button type="button" class="skill-toggle-btn ${equipment.skillNumber === 2 ? 'active' : ''}" data-skill="2" style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 4px; background: ${equipment.skillNumber === 2 ? '#3b82f6' : '#fff'}; color: ${equipment.skillNumber === 2 ? '#fff' : '#374151'}; cursor: pointer;">2번</button>
            <button type="button" class="skill-toggle-btn ${equipment.skillNumber === 3 ? 'active' : ''}" data-skill="3" style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 4px; background: ${equipment.skillNumber === 3 ? '#3b82f6' : '#fff'}; color: ${equipment.skillNumber === 3 ? '#fff' : '#374151'}; cursor: pointer;">3번</button>
          </div>
          <p style="margin-top: 8px; font-size: 12px; color: #6b7280;">장비/어빌리티 변경 시 자동으로 활성화할 스킬 번호를 선택하세요. 하나만 선택 가능합니다.</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary cancel-btn">취소</button>
          <button class="btn btn-primary save-btn" data-index="${index}">저장</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 이벤트 리스너 추가
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const saveBtn = modal.querySelector('.save-btn');
    
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    cancelBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    saveBtn.addEventListener('click', () => {
      const buttonIndex = parseInt(saveBtn.getAttribute('data-index'));
      this.saveEquipmentSettings(buttonIndex);
    });

    // 스킬 토글 버튼 이벤트 리스너 추가
    const skillToggleBtns = modal.querySelectorAll('.skill-toggle-btn');
    skillToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // 모든 버튼 비활성화
        skillToggleBtns.forEach(b => {
          b.style.background = '#fff';
          b.style.color = '#374151';
          b.classList.remove('active');
        });
        
        // 클릭된 버튼 활성화
        btn.style.background = '#3b82f6';
        btn.style.color = '#fff';
        btn.classList.add('active');
      });
    });
  }

  saveEquipmentSettings(index) {
    const modal = document.querySelector('.equipment-settings-modal');
    if (!modal) {
      return;
    }

    const name = modal.querySelector('#equipment-name').value.trim();
    const weapon = modal.querySelector('#equipment-weapon').value.trim();
    const armor = modal.querySelector('#equipment-armor').value.trim();
    const accessory = modal.querySelector('#equipment-accessory').value.trim();
    const jobAbility = modal.querySelector('#equipment-jobAbility').value.trim();
    const jobAbilityTab = modal.querySelector('#equipment-jobAbilityTab').value;
    const mainAbility = modal.querySelector('#equipment-mainAbility').value.trim();
    const mainAbilityTab = modal.querySelector('#equipment-mainAbilityTab').value;
    
    // 선택된 스킬 번호 가져오기
    const activeSkillBtn = modal.querySelector('.skill-toggle-btn.active');
    const skillNumber = activeSkillBtn ? parseInt(activeSkillBtn.getAttribute('data-skill')) : null;

    if (!name) {
      alert('장비 세트 이름을 입력해주세요.');
      return;
    }

    // 장비 세트 업데이트
    this.equipmentButtons[index] = {
      name,
      weapon,
      armor,
      accessory,
      jobAbility,
      jobAbilityTab,
      mainAbility,
      mainAbilityTab,
      skillNumber
    };

    // 로컬 스토리지 업데이트
    try {
      localStorage.setItem('lanisHelperEquipmentButtons', JSON.stringify(this.equipmentButtons));
    } catch (error) {
    }

    // 모달 닫기
    modal.remove();
    
    // 서브메뉴 닫기
    this.closeAllSubMenus();
  }

  openQuickSettingsModal(index) {
    window.lanisHelper.openQuickSettingsModal(index);
  }

  addNewEquipmentButton() {
    
    // 새로운 장비 버튼 설정을 위한 기본값
    const newButton = {
      name: `새 장비 세트 ${this.equipmentButtons.length + 1}`,
      weapon: '',
      armor: '',
      accessory: '',
      jobAbility: '',
      jobAbilityTab: '',
      mainAbility: '',
      mainAbilityTab: '',
      skillNumber: null
    };
    
    // 배열에 추가
    this.equipmentButtons.push(newButton);
    
    // 로컬 스토리지 업데이트
    try {
      localStorage.setItem('lanisHelperEquipmentButtons', JSON.stringify(this.equipmentButtons));
    } catch (error) {
    }
    
    // 설정 모달 열기
    this.openEquipmentSettingsModal(this.equipmentButtons.length - 1);
  }

  addNewQuickButton() {
    
    // 새로운 퀵버튼 설정을 위한 기본값
    const newButton = {
      keyword: `퀵${this.quickButtons.length + 1}`,
      name: `새 퀵버튼 ${this.quickButtons.length + 1}`,
      searchType: 'item',
      searchValue: ''
    };
    
    // 배열에 추가
    this.quickButtons.push(newButton);
    
    // 로컬 스토리지 업데이트
    try {
      localStorage.setItem('lanisHelperQuickButtons', JSON.stringify(this.quickButtons));
    } catch (error) {
    }
    
    // 설정 모달 열기
    this.openQuickSettingsModal(this.quickButtons.length - 1);
  }

  deleteEquipmentButton(index) {
    
    // 확인 메시지
    if (!confirm(`장비 세트 "${this.equipmentButtons[index]?.name || `장비${index + 1}`}"을(를) 삭제하시겠습니까?`)) {
      return;
    }
    
    // 배열에서 제거
    this.equipmentButtons.splice(index, 1);
    
    // 로컬 스토리지 업데이트
    try {
      localStorage.setItem('lanisHelperEquipmentButtons', JSON.stringify(this.equipmentButtons));
    } catch (error) {
    }
    
    // 서브메뉴 닫기
    this.closeAllSubMenus();
  }

  deleteQuickButton(index) {
    
    // 확인 메시지
    if (!confirm(`퀵버튼 "${this.quickButtons[index]?.keyword || `퀵${index + 1}`}"을(를) 삭제하시겠습니까?`)) {
      return;
    }
    
    // 배열에서 제거
    this.quickButtons.splice(index, 1);
    
    // 로컬 스토리지 업데이트
    try {
      localStorage.setItem('lanisHelperQuickButtons', JSON.stringify(this.quickButtons));
    } catch (error) {
    }
    
    // 서브메뉴 닫기
    this.closeAllSubMenus();
  }

  resetQuickButton(index) {
    // 퀵버튼 설정 제거
    this.quickButtons[index] = {};
    // 로컬 스토리지 업데이트
    try {
      localStorage.setItem('lanisHelperQuickButtons', JSON.stringify(this.quickButtons));
    } catch (error) {
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
    } catch (error) {
    }
  }

  async waitForAbilityTabContent(abilityTab) {
    let attempts = 0;
    const maxAttempts = 10; // 최대 5초 대기
    
    while (attempts < maxAttempts) {
      const cards = document.querySelectorAll('.MuiCard-root');
      if (cards.length > 0) {
        return;
      }
      await this.wait(500);
      attempts++;
    }
    // 어빌리티 카드 로드 타임아웃
  }

  async waitForAbilityEquipComplete(equipButton, abilityName) {
    let attempts = 0;
    const maxAttempts = 20; // 최대 2초 대기
    
    while (attempts < maxAttempts) {
      // 버튼이 비활성화되었거나 텍스트가 변경되었는지 확인
      if (equipButton.disabled || !equipButton.textContent.includes('직업') && !equipButton.textContent.includes('메인')) {
        return;
      }
      
      // 또는 이미 장착 중인지 확인
      const equippedAbilities = document.querySelectorAll('.css-3caazb .MuiTypography-subtitle1');
      for (const ability of equippedAbilities) {
        if (ability.textContent.trim() === abilityName.trim()) {
          return;
        }
      }
      
      await this.wait(100);
      attempts++;
    }
  }

  // 스킬 자동 활성화 기능
  async activateSkill(skillNumber) {
    if (!skillNumber) {
      return;
    }

    // 스킬 관리 페이지로 이동
    if (!window.location.href.includes('lanis.me/skill-management')) {
      // 대기 중인 스킬 활성화 작업을 sessionStorage에 저장
      sessionStorage.setItem('lanisHelperPendingSkill', JSON.stringify({
        skillNumber,
        timestamp: Date.now()
      }));
      
      window.location.href = 'https://lanis.me/skill-management';
      return;
    }

    // DOM이 준비될 때까지 대기
    await this.waitForSkillManagementDOM(skillNumber);
  }

  async waitForSkillManagementDOM(skillNumber) {
    // DOM이 이미 준비되어 있는지 먼저 확인
    const checkDOMReady = () => {
      const skillButtons = document.querySelectorAll('button[class*="MuiButton"]');
      return skillButtons.length > 0;
    };
    
    // 이미 준비되어 있으면 즉시 실행
    if (checkDOMReady()) {
      this.performSkillActivation(skillNumber);
      return;
    }
    
    // DOM이 준비될 때까지 짧은 간격으로 확인 (100ms)
    let attempts = 0;
    const maxAttempts = 50; // 최대 5초
    
    const checkAndExecute = () => {
      attempts++;
      
      if (checkDOMReady()) {
        this.performSkillActivation(skillNumber);
        return;
      }
      
      if (attempts >= maxAttempts) {
        this.showFinalCompleteModal();
        return;
      }
      
      // 다음 프레임에서 다시 확인
      requestAnimationFrame(checkAndExecute);
    };
    
    // 즉시 첫 번째 확인 시작
    requestAnimationFrame(checkAndExecute);
  }

  async performSkillActivation(skillNumber) {
    // 스킬 번호에 해당하는 활성화 버튼 찾기
    const skillButtons = document.querySelectorAll('button[class*="MuiButton"]');
    let targetButton = null;
    
    // 스킬 번호에 해당하는 버튼 찾기 (h6 태그의 텍스트로 스킬 번호 확인)
    for (let i = 0; i < skillButtons.length; i++) {
      const button = skillButtons[i];
      const skillHeader = button.closest('.MuiPaper-root')?.querySelector('h6');
      
      if (skillHeader && skillHeader.textContent.includes(`스킬${skillNumber}`)) {
        // 해당 스킬의 활성화 버튼 찾기
        const activateButton = button.closest('.MuiPaper-root')?.querySelector('button[class*="MuiButton-containedPrimary"]');
        if (activateButton && !activateButton.disabled && activateButton.textContent.includes('활성화')) {
          targetButton = activateButton;
          break;
        }
      }
    }
    
    if (!targetButton) {
      this.showFinalCompleteModal();
      return;
    }
    
    targetButton.click();
    
    // 활성화 완료 대기
    await this.waitForSkillActivationComplete(targetButton, skillNumber);
    
    // 스킬 활성화 완료 후 최종 모달 표시
    this.showFinalCompleteModal();
  }

  async waitForSkillActivationComplete(button, skillNumber) {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 30; // 최대 3초
      
      const checkComplete = () => {
        attempts++;
        
        // 활성화 완료 확인 (버튼이 비활성화되거나 텍스트가 변경됨)
        if (button.disabled || button.textContent.includes('활성화됨')) {
          resolve();
          return;
        }
        
        if (attempts >= maxAttempts) {
          resolve();
          return;
        }
        
        // 다음 프레임에서 다시 확인
        requestAnimationFrame(checkComplete);
      };
      
      // 즉시 첫 번째 확인 시작
      requestAnimationFrame(checkComplete);
    });
  }

  // 스킬 활성화 완료 후 최종 모달 표시
  showFinalCompleteModal() {
    try {
      const equipmentResult = sessionStorage.getItem('lanisHelperEquipmentResult');
      if (equipmentResult) {
        const result = JSON.parse(equipmentResult);
        const equipmentCount = Number(result.equipmentCount) || 0;
        const equipmentTotal = Number(result.equipmentTotal) || 0;
        const abilityCount = Number(result.abilityCount) || 0;
        const abilityTotal = Number(result.abilityTotal) || 0;
        const skillNumber = result.skillNumber || null;
        this.showCombinedCompleteModal(equipmentCount, equipmentTotal, abilityCount, abilityTotal, skillNumber);
        sessionStorage.removeItem('lanisHelperEquipmentResult');
      }
    } catch (error) {
      sessionStorage.removeItem('lanisHelperEquipmentResult');
    }
  }

  // 1. 결과 저장 함수 추가
  saveResultToSession({equipmentCount = 0, equipmentTotal = 0, abilityCount = 0, abilityTotal = 0, skillNumber = null}) {
    sessionStorage.setItem('lanisHelperEquipmentResult', JSON.stringify({
      equipmentCount, equipmentTotal, abilityCount, abilityTotal, skillNumber, timestamp: Date.now()
    }));
  }

  // 거래소 퀵버튼 클릭 핸들러
  async handleQuickButtonClick(index) {
    try {
      // 퀵버튼 설정 가져오기
      const quickButtons = this.getQuickButtons();
      if (!quickButtons || !quickButtons[index]) {
        return;
      }
      
      const searchConfig = quickButtons[index];
      
      // searchEngine이 초기화될 때까지 대기
      let attempts = 0;
      const maxAttempts = 50; // 최대 5초 대기
      
      while (attempts < maxAttempts) {
        if (window.searchEngine && typeof window.searchEngine.executeQuickSearch === 'function') {
          window.searchEngine.executeQuickSearch(searchConfig, index);
          break;
        }
        
        await this.wait(100);
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        // 대안: 직접 SearchEngine 인스턴스 생성
        if (!window.searchEngine) {
          window.searchEngine = new (window.SearchEngine || SearchEngine)();
          await window.searchEngine.init();
        }
        
        if (window.searchEngine && typeof window.searchEngine.executeQuickSearch === 'function') {
          window.searchEngine.executeQuickSearch(searchConfig, index);
        } else {
        }
      }
      
      // 서브메뉴 닫기
      this.closeAllSubMenus();
      
    } catch (error) {
    }
  }
}

// 전역 인스턴스 생성 (개선된 버전)
// console.log('MenuManager 클래스 정의 완료');
// console.log('MenuManager 인스턴스 생성 시작');
// console.log('현재 window 객체:', Object.keys(window).filter(key => key.includes('Manager') || key.includes('Engine')));

// DOM이 준비된 후에 인스턴스 생성
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // console.log('DOM 로드 완료 - MenuManager 인스턴스 생성');
    window.menuManager = new MenuManager();
    // console.log('MenuManager 인스턴스 생성 완료:', window.menuManager);
    // console.log('생성 후 window 객체:', Object.keys(window).filter(key => key.includes('Manager') || key.includes('Engine')));
  });
} else {
  // console.log('DOM 이미 로드됨 - MenuManager 인스턴스 즉시 생성');
  window.menuManager = new MenuManager();
  // console.log('MenuManager 인스턴스 생성 완료:', window.menuManager);
  // console.log('생성 후 window 객체:', Object.keys(window).filter(key => key.includes('Manager') || key.includes('Engine')));
} 
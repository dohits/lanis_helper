// 메뉴 관리자
class MenuManager {
  constructor() {
    this.menuConfig = null;
    this.settings = {};
    // init()은 외부에서 호출하도록 변경
  }

  async init() {
    await this.loadMenuConfig();
    this.loadSettings();
    this.createMenuUI();
    this.bindEvents();
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
            { id: "itemGuide", icon: "📚", text: "아이템 도감", title: "아이템 도감" },
            { id: "settings", icon: "⚙️", text: "설정", title: "설정 메뉴" }
          ],
          itemGuide: {
            subMenu: {
              title: "아이템 도감",
              items: [
                { id: "openGuide", icon: "📖", text: "도감 열기", title: "아이템 도감 열기" }
              ]
            }
          },
          settings: {
            subMenu: {
              title: "설정",
              items: [
                { id: "profileLink", icon: "👤", text: "프로필 링크", title: "사용자 프로필 링크 표시" },
                { id: "showItemStats", icon: "📊", text: "아이템 스탯", title: "아이템 스탯 정보 표시" },
                { id: "wikiLink", icon: "📚", text: "위키 이동", title: "Lanis 위키로 이동", url: "https://laniswiki.lovestoblog.com/" },
                { id: "lanisLink", icon: "🎮", text: "라니스 이동", title: "Lanis 게임으로 이동", url: "https://lanis.me/" }
              ]
            }
          }
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
        
        editButton.addEventListener('click', () => {
          // 퀵설정 모달 기능 삭제됨
          console.log('퀵설정 모달 기능이 삭제되었습니다.');
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
    
    const subMenuConfig = this.menuConfig.mainMenu.itemGuide.subMenu;
    
    subMenuConfig.items.forEach(item => {
      const button = document.createElement('button');
      button.className = 'main-menu-item sub-menu-item';
      button.innerHTML = item.text;
      button.title = item.title;
      button.style.fontWeight = 'bold';
      
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleSubMenuItemClick(item);
        this.closeAllSubMenus();
      });
      
      container.appendChild(button);
    });
  }

  createSettingsSubMenu(container) {
    container.innerHTML = '';
    
    const subMenuConfig = this.menuConfig.mainMenu.settings.subMenu;
    
    subMenuConfig.items.forEach(item => {
      const button = document.createElement('button');
      button.className = 'main-menu-item sub-menu-item';
      button.setAttribute('data-item-id', item.id);
      
      // 토글 버튼인지 확인
      const isToggleButton = item.id === 'profileLink' || item.id === 'showItemStats';
      
      if (isToggleButton) {
        // 토글 버튼 스타일 적용
        button.classList.add('toggle-button');
        const isEnabled = this.settings[item.id];
        button.classList.toggle('enabled', isEnabled);
        
        // 아이콘과 텍스트 설정
        const icon = isEnabled ? '✅' : '❌';
        button.innerHTML = `${icon} ${item.text}`;
        button.title = `${item.title} (${isEnabled ? '켜짐' : '꺼짐'})`;
      } else {
        // 일반 버튼
        button.innerHTML = item.text;
        button.title = item.title;
        button.style.fontWeight = 'bold';
      }
      
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleSubMenuItemClick(item, button);
        
        // 토글 버튼이 아닌 경우에만 메뉴 닫기
        if (!isToggleButton) {
          this.closeAllSubMenus();
        }
      });
      
      container.appendChild(button);
    });
  }

  handleSubMenuItemClick(item, button) {
    switch (item.id) {
      case 'openGuide':
        this.openItemGuideModal();
        break;
      case 'profileLink':
      case 'showItemStats':
        this.toggleSetting(item.id);
        this.updateToggleButton(button, item);
        break;
      case 'wikiLink':
      case 'lanisLink':
        if (item.url) {
          window.open(item.url, '_blank');
        }
        break;
      default:
        console.log('Unknown submenu item:', item.id);
    }
  }

  updateToggleButton(button, item) {
    const isEnabled = this.settings[item.id];
    
    // 클래스 업데이트
    button.classList.toggle('enabled', isEnabled);
    
    // 아이콘과 텍스트 업데이트
    const icon = isEnabled ? '✅' : '❌';
    button.innerHTML = `${icon} ${item.text}`;
    button.title = `${item.title} (${isEnabled ? '켜짐' : '꺼짐'})`;
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
    const existingModal = document.querySelector('.item-guide-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.id = 'itemGuideModal';
    modal.className = 'item-guide-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'item-guide-content';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'item-guide-header';
    
    const title = document.createElement('h3');
    title.textContent = '아이템 도감';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = '×';
    closeButton.onclick = () => modal.remove();
    
    modalHeader.appendChild(title);
    modalHeader.appendChild(closeButton);
    
    const searchSection = document.createElement('div');
    searchSection.className = 'item-guide-search';
    
    const itemSearchInput = document.createElement('input');
    itemSearchInput.type = 'text';
    itemSearchInput.id = 'itemSearchInput';
    itemSearchInput.placeholder = '아이템명 검색...';
    itemSearchInput.className = 'search-input';
    
    const abilitySearchInput = document.createElement('input');
    abilitySearchInput.type = 'text';
    abilitySearchInput.id = 'abilitySearchInput';
    abilitySearchInput.placeholder = '어빌리티 검색...';
    abilitySearchInput.className = 'search-input';
    
    searchSection.appendChild(itemSearchInput);
    searchSection.appendChild(abilitySearchInput);
    
    const attributesSection = document.createElement('div');
    attributesSection.className = 'item-guide-attributes';
    
    const attributeTitle = document.createElement('div');
    attributeTitle.className = 'attribute-title';
    attributeTitle.textContent = '속성 필터';
    
    const attributeButtons = document.createElement('div');
    attributeButtons.className = 'attribute-buttons';
    
    const attributes = ['물', '불', '번개', '바람', '별', '빛', '어둠', '무'];
    attributes.forEach(attr => {
      const btn = document.createElement('button');
      btn.className = 'attribute-btn';
      btn.setAttribute('data-attribute', attr);
      btn.textContent = attr;
      attributeButtons.appendChild(btn);
    });
    
    attributesSection.appendChild(attributeTitle);
    attributesSection.appendChild(attributeButtons);
    
    const categoriesSection = document.createElement('div');
    categoriesSection.className = 'item-guide-categories';
    
    const mainCategories = document.createElement('div');
    mainCategories.className = 'main-categories';
    
    const mainCategoryOptions = ['전체', '무기', '방어구', '장신구'];
    mainCategoryOptions.forEach(category => {
      const btn = document.createElement('button');
      btn.className = 'category-btn main-category';
      btn.setAttribute('data-category', category === '전체' ? '' : category);
      btn.textContent = category;
      if (category === '전체') btn.classList.add('active');
      mainCategories.appendChild(btn);
    });
    
    const subCategories = document.createElement('div');
    subCategories.className = 'sub-categories';
    subCategories.id = 'subCategories';
    subCategories.style.display = 'none';
    
    const subCategoryOptions = ['전체', '검', '도끼', '창', '활', '너클', '지팡이', '나이프', '미확인'];
    subCategoryOptions.forEach(category => {
      const btn = document.createElement('button');
      btn.className = 'category-btn sub-category';
      btn.setAttribute('data-category', category === '전체' ? '' : category);
      btn.textContent = category;
      if (category === '전체') btn.classList.add('active');
      subCategories.appendChild(btn);
    });
    
    categoriesSection.appendChild(mainCategories);
    categoriesSection.appendChild(subCategories);
    
    const listSection = document.createElement('div');
    listSection.className = 'item-guide-list';
    listSection.id = 'itemGuideList';
    
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = 'text-align: center; color: #666; padding: 20px;';
    loadingDiv.textContent = '아이템을 로드하는 중...';
    
    listSection.appendChild(loadingDiv);
    
    const footerSection = document.createElement('div');
    footerSection.className = 'item-guide-footer';
    footerSection.textContent = '총 ';
    
    const countSpan = document.createElement('span');
    countSpan.id = 'itemGuideCount';
    countSpan.textContent = '0';
    
    const countText = document.createTextNode('개 아이템');
    
    footerSection.appendChild(countSpan);
    footerSection.appendChild(countText);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(searchSection);
    modalContent.appendChild(attributesSection);
    modalContent.appendChild(categoriesSection);
    modalContent.appendChild(listSection);
    modalContent.appendChild(footerSection);
    
    modal.appendChild(modalContent);
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
      if (itemSearchInput) {
        itemSearchInput.addEventListener('input', () => this.filterItems());
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
        const listContainer = document.getElementById('itemGuideList');
        const countElement = document.getElementById('itemGuideCount');
        
        if (listContainer) {
          // 기존 내용 제거
          listContainer.innerHTML = '';
          
          const noItemsDiv = document.createElement('div');
          noItemsDiv.style.cssText = 'text-align: center; color: #666; padding: 20px;';
          noItemsDiv.textContent = '스캔된 아이템이 없습니다. 먼저 아이템 데이터를 수집해주세요.';
          
          listContainer.appendChild(noItemsDiv);
        }
        
        if (countElement) {
          countElement.textContent = '0';
        }
      }
    } catch (error) {
      const listContainer = document.getElementById('itemGuideList');
      if (listContainer) {
        // 기존 내용 제거
        listContainer.innerHTML = '';
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'text-align: center; color: #666; padding: 20px;';
        errorDiv.textContent = '데이터 로드 중 오류가 발생했습니다.';
        
        listContainer.appendChild(errorDiv);
      }
    }
  }

  // 아이템 목록 표시
  displayItems(items) {
    const listContainer = document.getElementById('itemGuideList');
    const countElement = document.getElementById('itemGuideCount');
    
    if (!listContainer || !countElement) {
      console.warn('아이템 가이드 컨테이너를 찾을 수 없습니다.');
      return;
    }

    // 기존 내용 제거
    listContainer.innerHTML = '';
    
    if (!items || items.length === 0) {
      const noItemsDiv = document.createElement('div');
      noItemsDiv.className = 'no-items';
      noItemsDiv.textContent = '아이템 데이터를 불러올 수 없습니다.';
      listContainer.appendChild(noItemsDiv);
      countElement.textContent = '0';
      return;
    }

    // HTML 이스케이프 함수
    const escapeHtml = (text) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    items.forEach((item) => {
      const itemName = escapeHtml(item.name || '알 수 없는 아이템');
      const powerRange = item.power_min && item.power_max ? `${item.power_min}-${item.power_max}` : 'N/A';
      const weightRange = item.weight_min && item.weight_max ? `${item.weight_min}-${item.weight_max}` : 'N/A';
      const weaponType = escapeHtml(item.weapon_type || 'N/A');
      const abilities = item.abilities && item.abilities.length > 0 ? 
        item.abilities.map(ability => escapeHtml(ability)).join(', ') : 'N/A';
      const attributes = item.attributes && item.attributes.length > 0 ? 
        item.attributes.map(attr => escapeHtml(attr)).join(', ') : 'N/A';
      
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
      
      // 타입이 N/A가 아닐 때만 괄호로 표시
      const typeDisplay = weaponType !== 'N/A' ? ` (${weaponType})` : '';
      
      // 카테고리별 아이콘 설정
      let categoryIcon = '📦'; // 기본 아이콘
      
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
      
      // 안전한 DOM 요소 생성
      const itemDiv = document.createElement('div');
      itemDiv.className = 'item-guide-item';
      itemDiv.setAttribute('data-name', itemName.toLowerCase());
      itemDiv.setAttribute('data-main-category', mainCategory.toLowerCase());
      itemDiv.setAttribute('data-sub-category', subCategory.toLowerCase());
      itemDiv.setAttribute('data-abilities', abilities.toLowerCase());
      itemDiv.setAttribute('data-attributes', attributes.toLowerCase());
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'item-name';
      
      const iconSpan = document.createElement('span');
      iconSpan.className = 'item-icon';
      iconSpan.textContent = categoryIcon;
      
      const nameText = document.createTextNode(itemName + typeDisplay);
      
      nameDiv.appendChild(iconSpan);
      nameDiv.appendChild(nameText);
      
      const statsDiv = document.createElement('div');
      statsDiv.className = 'item-stats';
      statsDiv.textContent = `위력: ${powerRange} | 무게: ${weightRange}`;
      
      const attributesDiv = document.createElement('div');
      attributesDiv.className = 'item-attributes';
      attributesDiv.textContent = `속성: ${attributes}`;
      
      const abilitiesDiv = document.createElement('div');
      abilitiesDiv.className = 'item-abilities';
      abilitiesDiv.textContent = `어빌리티: ${abilities}`;
      
      itemDiv.appendChild(nameDiv);
      itemDiv.appendChild(statsDiv);
      itemDiv.appendChild(attributesDiv);
      itemDiv.appendChild(abilitiesDiv);
      
      listContainer.appendChild(itemDiv);
    });

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
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const title = document.createElement('h3');
    title.textContent = '장비 변경 완료';
    
    const message = document.createElement('p');
    message.textContent = `${equippedCount}개 / ${totalItems}개 아이템을 착용했습니다.`;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '확인';
    
    modalContent.appendChild(title);
    modalContent.appendChild(message);
    modalContent.appendChild(closeBtn);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
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
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const title = document.createElement('h3');
    title.textContent = '모든 작업 완료';
    
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'text-align: left; margin: 20px 0;';
    
    const equipmentText = document.createElement('p');
    equipmentText.innerHTML = `<strong>장비:</strong> ${equipmentCount}개 / ${equipmentTotal}개 장착`;
    
    const abilityText = document.createElement('p');
    abilityText.innerHTML = `<strong>어빌리티:</strong> ${abilityCount}개 / ${abilityTotal}개 장착`;
    
    contentDiv.appendChild(equipmentText);
    contentDiv.appendChild(abilityText);
    
    // 스킬 활성화 문구 생성
    if (skillNumber) {
      const skillText = document.createElement('p');
      skillText.innerHTML = `<strong>스킬:</strong> ${skillNumber}번 스킬 활성화 완료`;
      contentDiv.appendChild(skillText);
    }
    
    const hr = document.createElement('hr');
    hr.style.cssText = 'margin: 15px 0; border: none; border-top: 1px solid #e5e7eb;';
    
    const totalText = document.createElement('p');
    totalText.innerHTML = `<strong>총합:</strong> ${totalEquipped}개 / ${totalItems}개 완료`;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '확인';
    
    modalContent.appendChild(title);
    modalContent.appendChild(contentDiv);
    modalContent.appendChild(hr);
    modalContent.appendChild(totalText);
    modalContent.appendChild(closeBtn);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
  }

  showAbilityCompleteModal(equippedCount, totalItems) {
    const modal = document.createElement('div');
    modal.className = 'ability-complete-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const title = document.createElement('h3');
    title.textContent = '어빌리티 변경 완료';
    
    const message = document.createElement('p');
    message.textContent = `${equippedCount}개 / ${totalItems}개 어빌리티를 장착했습니다.`;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '확인';
    
    modalContent.appendChild(title);
    modalContent.appendChild(message);
    modalContent.appendChild(closeBtn);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
  }

  showAbilityErrorModal() {
    const modal = document.createElement('div');
    modal.className = 'ability-error-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const title = document.createElement('h3');
    title.textContent = '어빌리티 변경 실패';
    
    const message = document.createElement('p');
    message.textContent = '어빌리티 변경 중 오류가 발생했습니다.';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '확인';
    
    modalContent.appendChild(title);
    modalContent.appendChild(message);
    modalContent.appendChild(closeBtn);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
  }

  showEquipmentErrorModal() {
    const modal = document.createElement('div');
    modal.className = 'equipment-error-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const title = document.createElement('h3');
    title.textContent = '장비 변경 실패';
    
    const message = document.createElement('p');
    message.textContent = '장비 변경 중 오류가 발생했습니다.';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '확인';
    
    modalContent.appendChild(title);
    modalContent.appendChild(message);
    modalContent.appendChild(closeBtn);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
  }

  openEquipmentSettingsModal(index) {
    // 장비 설정 모달 기능 삭제됨
    console.log('장비 설정 모달 기능이 삭제되었습니다.');
  }

  createEquipmentSettingsModal(index) {
    // 장비 설정 모달 기능 삭제됨
    console.log('장비 설정 모달 기능이 삭제되었습니다.');
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
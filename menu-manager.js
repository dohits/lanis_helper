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
    
    // 기존 퀵버튼들 표시
    this.quickButtons.forEach((button, index) => {
      if (button && Object.keys(button).length > 0) {
        // 퀵버튼과 삭제 버튼을 감싸는 컨테이너
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'quick-button-group';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '8px';
        buttonContainer.style.alignItems = 'center';
        
        // 퀵버튼
        const quickButton = document.createElement('button');
        quickButton.className = 'main-menu-item sub-menu-item';
        
        const buttonText = button.keyword || `퀵${index + 1}`;
        quickButton.innerHTML = buttonText;
        quickButton.title = button.name || `퀵버튼 ${index + 1}`;
        
        quickButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleQuickButtonClick(index);
        });
        
        // 삭제 버튼
        const deleteButton = document.createElement('button');
        deleteButton.className = 'main-menu-item sub-menu-item delete-btn';
        deleteButton.innerHTML = '삭제';
        deleteButton.title = `퀵${index + 1} 삭제`;
        
        deleteButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteQuickButton(index);
        });
        
        buttonContainer.appendChild(quickButton);
        buttonContainer.appendChild(deleteButton);
        container.appendChild(buttonContainer);
      }
    });
    
    // 추가 버튼 (항상 마지막에 표시)
    const addButton = document.createElement('button');
    addButton.className = 'main-menu-item sub-menu-item add-btn';
    addButton.innerHTML = '+ 추가';
    addButton.title = '새 퀵버튼 추가';
    
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
    
    // 팝업 열기 버튼 생성
    const popupButton = document.createElement('button');
    popupButton.className = 'main-menu-item sub-menu-item';
    popupButton.innerHTML = '설정';
    popupButton.title = '설정 팝업 열기';
    
    popupButton.addEventListener('click', (e) => {
      e.stopPropagation();
      // 팝업 열기
      chrome.runtime.sendMessage({ action: 'openPopup' });
      this.closeAllSubMenus();
    });
    
    // 위키 이동 버튼 생성
    const wikiButton = document.createElement('button');
    wikiButton.className = 'main-menu-item sub-menu-item';
    wikiButton.innerHTML = '위키 이동';
    wikiButton.title = 'Lanis 위키로 이동';
    
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
    
    lanisButton.addEventListener('click', (e) => {
      e.stopPropagation();
      // 라니스 게임 페이지 열기
      window.open('https://lanis.me/', '_blank');
      this.closeAllSubMenus();
    });
    
    container.appendChild(popupButton);
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
      console.error('아이템 데이터 로드 실패:', error);
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

  addNewQuickButton() {
    console.log('새 퀵버튼 추가');
    
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
      console.log('새 퀵버튼 추가 완료:', this.quickButtons);
    } catch (error) {
      console.error('새 퀵버튼 추가 실패:', error);
    }
    
    // 설정 모달 열기
    this.openQuickSettingsModal(this.quickButtons.length - 1);
  }

  deleteQuickButton(index) {
    console.log(`퀵${index + 1} 삭제`);
    
    // 확인 메시지
    if (!confirm(`퀵버튼 "${this.quickButtons[index]?.keyword || `퀵${index + 1}`}"을(를) 삭제하시겠습니까?`)) {
      return;
    }
    
    // 배열에서 제거
    this.quickButtons.splice(index, 1);
    
    // 로컬 스토리지 업데이트
    try {
      localStorage.setItem('lanisHelperQuickButtons', JSON.stringify(this.quickButtons));
      console.log('퀵버튼 삭제 완료:', this.quickButtons);
    } catch (error) {
      console.error('퀵버튼 삭제 실패:', error);
    }
    
    // 서브메뉴 닫기
    this.closeAllSubMenus();
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
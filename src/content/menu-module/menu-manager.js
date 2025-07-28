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
      // Chrome 확장 프로그램의 web_accessible_resources를 통해 로드
      const configUrl = chrome.runtime.getURL('menu-config.json');
      
      const response = await fetch(configUrl);
      if (response.ok) {
        this.menuConfig = await response.json();
        return;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // 모든 경로 실패 시 기본 설정 사용
      this.menuConfig = {
        mainMenu: {
          button: {
            icon: "⚡",
            text: "",
            title: "Lanis Helper 메뉴"
          },
          items: [
            {
              id: "itemGuide",
              icon: "📚",
              text: "아이템 도감",
              title: "아이템 도감"
            },
            {
              id: "settings",
              icon: "⚙️",
              text: "설정",
              title: "설정 메뉴"
            }
          ]
        }
      };
    } catch (error) {
      this.menuConfig = null;
      return;
    }
  }

  async loadSettings() {
    try {
      // utils가 전역에서 사용 가능한지 확인
      if (typeof window !== 'undefined' && window.utils) {
        this.settings = await window.utils.SettingsManager.getSettings({
          profileLink: true,
          showItemStats: true
        });
      } else {
        // utils가 없으면 기본 설정 사용
        this.settings = { 
          profileLink: true, 
          showItemStats: true 
        };
      }
    } catch (error) {
      this.settings = { 
        profileLink: true, 
        showItemStats: true 
      };
    }
  }















  createMenuUI() {
    if (!this.menuConfig) return;
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
    const container = document.querySelector('.quick-buttons-container');
    if (!mainMenuRow) return;
    const isOpen = mainMenuRow.classList.contains('show');
    if (isOpen) {
      mainMenuRow.classList.remove('show');
      // --- 서브메뉴(자식버튼)도 모두 제거 ---
      document.querySelectorAll('.sub-menu-popup').forEach(el => el.remove());
      // -------------------------------------
      if (container) {
        container.setAttribute('aria-hidden', 'true');
        const focusedElement = container.querySelector(':focus');
        if (focusedElement) {
          focusedElement.blur();
        }
      }
    } else {
      mainMenuRow.classList.add('show');
      if (container) {
        container.removeAttribute('aria-hidden');
    }
    }
    event.stopPropagation();
  }

  handleMainMenuItemClick(item) {
    // --- 이미 해당 서브메뉴가 열려있으면 닫기(토글) ---
    const btn = document.querySelector(`.main-menu-item[data-menu-id="${item.id}"]`);
    const opened = document.querySelector('.sub-menu-popup');
    if (opened && opened.getAttribute('data-menu-id') === item.id) {
      opened.remove();
      return;
    }
    // 서브메뉴가 이미 열려있으면 닫기
    this.closeAllSubMenus();
    if (!btn) return;
    // 서브메뉴 팝업 생성
    const subMenu = document.createElement('div');
    subMenu.className = 'sub-menu-popup';
    subMenu.setAttribute('data-menu-id', item.id);
    // 위치 조정(버튼 오른쪽, 스크롤 고려)
    const rect = btn.getBoundingClientRect();
    subMenu.style.position = 'fixed'; // absolute에서 fixed로 변경
    subMenu.style.left = `${rect.right + 16}px`; // 오른쪽으로 배치
    subMenu.style.top = `${rect.top + rect.height/2}px`; // 버튼 중앙 높이
    subMenu.style.transform = 'translateY(-50%)'; // 세로 중앙 정렬
    subMenu.style.zIndex = 10010;
    // 서브메뉴 내용 생성
    if (item.id === 'itemGuide') {
      this.createItemGuideSubMenu(subMenu);
    } else if (item.id === 'settings') {
      this.createSettingsSubMenu(subMenu);
    } else {
      // 알 수 없는 서브메뉴 아이템
      return;
    }
    document.body.appendChild(subMenu);

    // --- 위치 조정: 화면을 넘어갈 경우에만 메인버튼 기준 위로 확장, 그 외에는 서브버튼 기준 아래로 ---
    setTimeout(() => {
      try {
        // 1. 기존 스타일 초기화
        subMenu.style.top = '';
        subMenu.style.bottom = '';
        subMenu.style.maxHeight = '';
        subMenu.style.transform = '';
        // 2. 위치 정보 계산
        const btnRect = btn.getBoundingClientRect();
        const mainBtn = document.querySelector('.main-menu-button');
        const mainBtnRect = mainBtn.getBoundingClientRect();
        const prevVis = subMenu.style.visibility;
        const prevDisp = subMenu.style.display;
        subMenu.style.visibility = 'hidden';
        subMenu.style.display = 'block';
        const menuHeight = subMenu.offsetHeight;
        subMenu.style.visibility = prevVis;
        subMenu.style.display = prevDisp;
        const spaceBelow = window.innerHeight - btnRect.bottom;
        const spaceAbove = btnRect.top;
        // 3. 아래로 열면 화면을 넘고, 위쪽 공간이 더 넓으면 메인버튼 기준 위로 확장
        if (menuHeight > spaceBelow && spaceAbove > spaceBelow) {
          subMenu.style.top = 'auto';
          subMenu.style.bottom = `${window.innerHeight - mainBtnRect.bottom}px`;
          subMenu.style.maxHeight = `${mainBtnRect.top - 16}px`;
          subMenu.style.transform = 'none';
    } else {
          // 서브버튼 기준 아래로 렌더링
          subMenu.style.top = `${btnRect.top + btnRect.height/2}px`;
          subMenu.style.bottom = '';
          subMenu.style.maxHeight = '';
          subMenu.style.transform = 'translateY(-50%)';
        }
        subMenu.classList.add('show');
      } catch(e) {}
    }, 0);
    // --- 위치 조정 끝 ---
  }







  createItemGuideSubMenu(container) {
    container.innerHTML = '';
    
    const subMenuConfig = this.menuConfig.mainMenu.itemGuide.subMenu;
    
    // [신규] 아이템 시세 조회 버튼 추가 (레어 장비 도감 위에)
    const priceButton = document.createElement('button');
    priceButton.className = 'main-menu-item sub-menu-item';
    priceButton.innerHTML = '💹 아이템 시세 조회';
    priceButton.title = '구글 시트 기반 아이템 시세 그래프';
    priceButton.style.fontWeight = 'bold';
    priceButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    priceButton.style.color = 'white';
    priceButton.style.marginBottom = '8px';
    priceButton.onclick = (e) => {
      e.stopPropagation();
      this.openItemPriceModal(); // 아래에 신규 함수로 기본 모달 오픈
    };
    container.appendChild(priceButton);

    // 기존 도감/해방/어빌리티/검색 버튼 렌더링
    subMenuConfig.items.forEach(item => {
      const button = document.createElement('button');
      button.className = 'main-menu-item sub-menu-item';
      button.innerHTML = item.text;
      button.title = item.title;
      button.style.fontWeight = 'bold';
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.handleSubMenuItemClick(item);
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
      
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.handleSubMenuItemClick(item, button);
        
        // 토글 버튼이 아닌 경우에만 메뉴 닫기
        if (!isToggleButton) {
          this.closeAllSubMenus();
        }
      });
      
      container.appendChild(button);
    });
  }

  async handleSubMenuItemClick(item, button) {
    switch (item.id) {
      case 'openGuide':
        this.openItemGuideModal();
        break;
      case 'userSearch':
        this.openUserSearchModal();
        break;
      case 'enchantInfo':
        this.openEnchantInfoModal();
        break;
      case 'programInfo':
        this.openProgramInfoModal();
        break;
      case 'profileLink':
      case 'showItemStats':
        await this.toggleSetting(item.id);
        this.updateToggleButton(button, item);
        break;
      case 'wikiLink':
      case 'lanisLink':
        if (item.url) {
          window.open(item.url, '_blank');
        }
        break;
      case 'abilityInfo':
        this.openAbilityInfoModal();
        break;
      default:
        // 알 수 없는 서브메뉴 아이템
        break;
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
      // 초기 스타일
      btn.style.cssText = `
        margin: 0 2px 6px 0;
        padding: 6px 16px;
        border-radius: 16px;
        font-size: 13px;
        font-weight: 700;
        border: 2px solid #667eea;
        background: white;
        color: #667eea;
        transition: all 0.3s;
        cursor: pointer;
        box-sizing: border-box;
      `;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 토글 상태 변경
        const wasActive = btn.classList.contains('active');
        btn.classList.toggle('active');
        
        // 스타일 동기화
        if (btn.classList.contains('active')) {
          btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          btn.style.color = 'white';
          btn.style.border = 'none';
        } else {
          btn.style.background = 'white';
          btn.style.color = '#667eea';
          btn.style.border = '2px solid #667eea';
        }
        
        // 필터링 실행
        this.filterItems();
      });
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
      // 초기 스타일
      btn.style.cssText = `
        margin: 0 2px 6px 0;
        padding: 6px 16px;
        border-radius: 16px;
        font-size: 13px;
        font-weight: 700;
        border: 2px solid #667eea;
        background: white;
        color: #667eea;
        transition: all 0.3s;
        cursor: pointer;
        box-sizing: border-box;
      `;
      if (category === '전체') {
        btn.classList.add('active');
        btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        btn.style.color = 'white';
        btn.style.border = 'none';
      }
      btn.addEventListener('click', (e) => {
        // 활성 상태 변경
        document.querySelectorAll('.main-category').forEach(b => {
          b.classList.remove('active');
          b.style.background = 'white';
          b.style.color = '#667eea';
          b.style.border = '2px solid #667eea';
        });
        btn.classList.add('active');
        btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        btn.style.color = 'white';
        btn.style.border = 'none';
        const category = btn.getAttribute('data-category');
        this.handleMainCategoryChange(category);
      });
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
      // 초기 스타일
      btn.style.cssText = `
        margin: 0 2px 6px 0;
        padding: 6px 16px;
        border-radius: 16px;
        font-size: 13px;
        font-weight: 700;
        border: 2px solid #667eea;
        background: white;
        color: #667eea;
        transition: all 0.3s;
        cursor: pointer;
        box-sizing: border-box;
      `;
      if (category === '전체') {
        btn.classList.add('active');
        btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        btn.style.color = 'white';
        btn.style.border = 'none';
      }
      btn.addEventListener('click', (e) => {
        // 활성 상태 변경
        document.querySelectorAll('.sub-category').forEach(b => {
          b.classList.remove('active');
          b.style.background = 'white';
          b.style.color = '#667eea';
          b.style.border = '2px solid #667eea';
        });
        btn.classList.add('active');
        btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        btn.style.color = 'white';
        btn.style.border = 'none';
        this.filterItems();
      });
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
      const type = escapeHtml(item.type || ''); // 반드시 type 필드만 사용
      const typeDisplay = type ? ` (${type})` : '';
      const powerRange = (item.power_min !== null && item.power_min !== undefined && item.power_max !== null && item.power_max !== undefined) ? `${item.power_min}-${item.power_max}` : 'N/A';
      const weightRange = (item.weight_min !== null && item.weight_min !== undefined && item.weight_max !== null && item.weight_max !== undefined) ? `${item.weight_min}-${item.weight_max}` : 'N/A';
      const abilities = item.abilities && item.abilities.length > 0 ? 
        item.abilities.map(ability => escapeHtml(ability)).join(', ') : 'N/A';
      const attributes = item.attributes && item.attributes.length > 0 ? 
        item.attributes.map(attr => escapeHtml(attr)).join(', ') : 'N/A';
      // 카테고리 분류
      let mainCategory = '';
      let subCategory = '';
      if (type) {
        const categories = type.split('/');
        if (categories.length >= 2) {
          mainCategory = categories[0];
          subCategory = categories[1];
        } else {
          mainCategory = categories[0];
          if (mainCategory === '무기') {
            subCategory = '미확인';
          }
        }
      }
      // 카테고리별 아이콘 설정
      let categoryIcon = '📦';
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
      if (abilities !== 'N/A') {
        abilitiesDiv.textContent = abilities;
        itemDiv.appendChild(abilitiesDiv);
      }
      
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
        activeAttributes.some(attr => {
          // 속성명이 정확히 일치하는지 확인
          return itemAttributes.includes(attr) || itemAttributes.includes(attr.toLowerCase());
        });
      
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
    
    // 메인 메뉴도 닫고 포커스 제거
    const mainMenuRow = document.querySelector('.main-menu-row');
    const container = document.querySelector('.quick-buttons-container');
    if (mainMenuRow && mainMenuRow.classList.contains('show')) {
      mainMenuRow.classList.remove('show');
      if (container) {
        container.setAttribute('aria-hidden', 'true');
        // 포커스된 요소가 있다면 포커스 제거
        const focusedElement = container.querySelector(':focus');
        if (focusedElement) {
          focusedElement.blur();
        }
      }
    }
  }

  async toggleSetting(settingId) {
    this.settings[settingId] = !this.settings[settingId];
    
    // 유틸리티 함수를 사용하여 설정 저장
    try {
      await utils.SettingsManager.setSettings(this.settings);
    } catch (error) {
      console.warn('설정 저장 실패:', error);
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
    }
  }

  // 사용자 검색 모달 열기
  openUserSearchModal() {
    // 기존 모달이 있으면 제거
    const existingModal = document.querySelector('.user-search-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'user-search-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'user-search-content';
    
    // 헤더 생성
    const header = document.createElement('div');
    header.className = 'user-search-header';
    
    const title = document.createElement('h3');
    title.textContent = '사용자 검색';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'user-search-close';
    closeButton.textContent = '×';
    closeButton.onclick = () => this.closeUserSearchModal(modal);
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // 폼 생성
    const form = document.createElement('form');
    form.className = 'user-search-form';
    form.onsubmit = (e) => {
      e.preventDefault();
      this.handleUserSearch(modal);
    };
    
    // 입력 그룹
    const inputGroup = document.createElement('div');
    inputGroup.className = 'user-search-input-group';
    
    const label = document.createElement('label');
    label.className = 'user-search-label';
    label.textContent = '사용자명';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'user-search-input';
    input.placeholder = '검색할 사용자명을 입력하세요';
    input.required = true;
    input.maxLength = 6;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'user-search-error';
    errorDiv.textContent = '닉네임은 영문, 숫자, 한글만 6글자까지 입력 가능합니다.';
    
    inputGroup.appendChild(label);
    inputGroup.appendChild(input);
    inputGroup.appendChild(errorDiv);
    
    // 버튼 그룹
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'user-search-buttons';
    
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'user-search-submit';
    submitButton.textContent = '검색';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'user-search-cancel';
    cancelButton.textContent = '취소';
    cancelButton.onclick = () => this.closeUserSearchModal(modal);
    
    buttonGroup.appendChild(submitButton);
    buttonGroup.appendChild(cancelButton);
    
    // 폼 조립
    form.appendChild(inputGroup);
    form.appendChild(buttonGroup);
    
    // 모달 조립
    modalContent.appendChild(header);
    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    
    // DOM에 추가
    document.body.appendChild(modal);
    
    // 모달 표시 애니메이션
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    // 입력 필드에 포커스
    input.focus();
    
    // ESC 키로 모달 닫기
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        this.closeUserSearchModal(modal);
        document.removeEventListener('keydown', handleEscKey);
      }
    };
    document.addEventListener('keydown', handleEscKey);
    
    // 모달 외부 클릭으로 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeUserSearchModal(modal);
      }
    });
    
    // 입력 검증
    input.addEventListener('input', () => {
      this.validateUserInput(input, errorDiv);
    });
  }

  // 사용자 입력 검증
  validateUserInput(input, errorDiv) {
    const value = input.value.trim();
    const isValid = /^[a-zA-Z0-9가-힣]{1,6}$/.test(value);
    
    if (value && !isValid) {
      input.classList.add('error');
      errorDiv.classList.add('show');
    } else {
      input.classList.remove('error');
      errorDiv.classList.remove('show');
    }
  }

  // 사용자 검색 처리
  handleUserSearch(modal) {
    const input = modal.querySelector('.user-search-input');
    const username = input.value.trim();
    
    // 입력 검증
    if (!username) {
      this.showUserSearchError(modal, '닉네임을 입력해주세요.');
      return;
    }

    if (!/^[a-zA-Z0-9가-힣]{1,6}$/.test(username)) {
      this.showUserSearchError(modal, '닉네임은 영문, 숫자, 한글만 6글자까지 입력 가능합니다.');
      return;
    }
    
    if (username.length > 6) {
      this.showUserSearchError(modal, '닉네임은 6글자를 초과할 수 없습니다.');
      return;
    }
    
    // XSS 방지를 위한 추가 검증
    const sanitizedUsername = this.sanitizeUsername(username);
    if (sanitizedUsername !== username) {
      this.showUserSearchError(modal, '잘못된 닉네임입니다.');
        return;
    }
    
    // URL 생성 및 이동
    const userUrl = `https://lanis.me/users/${encodeURIComponent(sanitizedUsername)}`;
    
    // 현재 페이지에서 이동
    window.location.href = userUrl;
    
    // 모달 닫기
    this.closeUserSearchModal(modal);
  }

  // 사용자명 sanitize (XSS 방지)
  sanitizeUsername(username) {
    // 위험한 문자 제거 (HTML 엔티티 디코딩 없이 직접 처리)
    const sanitized = username
      .replace(/[<>\"'&]/g, '') // HTML 태그 및 위험 문자 제거
      .replace(/javascript:/gi, '') // javascript: 프로토콜 제거
      .replace(/data:/gi, '') // data: 프로토콜 제거
      .replace(/vbscript:/gi, '') // vbscript: 프로토콜 제거
      .trim();
    
    return sanitized;
  }

  // 사용자 검색 에러 표시
  showUserSearchError(modal, message) {
    const errorDiv = modal.querySelector('.user-search-error');
    const input = modal.querySelector('.user-search-input');
    
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    input.classList.add('error');
    input.focus();
    
    // 3초 후 에러 메시지 숨기기
    setTimeout(() => {
      errorDiv.classList.remove('show');
      input.classList.remove('error');
    }, 3000);
  }

  // 사용자 검색 모달 닫기
  closeUserSearchModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  }

  // 해방 정보 모달 열기
  // 참고: exam/enchant-info-armor-example.js에서 데이터 구조 및 예시 확인
  openEnchantInfoModal() {
    // 기존 모달 제거
    const existingModal = document.querySelector('.enchant-info-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'enchant-info-modal user-search-modal';
    
    const content = document.createElement('div');
    content.className = 'user-search-content';
    content.style.maxWidth = '800px';
    content.style.maxHeight = '90vh';
    
    // 헤더
    const header = document.createElement('div');
    header.className = 'user-search-header';
    const title = document.createElement('h3');
    title.textContent = '장비 해방 정보';
    const closeButton = document.createElement('button');
    closeButton.className = 'user-search-close';
    closeButton.textContent = '×';
    closeButton.onclick = () => this.closeEnchantInfoModal(modal);
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // 본문 컨테이너
    const bodyContainer = document.createElement('div');
    bodyContainer.style.padding = '20px';
    
    // 토글 버튼 컨테이너
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 20px;
    `;
    
    const toggleButtons = [
      { id: 'weapon', text: '무기', color: '#007BFF' },
      { id: 'armor', text: '방어구', color: '#007BFF' },
      { id: 'accessory', text: '장신구', color: '#007BFF' }
    ];
    
    let currentType = 'armor'; // 기본값
    
    toggleButtons.forEach(btn => {
      const button = document.createElement('button');
      button.id = `toggle-${btn.id}`;
      // 아이콘 제거, 텍스트만 표시
      button.textContent = btn.text;
      // 장비 해방 정보 토글버튼 생성 및 스타일
      button.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-width: 80px;
        min-height: 36px;
        height: auto;
        padding: 0 16px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        transition: all 0.3s;
        line-height: 1.5;
        white-space: nowrap;
        overflow: visible;
        vertical-align: middle;
        box-sizing: border-box;
        ${btn.id === currentType ? `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
        ` : `
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        `}
      `;
      
      button.onclick = () => {
        // 모든 버튼 스타일 초기화
        toggleButtons.forEach(b => {
          const btnElement = document.getElementById(`toggle-${b.id}`);
          if (btnElement) {
            if (b.id === btn.id) return; // 선택된 버튼은 아래에서 처리
            btnElement.style.background = 'white';
            btnElement.style.color = '#667eea';
            btnElement.style.border = '2px solid #667eea';
            btnElement.style.borderRadius = '20px';
          }
        });
        // 선택된 버튼 스타일
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '20px';
        // 데이터 로드
        currentType = btn.id;
        this.fetchEnchantInfoData(modal, currentType);
      };
      toggleContainer.appendChild(button);
    });
    
    // 로딩 상태
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'enchant-loading';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.padding = '40px';
    loadingDiv.style.color = '#666';
    loadingDiv.innerHTML = '데이터를 불러오는 중...';
    
    // 테이블 컨테이너
    const tableContainer = document.createElement('div');
    tableContainer.id = 'enchant-table-container';
    tableContainer.style.display = 'none';
    
    // 조립
    bodyContainer.appendChild(toggleContainer);
    bodyContainer.appendChild(loadingDiv);
    bodyContainer.appendChild(tableContainer);
    content.appendChild(header);
    content.appendChild(bodyContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    setTimeout(() => { modal.classList.add('show'); }, 10);
    
    // ESC, 외부 클릭 닫기
    const handleEsc = (e) => { 
      if (e.key === 'Escape') { 
        this.closeEnchantInfoModal(modal); 
        document.removeEventListener('keydown', handleEsc); 
      } 
    };
    document.addEventListener('keydown', handleEsc);
    modal.addEventListener('click', (e) => { 
      if (e.target === modal) this.closeEnchantInfoModal(modal); 
    });
    
    // 초기 데이터 로드
    this.fetchEnchantInfoData(modal, currentType);
  }

  // 해방 정보 데이터 가져오기
  async fetchEnchantInfoData(modal, type = 'armor') {
    const loadingDiv = modal.querySelector('#enchant-loading');
    const tableContainer = modal.querySelector('#enchant-table-container');
    
    // 로딩 상태 표시
    loadingDiv.style.display = 'block';
    tableContainer.style.display = 'none';
    
    try {
      // background.js에 메시지 전송
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'FETCH_ENCHANT_INFO',
          enchantType: type 
        }, (response) => {
          resolve(response);
        });
      });
      
      if (result && result.success) {
        if (result.data && result.data.length > 0) {
          this.displayEnchantInfoTable(modal, result.data);
          loadingDiv.style.display = 'none';
          tableContainer.style.display = 'block';
        } else {
          // 데이터가 없는 경우
          this.displayNoDataMessage(modal, type);
          loadingDiv.style.display = 'none';
          tableContainer.style.display = 'block';
        }
      } else {
        const errorMsg = result ? (result.error || '데이터 가져오기 실패') : '응답이 없습니다';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('[MenuManager] 해방 정보 데이터 가져오기 실패:', error);
      loadingDiv.innerHTML = `데이터 가져오기 실패: ${error.message}`;
      loadingDiv.style.color = '#f44336';
    }
  }

  // 해방 정보 테이블 표시
  // 참고: exam/enchant-info-armor-example.js에서 데이터 구조 및 예시 확인
  displayEnchantInfoTable(modal, data) {
    const tableContainer = modal.querySelector('#enchant-table-container');
    
    // 테이블 생성
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 14px;
      min-width: 300px;
      table-layout: fixed;
    `;
    
    // 헤더
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = [
      { text: '항목', color: '#f5f5f5' },
      { text: '동', color: '#CD7F32' },      // 동색 (브론즈)
      { text: '은', color: '#C0C0C0' },      // 은색
      { text: '금', color: '#FFD700' },      // 금색
      { text: '칠색', color: '#FF69B4' }     // 칠색 (핑크)
    ];
    
    headers.forEach((header, index) => {
      const th = document.createElement('th');
      th.textContent = header.text;
      th.style.cssText = `
        padding: 8px 4px;
        background: ${header.color};
        border: 1px solid #ddd;
        text-align: center;
        font-weight: bold;
        color: #222;
        font-size: 12px;
        word-wrap: break-word;
        overflow-wrap: break-word;
        ${index === 0 ? 'width: 25%;' : 'width: 18.75%;'}
      `;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // 본문
    const tbody = document.createElement('tbody');
    
    data.forEach((item, index) => {
      const row = document.createElement('tr');
      
      // 항목명
      const typeCell = document.createElement('td');
      typeCell.textContent = item.type;
      typeCell.style.cssText = `
        padding: 8px 4px;
        border: 1px solid #ddd;
        font-weight: bold;
        background: #fafafa;
        font-size: 12px;
        word-wrap: break-word;
        overflow-wrap: break-word;
        color: #222;
      `;
      row.appendChild(typeCell);
      
      // 등급별 수치 (파스텔톤 배경색)
      const gradeColors = {
        bronze: '#F5E6D3',    // 동색 파스텔 (연한 브론즈)
        silver: '#F0F0F0',    // 은색 파스텔 (연한 그레이)
        gold: '#FFF8DC',      // 금색 파스텔 (연한 골드)
        rainbow: '#FFE4E1'    // 칠색 파스텔 (연한 핑크)
      };
      
      ['bronze', 'silver', 'gold', 'rainbow'].forEach(grade => {
        const cell = document.createElement('td');
        cell.textContent = item[grade] || '-';
        cell.style.cssText = `
          padding: 8px 4px;
          border: 1px solid #ddd;
          text-align: center;
          background: ${item[grade] ? gradeColors[grade] : '#f9f9f9'};
          font-size: 12px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          color: #222;
        `;
        row.appendChild(cell);
      });
      
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    // 기존 내용 완전히 제거 후 새 테이블 추가
    tableContainer.innerHTML = '';
    
    // 테이블을 감싸는 스크롤 컨테이너 생성
    const scrollContainer = document.createElement('div');
    scrollContainer.style.cssText = `
      width: 100%;
      overflow-x: auto;
      overflow-y: auto;
      max-height: 400px;
      margin-top: 20px;
    `;
    
    scrollContainer.appendChild(table);
    tableContainer.appendChild(scrollContainer);
  }

  // 데이터 없음 메시지 표시
  displayNoDataMessage(modal, type) {
    const tableContainer = modal.querySelector('#enchant-table-container');
    
    const noDataDiv = document.createElement('div');
    noDataDiv.style.cssText = `
      text-align: center;
      padding: 60px 20px;
      color: #666;
      font-size: 16px;
    `;
    
    const typeNames = {
      'weapon': '무기',
      'armor': '방어구', 
      'accessory': '장신구'
    };
    
    noDataDiv.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
      <div style="font-weight: bold; margin-bottom: 10px;">데이터 없음</div>
      <div>${typeNames[type] || type} 해방 정보가 아직 준비되지 않았습니다.</div>
      <div style="margin-top: 10px; font-size: 14px; color: #999;">
        구글 시트에 데이터가 추가되면 자동으로 표시됩니다.
      </div>
    `;
    
    // 기존 내용 제거 후 새 메시지 추가
    tableContainer.innerHTML = '';
    tableContainer.appendChild(noDataDiv);
  }

  // 해방 정보 모달 닫기
  closeEnchantInfoModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  }

  // 어빌리티 정보 모달
  async openAbilityInfoModal() {
    // 기존 모달 제거
    const existingModal = document.querySelector('.ability-info-modal');
    if (existingModal) existingModal.remove();

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'ability-info-modal user-search-modal';
    const content = document.createElement('div');
    content.className = 'user-search-content';
    content.style.maxWidth = '800px';
    content.style.maxHeight = '80vh';

    // 헤더
    const header = document.createElement('div');
    header.className = 'user-search-header';
    const title = document.createElement('h3');
    title.textContent = '어빌리티 정보';
    const closeButton = document.createElement('button');
    closeButton.className = 'user-search-close';
    closeButton.textContent = '×';
    closeButton.onclick = () => modal.remove();
    header.appendChild(title);
    header.appendChild(closeButton);

    // 검색창
    const searchSection = document.createElement('div');
    searchSection.style.display = 'flex';
    searchSection.style.gap = '8px';
    searchSection.style.margin = '16px 0 8px 0';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '어빌리티명/효과/무기 타입 효과 검색...';
    searchInput.className = 'search-input';
    searchInput.style.flex = '1';
    searchSection.appendChild(searchInput);

    // 직업 토글 버튼
    const jobToggleSection = document.createElement('div');
    jobToggleSection.style.display = 'flex';
    jobToggleSection.style.flexWrap = 'wrap';
    jobToggleSection.style.gap = '6px';
    jobToggleSection.style.marginBottom = '8px';

    // 표 컨테이너
    const tableContainer = document.createElement('div');
    tableContainer.style.overflow = 'auto';
    tableContainer.style.maxHeight = '50vh';
    tableContainer.style.marginTop = '8px';
    tableContainer.style.overflowX = 'auto';
    tableContainer.style.overflowY = 'auto';

    // 로딩 표시
    const loadingDiv = document.createElement('div');
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.padding = '40px';
    loadingDiv.style.color = '#666';
    loadingDiv.innerHTML = '데이터를 불러오는 중...';
    tableContainer.appendChild(loadingDiv);

    // 조립
    content.appendChild(header);
    content.appendChild(searchSection);
    content.appendChild(jobToggleSection);
    content.appendChild(tableContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);
    setTimeout(() => { modal.classList.add('show'); }, 10);

    // ESC, 외부 클릭 닫기
    const handleEsc = (e) => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', handleEsc); } };
    document.addEventListener('keydown', handleEsc);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    // background.js에서 어빌리티 정보 데이터 가져오기
    try {
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'FETCH_ABILITY_INFO'
        }, (response) => {
          resolve(response);
        });
      });
      
      if (result && result.success && result.data) {
        const data = result.data;

        // 직업 목록 추출
        const jobs = Array.from(new Set(data.map(row => row['직업'])));
        let selectedJob = '전체';

        // 토글 버튼 생성
        jobToggleSection.innerHTML = '';
        const allBtn = document.createElement('button');
        allBtn.textContent = '전체';
        allBtn.className = 'category-btn main-category active';
        allBtn.onclick = () => { selectedJob = '전체'; renderTable(); updateToggles(); };
        jobToggleSection.appendChild(allBtn);
        jobs.forEach(job => {
          const btn = document.createElement('button');
          btn.textContent = job;
          btn.className = 'category-btn main-category';
          btn.onclick = () => { selectedJob = job; renderTable(); updateToggles(); };
          jobToggleSection.appendChild(btn);
        });
        function updateToggles() {
          jobToggleSection.querySelectorAll('button').forEach(btn => {
            if (btn.textContent === selectedJob) {
              btn.classList.add('active');
              btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              btn.style.color = 'white';
              btn.style.border = 'none';
            } else {
              btn.classList.remove('active');
              btn.style.background = 'white';
              btn.style.color = '#667eea';
              btn.style.border = '2px solid #667eea';
            }
          });
        }

        // 표 렌더링 함수
        function renderTable() {
          tableContainer.innerHTML = '';
          const table = document.createElement('table');
          table.style.cssText = 'width:100%;min-width:800px;border-collapse:collapse;font-size:14px;table-layout:fixed;';
          const thead = document.createElement('thead');
          const tr = document.createElement('tr');
          ['직업','전직','어빌리티명','효과','무기 타입 효과','숙련도'].forEach((h, idx) => {
            const th = document.createElement('th');
            th.textContent = h;
            th.style.cssText = 'padding:6px 2px;background:#f5f5f5;border:1px solid #ddd;text-align:center;font-weight:bold;color:#222;'
              + (idx === 0 ? 'width:56px;min-width:48px;max-width:72px;' : '')
              + (idx === 1 ? 'width:48px;min-width:40px;max-width:56px;' : '')
              + (idx === 5 ? 'width:80px;min-width:70px;max-width:90px;' : '');
            tr.appendChild(th);
          });
          thead.appendChild(tr);
          table.appendChild(thead);
          const tbody = document.createElement('tbody');
          let filtered = data;
          if (selectedJob !== '전체') filtered = filtered.filter(row => row['직업'] === selectedJob);
          const search = searchInput.value.trim().toLowerCase();
          if (search) {
            filtered = filtered.filter(row =>
              row['어빌리티명'].toLowerCase().includes(search) ||
              row['효과'].toLowerCase().includes(search) ||
              row['무기 타입 효과'].toLowerCase().includes(search)
            );
          }
          filtered.forEach(row => {
            const tr = document.createElement('tr');
            ['직업','전직','어빌리티명','효과','무기 타입 효과','숙련도'].forEach((h, idx) => {
              const td = document.createElement('td');
              td.textContent = row[h] || '';
              td.style.cssText = 'padding:5px 2px;border:1px solid #eee;text-align:center;word-break:break-all;color:#222;'
                + (idx === 0 ? 'width:56px;min-width:48px;max-width:72px;' : '')
                + (idx === 1 ? 'width:48px;min-width:40px;max-width:56px;' : '')
                + (idx === 5 ? 'width:80px;min-width:70px;max-width:90px;' : '');
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          tableContainer.appendChild(table);
        }
        renderTable();
        updateToggles();
        searchInput.oninput = () => renderTable();
      } else {
        // 데이터가 없거나 오류인 경우
        tableContainer.innerHTML = '<div style="color:#f44336;text-align:center;padding:40px;">데이터를 불러오지 못했습니다.</div>';
      }
    } catch (error) {
      console.error('[MenuManager] 어빌리티 정보 데이터 가져오기 실패:', error);
      tableContainer.innerHTML = '<div style="color:#f44336;text-align:center;padding:40px;">데이터를 불러오지 못했습니다.</div>';
    }
  }

  // 프로그램 정보 모달 복원
  async openProgramInfoModal() {
    // 기존 모달 제거
    const existingModal = document.querySelector('.program-info-modal');
    if (existingModal) existingModal.remove();

    // manifest에서 버전 동적 추출
    let version = 'unknown';
    try {
      const manifest = chrome.runtime.getManifest();
      version = manifest.version || 'unknown';
    } catch (e) {}
    showModal(version);

    function showModal(version) {
      const modal = document.createElement('div');
      modal.className = 'program-info-modal user-search-modal';
      const content = document.createElement('div');
      content.className = 'user-search-content';
      // 헤더
      const header = document.createElement('div');
      header.className = 'user-search-header';
      const title = document.createElement('h3');
      title.textContent = '프로그램 정보';
      const closeButton = document.createElement('button');
      closeButton.className = 'user-search-close';
      closeButton.textContent = '×';
      closeButton.onclick = () => modal.remove();
      header.appendChild(title);
      header.appendChild(closeButton);
      // 본문
      const infoDiv = document.createElement('div');
      infoDiv.style.margin = '24px 0 12px 0';
      infoDiv.style.fontSize = '16px';
      infoDiv.style.color = '#374151';
      infoDiv.innerHTML =
        `<b>버전:</b> v${version}<br><br>` +
        `본 프로그램은 <b>유저 비공식 확장</b>입니다.<br><br>` +
        `문의: 인게임 메일 <b>도히님</b>` +
        `<hr style='margin:18px 0 10px 0; border:0; border-top:1.5px solid #e5e7eb;'>`;

      // 기여자 목록 표 추가
      const contributorTable = document.createElement('table');
      contributorTable.style.cssText = 'width:100%;margin-top:24px;border-collapse:collapse;font-size:14px;';
      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      ['항목','닉네임','url'].forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        th.style.cssText = 'padding:6px 2px;background:#f5f5f5;border:1px solid #ddd;text-align:center;font-weight:bold;color:#222;';
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      contributorTable.appendChild(thead);
      const tbody = document.createElement('tbody');
      // 예시 데이터 (추후 추가/수정 가능)
      [
        { role: '장비해방', nick: '수고하세요', url: 'https://docs.google.com/spreadsheets/d/15E8F_qSxKPMqsL_ulfwm739PTjBLO64qN8jWuDZe7ng/edit?gid=468768394#gid=468768394', urlinfo: '해방정보 시트' },
        { role: '어빌리티', nick: '먹물', url: 'https://lanis.me/board/view/6841a029abffb8c821c43e85', urlinfo: '어빌리티 게시글' },
        { role: '위키운영', nick: '크루즈', url: 'https://laniswiki.lovestoblog.com/', urlinfo: '위키 바로가기' }
      ].forEach(row => {
        const tr = document.createElement('tr');
        [row.role, row.nick, row.url].forEach((v, i) => {
          const td = document.createElement('td');
          if (i === 1) { // 닉네임
            const a = document.createElement('a');
            a.href = `https://lanis.me/users/${encodeURIComponent(v)}`;
            a.textContent = v;
            a.style.color = '#3366cc';
            td.appendChild(a);
          } else if (i === 2) { // url
            const a = document.createElement('a');
            a.href = v;
            a.textContent = row.urlinfo || '바로가기';
            a.style.color = '#3366cc';
            a.style.textDecoration = 'underline';
            td.appendChild(a);
          } else {
            td.textContent = v;
          }
          td.style.cssText = 'padding:5px 2px;border:1px solid #eee;text-align:center;word-break:break-all;color:#222;max-width:120px;';
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      contributorTable.appendChild(tbody);
      content.appendChild(header);
      content.appendChild(infoDiv);
      // 3단행 꾸밈줄: 1,3줄 밧줄5개(무지개), 2줄 밧줄2+왕관+기여자+왕관+밧줄2(중앙정렬, 줄바꿈)
      const decoDiv = document.createElement('div');
      decoDiv.style.textAlign = 'center';
      decoDiv.style.margin = '16px 0 8px 0';
      decoDiv.style.fontWeight = 'bold';
      decoDiv.style.letterSpacing = '2px';
      decoDiv.innerHTML = `
        <span style=\"background:linear-gradient(90deg,red,orange,yellow,green,blue,indigo,violet);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:18px;\">〰 〰 〰 〰 〰 〰 〰 〰 〰</span><br>
        <span style=\"background:linear-gradient(90deg,red,orange,yellow,green,blue,indigo,violet);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:18px;\">〰 〰</span>
        <span style=\"font-size:18px;\">👑</span>
        <span style=\"font-size:15px;vertical-align:middle;color:#222;\">기여자</span>
        <span style=\"font-size:18px;\">👑</span>
        <span style=\"background:linear-gradient(90deg,red,orange,yellow,green,blue,indigo,violet);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:18px;\">〰 〰</span><br>
        <span style=\"background:linear-gradient(90deg,red,orange,yellow,green,blue,indigo,violet);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:18px;\">〰 〰 〰 〰 〰 〰 〰 〰 〰</span>
      `;
      content.appendChild(decoDiv); // 표 위에 꾸밈줄 추가
      content.appendChild(contributorTable);
      modal.appendChild(content);
      document.body.appendChild(modal);
      setTimeout(() => { modal.classList.add('show'); }, 10);
      // ESC, 외부 클릭 닫기
      const handleEsc = (e) => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', handleEsc); } };
      document.addEventListener('keydown', handleEsc);
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
  }

  // [신규] 아이템 시세 조회 모달 (기본 UI만, 차트/데이터 연동은 이후 단계)
  openItemPriceModal() {
    // 기존 모달 제거
    const existing = document.querySelector('.item-price-modal');
    if (existing) existing.remove();
    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'item-price-modal user-search-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.style.zIndex = '10020';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    // 컨텐츠 래퍼 (flex column, 80% 크기)
    const content = document.createElement('div');
    content.className = 'user-search-content';
    content.style.width = '80vw';
    content.style.height = '80vh';
    content.style.maxWidth = '1200px';
    content.style.maxHeight = '900px';
    content.style.minWidth = '320px';
    content.style.minHeight = '320px';
    content.style.background = '#fff';
    content.style.borderRadius = '16px';
    content.style.boxShadow = '0 4px 32px rgba(0,0,0,0.18)';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.overflow = 'hidden';
    // 헤더
    const header = document.createElement('div');
    header.className = 'user-search-header';
    header.style.flex = '0 0 auto';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.padding = '18px 24px 8px 24px';
    const title = document.createElement('h3');
    title.textContent = '아이템 시세 조회';
    title.style.margin = '0';
    title.style.fontSize = '1.5rem';
    const closeButton = document.createElement('button');
    closeButton.className = 'user-search-close';
    closeButton.textContent = '×';
    closeButton.style.fontSize = '2rem';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => modal.remove();
    header.appendChild(title);
    header.appendChild(closeButton);
    // 검색창
    const searchSection = document.createElement('div');
    searchSection.style.display = 'flex';
    searchSection.style.gap = '8px';
    searchSection.style.margin = '0 0 8px 0';
    searchSection.style.flex = '0 0 auto';
    searchSection.style.padding = '0 24px';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '아이템명 입력...';
    searchInput.className = 'search-input';
    searchInput.style.flex = '1';
    searchInput.style.fontSize = '1.1rem';
    searchInput.style.padding = '8px 12px';
    searchInput.style.borderRadius = '8px';
    searchInput.style.border = '1px solid #ccc';
    const searchBtn = document.createElement('button');
    searchBtn.textContent = '검색';
    searchBtn.className = 'search-btn';
    searchBtn.style.fontSize = '1.1rem';
    searchBtn.style.padding = '8px 18px';
    searchBtn.style.borderRadius = '8px';
    searchBtn.style.border = 'none';
    searchBtn.style.background = '#667eea';
    searchBtn.style.color = '#fff';
    searchBtn.style.cursor = 'pointer';
    // 차트/결과 영역 (flex-grow)
    const chartDiv = document.createElement('div');
    chartDiv.style.flex = '1 1 0';
    chartDiv.style.display = 'flex';
    chartDiv.style.flexDirection = 'column';
    chartDiv.style.justifyContent = 'stretch';
    chartDiv.style.alignItems = 'stretch';
    chartDiv.style.background = '#fff';
    chartDiv.style.color = '#888';
    chartDiv.style.padding = '0 0 24px 0';
    chartDiv.textContent = '최대 50회 트레이드의 최근 거래 동향을 확인 가능합니다.\n수량이 여러개일 경우 여러건으로 나뉘어 처리됩니다.';
    chartDiv.id = 'itemPriceChartDiv';
    chartDiv.style.overflow = 'auto';
    chartDiv.style.minHeight = '0';
    chartDiv.style.minWidth = '0';
    // 차트 캔버스(동적 생성)
    let chartCanvas = null;
    let chartInstance = null;

    // 조립 순서: content → header, searchSection, chartDiv
    content.appendChild(header);
    content.appendChild(searchSection);
    content.appendChild(chartDiv);
    searchSection.appendChild(searchInput);
    searchSection.appendChild(searchBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // 검색 함수
    const handleSearch = async () => {
      const itemName = searchInput.value.trim();
      if (!itemName) {
        chartDiv.textContent = '아이템명을 입력해주세요.';
        chartDiv.style.color = '#f44336';
        return;
      }
      
      chartDiv.textContent = '데이터 로딩 중...';
      chartDiv.style.color = '#374151';
      
      // 구글 시트 fetch (CSV) - 두 개의 다른 시트 사용
      try {
        // 기존 데이터 (A,B,C열 형식) - gid=439005150
        const oldSheetUrl = 'https://docs.google.com/spreadsheets/d/1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo/gviz/tq?tqx=out:csv&gid=439005150';
        const oldRes = await fetch(oldSheetUrl);
        if (!oldRes.ok) throw new Error('기존 시트 데이터 요청 실패');
        const oldCsv = await oldRes.text();
        
        // 새로운 데이터 (A열 세로형 형식) - gid=1489625214
        const newSheetUrl = 'https://docs.google.com/spreadsheets/d/1R27XF4SHjvYeXVkk0wD_3XsAxo9DDF7Mp0dr3ljmXFo/gviz/tq?tqx=out:csv&gid=1489625214';
        const newRes = await fetch(newSheetUrl);
        if (!newRes.ok) throw new Error('새로운 시트 데이터 요청 실패');
        const newCsv = await newRes.text();
        
        // CSV 파싱 함수
        const parseCSV = (csv) => {
          return csv.split('\n').map(line => {
          // 쉼표가 포함된 필드를 올바르게 파싱
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim()); // 마지막 필드
          return result;
        });
        };
        
        // 기존 데이터 파싱 (A,B,C열 형식)
        const oldRows = parseCSV(oldCsv);
        const priceData = this.parsePriceData(oldRows, itemName);
        
        // 새로운 데이터 파싱 (A열 세로형 형식)
        const newRows = parseCSV(newCsv);
        const tradeData = this.parseTradeData(newRows, itemName);
        
        // 두 데이터 합치기 (시간순으로 통합)
        const allPrices = [];
        const allLabels = [];
        
        // 새로운 거래 데이터가 더 최신이므로 먼저 추가
        allPrices.push(...tradeData.prices);
        allLabels.push(...tradeData.labels);
        
        // 기존 시세 데이터 추가
        allPrices.push(...priceData.prices);
        allLabels.push(...priceData.labels);
        
        // 전체 데이터를 시간순으로 재정렬 (최신이 위로)
        const combinedData = allPrices.map((price, index) => ({
          price,
          label: allLabels[index],
          source: index < tradeData.prices.length ? 'trade' : 'price'
        }));
        
        // 시간순 정렬 (최신이 위로)
        combinedData.sort((a, b) => {
          // 새로운 거래 데이터가 더 최신이므로 우선순위
          if (a.source === 'trade' && b.source === 'price') return -1;
          if (a.source === 'price' && b.source === 'trade') return 1;
          return 0; // 같은 소스 내에서는 기존 순서 유지
        });
        
        // 정렬된 데이터 추출
        const finalPrices = combinedData.map(item => item.price);
        const finalLabels = combinedData.map((item, index) => {
          if (index === 0) return '최근 거래';
          return `${index}건 이전 거래`;
        });
        

        
        if (finalPrices.length === 0) {
          chartDiv.textContent = '해당 아이템의 시세 데이터가 없습니다.';
          chartDiv.style.color = '#f44336';
          return;
        }
        
        // 데이터를 시간순으로 뒤집기 (왼쪽이 오래된 거래, 오른쪽이 최신 거래)
        const timeOrderedPrices = [...finalPrices].reverse();
        const timeOrderedLabels = [...finalLabels].reverse();
        
        // 최근 판매가(가장 최신 가격)
        const recentPrice = finalPrices.length > 0 ? finalPrices[0] : null;
        // 평균 판매가
        const avgPrice = finalPrices.length > 0 ? Math.round(finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length) : null;
        
        // 차트 영역 위에 텍스트 표시
        const infoDiv = document.createElement('div');
        infoDiv.style.textAlign = 'center';
        infoDiv.style.fontSize = '15px';
        infoDiv.style.fontWeight = 'bold';
        infoDiv.style.marginBottom = '10px';
        infoDiv.style.flex = '0 0 auto';
        
                // 마지막 데이터 추가 정보
        let dataSourceInfo = '';
        
        try {
          // 모든 거래 데이터 파싱 (example.js 방식)
          const allTradeItems = [];
          
          for (let i = 0; i < newRows.length; i++) {
            const row = newRows[i];
            if (row.length === 0) continue;
            
            const cellA = (row[0] || '').replace(/"/g, '').trim();
            
            // 새로운 형식: "거래 완료" 패턴 찾기
            if (cellA.includes('거래 완료')) {
              // 시간 정보 추출 (i+1 행)
              let timeStr = '';
              if (i + 1 < newRows.length) {
                timeStr = (newRows[i + 1][0] || '').replace(/"/g, '').trim();
              }
              
              // 아이템 정보 행 찾기 (i+2)
              if (i + 2 < newRows.length) {
                const itemRow = newRows[i + 2];
                if (itemRow.length > 0) {
                  const itemText = (itemRow[0] || '').replace(/"/g, '').trim();
                  
                  // 가격 추출
                  const priceMatch = itemText.match(/(\d{1,3}(?:,\d{3})*)\s*Gold/);
                  if (priceMatch) {
                    const priceStr = priceMatch[1].replace(/,/g, '');
                    const price = parseInt(priceStr, 10);
                    
                    // 수량 처리
                    let count = 1;
                    const countMatch = itemText.match(/(\d+)개가/);
                    if (countMatch) {
                      count = parseInt(countMatch[1], 10);
                    }
                    
                    // 아이템명 추출
                    const itemMatch = itemText.match(/(.+?)(?:\s+\d+개가|\s+가\s+거래소에서|\s+가\s+)/);
                    const itemName = itemMatch ? itemMatch[1].trim() : '';
                    
                    // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효)
                    if (price && price > 90000 && price < 1000000000 && itemName) {
                      // 시간 정보를 Date 객체로 변환
                      let timestamp = new Date(0);
                      if (timeStr) {
                        const timeMatch = timeStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/);
                        if (timeMatch) {
                          const [, year, month, day, ampm, hour, minute, second] = timeMatch;
                          let hour24 = parseInt(hour, 10);
                          if (ampm === '오후' && hour24 !== 12) hour24 += 12;
                          if (ampm === '오전' && hour24 === 12) hour24 = 0;
                          
                          timestamp = new Date(
                            parseInt(year, 10),
                            parseInt(month, 10) - 1,
                            parseInt(day, 10),
                            hour24,
                            parseInt(minute, 10),
                            parseInt(second, 10)
                          );
                        }
                      }
                      
                      allTradeItems.push({
                        timestamp: timestamp,
                        item: itemName,
                        count: count,
                        price: price,
                        originalText: itemText,
                        format: 'new'
                      });
                    }
                  }
                }
              }
            }
          }
          
          if (allTradeItems.length > 0) {
            const itemsWithTimestamp = allTradeItems.filter(item => 
              item.timestamp && item.timestamp !== new Date(0)
            );
            
            if (itemsWithTimestamp.length > 0) {
              const latestItem = itemsWithTimestamp.reduce((latest, current) => {
                return current.timestamp > latest.timestamp ? current : latest;
              });
              
              const latestDate = latestItem.timestamp.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
              
              dataSourceInfo = `<div style='color:#888;font-size:12px;font-weight:normal;margin-bottom:2px;'>마지막 데이터 추가 ${latestDate} ${latestItem.item} ${latestItem.count}개 ${latestItem.price.toLocaleString()}G</div>`;
            }
          }
        } catch (error) {
          console.warn('마지막 데이터 정보 추출 중 오류:', error);
        }
        
        infoDiv.innerHTML =
          dataSourceInfo +
          `<span style='color:#374151; font-size:1.15em;'>${itemName}</span><br>
          <span style='color:#374151;'>최근 판매가 :</span> <span style='color:#667eea;'>${recentPrice ? recentPrice.toLocaleString() + ' G' : '-'}</span><br>
          <span style='color:#374151;'>평균 판매가 :</span> <span style='color:#764ba2;'>${avgPrice ? avgPrice.toLocaleString() + ' G' : '-'}</span>`;
        
        // 차트 영역 초기화 및 infoDiv 추가
        chartDiv.innerHTML = '';
        chartDiv.appendChild(infoDiv);
        chartCanvas = document.createElement('canvas');
        chartCanvas.style.width = '100%';
        chartCanvas.style.height = '100%';
        chartCanvas.style.maxWidth = '100%';
        chartCanvas.style.maxHeight = '100%';
        chartCanvas.style.display = 'block';
        chartCanvas.style.flex = '1 1 0';
        chartCanvas.style.minHeight = '0';
        chartCanvas.style.minWidth = '0';
        chartCanvas.style.margin = '0 auto';
        chartDiv.appendChild(chartCanvas);
        
        // Chart.js 동적 import
        const Chart = (await import('chart.js/auto')).default;
        if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
        chartInstance = new Chart(chartCanvas.getContext('2d'), {
          type: 'line',
          data: {
            labels: timeOrderedLabels,
            datasets: [{
              label: itemName + ' 시세',
              data: timeOrderedPrices,
              borderColor: '#667eea',
              backgroundColor: 'rgba(102,126,234,0.1)',
              pointRadius: 3,
              pointBackgroundColor: '#764ba2',
              fill: false,
              tension: 0.2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true },
              title: { display: false }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false },
            scales: {
              x: { title: { display: true, text: '최근 거래 순서' } },
              y: { title: { display: true, text: '가격(G)' }, beginAtZero: false }
            }
          }
        });
        

      } catch (err) {
        console.error('데이터 로드/파싱 오류:', err);
        chartDiv.textContent = '데이터 로드/파싱 오류: ' + (err.message || err);
        chartDiv.style.color = '#f44336';
      }
    };
    searchBtn.onclick = handleSearch;
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });
    // 조립
    content.appendChild(header);
    content.appendChild(searchSection);
    content.appendChild(chartDiv);
    searchSection.appendChild(searchInput);
    searchSection.appendChild(searchBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
    // ESC, 외부 클릭 닫기
    const handleEsc = (e) => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', handleEsc); } };
    document.addEventListener('keydown', handleEsc);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    // [중요] 기존 모달들과 동일하게 .show 클래스 추가
    setTimeout(() => { modal.classList.add('show'); }, 10);
  }

  // 새로운 거래 데이터 파싱 (A열 데이터) - 최신 데이터
  parseTradeData(rows, itemName) {
    const tradeItems = [];
    
    // 데이터 형식 판별 및 파싱
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0) continue;
      
      const cellA = (row[0] || '').replace(/"/g, '').trim();
      
      // 새로운 형식: "거래 완료" 패턴 찾기
      if (cellA.includes('거래 완료')) {
        // 시간 정보 추출 (i+1 행)
        let timeStr = '';
        if (i + 1 < rows.length) {
          timeStr = (rows[i + 1][0] || '').replace(/"/g, '').trim();
        }
        
        // 아이템 정보 찾기 (i+2 행) - 실제 데이터에는 빈 행이 없음
        let itemText = '';
        if (i + 2 < rows.length) {
          const itemRow = rows[i + 2];
          if (itemRow.length > 0) {
            itemText = (itemRow[0] || '').replace(/"/g, '').trim();
            
            // 시간 정보가 아닌 실제 아이템 정보인지 확인
            if (itemText && !itemText.match(/^\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.\s*(오전|오후)/)) {
              // 아이템명 매칭
              if (itemText.includes(itemName)) {
                // 가격 추출
                const priceMatch = itemText.match(/(\d{1,3}(?:,\d{3})*)\s*Gold/);
                if (priceMatch) {
                  const priceStr = priceMatch[1].replace(/,/g, '');
                  const price = parseInt(priceStr, 10);
                  
                  // 수량 처리
                  let count = 1;
                  const countMatch = itemText.match(/(\d+)개가/);
                  if (countMatch) {
                    count = parseInt(countMatch[1], 10);
                  }
                  
                  // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효)
                  if (price && price > 90000 && price < 1000000000) {
                    const unitPrice = Math.round(price / count);
                    
                    // 시간 정보를 Date 객체로 변환
                    let timestamp = new Date(0); // 기본값
                    if (timeStr) {
                      // "2025. 7. 28. 오후 2:10:22" 형식을 파싱
                      const timeMatch = timeStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/);
                      if (timeMatch) {
                        const [, year, month, day, ampm, hour, minute, second] = timeMatch;
                        let hour24 = parseInt(hour, 10);
                        if (ampm === '오후' && hour24 !== 12) hour24 += 12;
                        if (ampm === '오전' && hour24 === 12) hour24 = 0;
                        
                        timestamp = new Date(
                          parseInt(year, 10),
                          parseInt(month, 10) - 1, // 월은 0부터 시작
                          parseInt(day, 10),
                          hour24,
                          parseInt(minute, 10),
                          parseInt(second, 10)
                        );
                      }
                    }
                    
                    // 거래 아이템 정보 저장
                    for (let j = 0; j < count; j++) {
                      tradeItems.push({
                        price: unitPrice,
                        timestamp: timestamp,
                        originalText: itemText,
                        format: 'new'
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
      // 기존 형식: 순번, 아이템, 가격 형식
      else if (cellA.match(/^\d+$/) && row.length >= 3) {
        const sequence = parseInt(cellA, 10);
        const itemText = (row[1] || '').replace(/"/g, '').trim();
        const priceText = (row[2] || '').replace(/"/g, '').trim();
        
        // 가격 추출
        const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*)/);
        if (priceMatch) {
          const priceStr = priceMatch[1].replace(/,/g, '');
          const price = parseInt(priceStr, 10);
          
          // 수량 처리
          let count = 1;
          const countMatch = itemText.match(/x\s*(\d+)/);
          if (countMatch) {
            count = parseInt(countMatch[1], 10);
          }
          
          // 아이템명 추출
          const itemName = itemText.replace(/\s*x\s*\d+$/, '').trim();
          
          // 아이템명 매칭
          if (itemName.includes(itemName)) {
            // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효)
            if (price && price > 90000 && price < 1000000000) {
              const unitPrice = Math.round(price / count);
              
              // 거래 아이템 정보 저장
              for (let j = 0; j < count; j++) {
                tradeItems.push({
                  price: unitPrice,
                  sequence: sequence,
                  originalText: `${sequence}\t${itemText}\t${priceText}`,
                  format: 'old'
                });
              }
            }
          }
        }
      }
    }
    
    // 시간순으로 정렬 (최신이 위로)
    tradeItems.sort((a, b) => {
      if (a.format === 'new' && b.format === 'old') return -1; // 새로운 형식이 우선
      if (a.format === 'old' && b.format === 'new') return 1;
      
      if (a.format === 'new') {
        return b.timestamp - a.timestamp;
      } else {
        // 기존 형식은 순번 역순 (큰 순번이 최신)
        return (b.sequence || 0) - (a.sequence || 0);
      }
    });
    
    // 가격과 라벨 추출
    const prices = tradeItems.map(item => item.price);
    const labels = tradeItems.map((item, index) => {
      if (index === 0) return '최근 거래';
      return `${index}건 이전 거래`;
    });
    
    return { prices, labels };
  }

  // 기존 시세 데이터 파싱 (B, C열 데이터)
  parsePriceData(rows, itemName) {
    const prices = [];
    const labels = [];
    
    // 헤더 인덱스 파악
    const header = rows[0].map(h => h.trim());
    const idxSequence = header.findIndex(h => h.includes('순번'));
    const idxName = header.findIndex(h => h.includes('아이템'));
    const idxPrice = header.findIndex(h => h.includes('가격'));
    
    if (idxName === -1 || idxPrice === -1) {
      return { prices: [], labels: [] };
    }
    
    // 필터링
    const filtered = rows.slice(1).filter(r => {
      const name = (r[idxName]||'').replace(/"/g,'').trim();
      const baseName = name.replace(/ x \d+$/, '').trim();
      return baseName === itemName;
    });
    
    if (filtered.length === 0) {
      return { prices: [], labels: [] };
    }
    
    // 순번 기준으로 최신순 정렬 (순번이 클수록 최근)
    if (idxSequence !== -1) {
      filtered.sort((a, b) => {
        const seqA = parseInt((a[idxSequence] || '0').replace(/"/g, ''), 10) || 0;
        const seqB = parseInt((b[idxSequence] || '0').replace(/"/g, ''), 10) || 0;
        return seqB - seqA; // 내림차순 (큰 순번이 위로 - 최신 거래가 위로)
      });
    } else {
      // 순번 컬럼이 없으면 기존 방식 사용
      filtered.reverse();
    }
    
    // 최대 50건
    const dataN = filtered.slice(0, 50);
    
    // robust 가격 파싱 및 수량 처리
    dataN.forEach(row => {
      let name = (row[idxName]||'').replace(/"/g,'').trim();
      let count = 1;
      const match = name.match(/ x (\d+)$/);
      if (match) count = parseInt(match[1], 10) || 1;
      
      // 가격 파싱
      let priceRaw = (row[idxPrice] || '').replace(/"/g, '').replace(/[^\d]/g, '');
      let price = parseInt(priceRaw, 10);
      
      // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효)
      if (price && price > 90000 && price < 1000000000) {
        if (count > 1) price = Math.round(price / count);
        for (let i = 0; i < count; i++) {
          prices.push(price);
        }
      }
    });
    
    // 기존 데이터는 순번순으로 정렬되어 있음 (큰 순번이 최신)
    // 라벨 생성 (순번순 - 최신 거래가 위로)
    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        labels.push('최근 거래');
      } else {
        labels.push(`${i}건 이전 거래`);
      }
    }
    
    return { prices, labels };
  }






















}

// ES6 모듈로 export
export default MenuManager; 
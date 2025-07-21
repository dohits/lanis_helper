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

  async loadSettings() {
    try {
      this.settings = await utils.SettingsManager.getSettings({
        profileLink: true,
        showItemStats: true
      });
    } catch (error) {
      this.settings = { 
        profileLink: true, 
        showItemStats: true 
      };
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
    const container = document.querySelector('.quick-buttons-container');
    if (!mainMenuRow) return;
    const isOpen = mainMenuRow.classList.contains('show');
    if (isOpen) {
      mainMenuRow.classList.remove('show');
      // 메뉴가 닫힐 때 포커스 제거하여 접근성 경고 방지
      if (container) {
        container.setAttribute('aria-hidden', 'true');
        // 포커스된 요소가 있다면 포커스 제거
        const focusedElement = container.querySelector(':focus');
        if (focusedElement) {
          focusedElement.blur();
        }
      }
    } else {
      mainMenuRow.classList.add('show');
      // 메뉴가 열릴 때 aria-hidden 제거
      if (container) {
        container.removeAttribute('aria-hidden');
      }
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
    if (item.id === 'itemGuide') {
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







  createItemGuideSubMenu(container) {
    container.innerHTML = '';
    
    const subMenuConfig = this.menuConfig.mainMenu.itemGuide.subMenu;
    
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
      default:
        console.log('Unknown submenu item:', item.id);
    }
  }

  // 프로그램 정보 모달
  openProgramInfoModal() {
    // 기존 모달 제거
    const existingModal = document.querySelector('.program-info-modal');
    if (existingModal) existingModal.remove();

    // 버전 정보 추출 (manifest.json에서)
    let version = 'unknown';
    try {
      fetch(chrome.runtime.getURL('manifest.json'))
        .then(res => res.json())
        .then(manifest => {
          version = manifest.version || 'unknown';
          showModal(version);
        });
    } catch {
      showModal(version);
    }

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
        `문의: 인게임 메일 <b>도히님</b>`;
      // 조립
      content.appendChild(header);
      content.appendChild(infoDiv);
      modal.appendChild(content);
      document.body.appendChild(modal);
      setTimeout(() => { modal.classList.add('show'); }, 10);
      // ESC, 외부 클릭 닫기
      const handleEsc = (e) => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', handleEsc); } };
      document.addEventListener('keydown', handleEsc);
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
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
      const powerRange = (item.power_min !== null && item.power_min !== undefined && item.power_max !== null && item.power_max !== undefined) ? `${item.power_min}-${item.power_max}` : 'N/A';
      const weightRange = (item.weight_min !== null && item.weight_min !== undefined && item.weight_max !== null && item.weight_max !== undefined) ? `${item.weight_min}-${item.weight_max}` : 'N/A';
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
    input.maxLength = 50;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'user-search-error';
    errorDiv.textContent = '사용자명은 영문, 숫자, 한글, 언더스코어(_), 하이픈(-)만 사용 가능합니다.';
    
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
    const isValid = /^[a-zA-Z0-9가-힣_-]+$/.test(value);
    
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
      this.showUserSearchError(modal, '사용자명을 입력해주세요.');
      return;
    }

    if (!/^[a-zA-Z0-9가-힣_-]+$/.test(username)) {
      this.showUserSearchError(modal, '사용자명은 영문, 숫자, 한글, 언더스코어(_), 하이픈(-)만 사용 가능합니다.');
      return;
    }
    
    if (username.length > 50) {
      this.showUserSearchError(modal, '사용자명은 50자를 초과할 수 없습니다.');
      return;
    }
    
    // XSS 방지를 위한 추가 검증
    const sanitizedUsername = this.sanitizeUsername(username);
    if (sanitizedUsername !== username) {
      this.showUserSearchError(modal, '잘못된 사용자명입니다.');
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
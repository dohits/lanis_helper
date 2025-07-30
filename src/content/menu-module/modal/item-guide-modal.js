import BaseModal from './base-modal.js';

// 아이템 도감 모달
class ItemGuideModal extends BaseModal {
  constructor() {
    super({
      id: 'itemGuideModal',
      title: '아이템 도감',
      className: 'item-guide-modal',
      contentClassName: 'item-guide-content',
      maxWidth: '900px',
      maxHeight: '85vh',
      width: '90vw',
      height: '85vh'
    });
    
    this.items = [];
    this.filteredItems = [];
    this.currentMainCategory = '';
    this.currentSubCategory = '';
    this.selectedAttributes = [];
  }

  // 모달 열기
  open() {
    super.open();
    this.createContent();
    this.loadAndDisplayItems();
  }

  // 콘텐츠 생성
  createContent() {
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 16px;
    `;

    // 필터 섹션 (한 줄에 3개 배치)
    const filterSection = this.createFilterSection();
    
    // 아이템 목록 섹션
    const listSection = this.createListSection();
    
    // 푸터 섹션
    const footerSection = this.createFooterSection();

    content.appendChild(filterSection);
    content.appendChild(listSection);
    content.appendChild(footerSection);

    this.setContent(content);
  }

  // 필터 섹션 생성 (한 줄에 3개 배치)
  createFilterSection() {
    const filterSection = document.createElement('div');
    filterSection.className = 'filter-section';
    filterSection.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    // 필터 헤더들 (한 줄에 3개)
    const filterHeaders = document.createElement('div');
    filterHeaders.className = 'filter-headers';
    filterHeaders.style.cssText = `
      display: flex;
      gap: 8px;
    `;

    // 검색 헤더
    const searchHeader = this.createFilterHeader('검색', 'search');
    
    // 속성 필터 헤더
    const attributeHeader = this.createFilterHeader('속성', 'attribute');
    
    // 카테고리 필터 헤더
    const categoryHeader = this.createFilterHeader('장비', 'category');

    filterHeaders.appendChild(searchHeader);
    filterHeaders.appendChild(attributeHeader);
    filterHeaders.appendChild(categoryHeader);

    // 공유 컨테이너 (하나만 열림)
    const sharedContainer = document.createElement('div');
    sharedContainer.className = 'shared-container';
    sharedContainer.style.cssText = `
      display: none;
      padding: 12px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0 0 8px 8px;
      margin-top: -2px;
    `;

    // 검색 컨텐츠
    const searchContent = this.createSearchContent();
    
    // 속성 필터 컨텐츠
    const attributeContent = this.createAttributeContent();
    
    // 카테고리 필터 컨텐츠
    const categoryContent = this.createCategoryContent();

    // 현재 열린 필터 추적
    let currentOpenFilter = null;

    // 필터 토글 함수
    const toggleFilter = (filterType, header, content) => {
      if (currentOpenFilter === filterType) {
        // 같은 필터 클릭 시 닫기
        sharedContainer.style.display = 'none';
        header.style.borderRadius = '8px';
        header.querySelector('.filter-toggle').style.transform = 'rotate(0deg)';
        currentOpenFilter = null;
      } else {
        // 다른 필터 클릭 시 기존 닫고 새로 열기
        if (currentOpenFilter) {
          const prevHeader = filterHeaders.querySelector(`[data-filter="${currentOpenFilter}"]`);
          const prevToggle = prevHeader.querySelector('.filter-toggle');
          prevHeader.style.borderRadius = '8px';
          prevToggle.style.transform = 'rotate(0deg)';
        }
        
        sharedContainer.innerHTML = '';
        sharedContainer.appendChild(content);
        sharedContainer.style.display = 'block';
        header.style.borderRadius = '8px 8px 0 0';
        header.querySelector('.filter-toggle').style.transform = 'rotate(180deg)';
        currentOpenFilter = filterType;
      }
    };

    // 이벤트 리스너 추가
    searchHeader.addEventListener('click', () => toggleFilter('search', searchHeader, searchContent));
    attributeHeader.addEventListener('click', () => toggleFilter('attribute', attributeHeader, attributeContent));
    categoryHeader.addEventListener('click', () => toggleFilter('category', categoryHeader, categoryContent));

    filterSection.appendChild(filterHeaders);
    filterSection.appendChild(sharedContainer);

    return filterSection;
  }

  // 필터 헤더 생성 (공통 함수)
  createFilterHeader(title, filterType) {
    const header = document.createElement('div');
    header.className = 'filter-header';
    header.setAttribute('data-filter', filterType);
    header.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 20px;
    `;
    
    header.addEventListener('mouseenter', () => {
      header.style.background = '#f3f4f6';
    });
    header.addEventListener('mouseleave', () => {
      header.style.background = '#f9fafb';
    });

    const titleDiv = document.createElement('div');
    titleDiv.textContent = title;
    titleDiv.style.cssText = `
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    `;

    const toggle = document.createElement('span');
    toggle.className = 'filter-toggle';
    toggle.textContent = '▼';
    toggle.style.cssText = `
      font-size: 12px;
      color: #6b7280;
      transition: transform 0.2s ease;
    `;

    header.appendChild(titleDiv);
    header.appendChild(toggle);

    return header;
  }

  // 검색 컨텐츠 생성
  createSearchContent() {
    const searchContent = document.createElement('div');
    searchContent.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    const itemSearchInput = document.createElement('input');
    itemSearchInput.type = 'text';
    itemSearchInput.id = 'itemSearchInput';
    itemSearchInput.placeholder = '아이템명 검색...';
    itemSearchInput.className = 'search-input';
    itemSearchInput.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    `;
    itemSearchInput.addEventListener('focus', () => {
      itemSearchInput.style.borderColor = '#667eea';
    });
    itemSearchInput.addEventListener('blur', () => {
      itemSearchInput.style.borderColor = '#d1d5db';
    });
    itemSearchInput.addEventListener('input', () => this.filterItems());

    const abilitySearchInput = document.createElement('input');
    abilitySearchInput.type = 'text';
    abilitySearchInput.id = 'abilitySearchInput';
    abilitySearchInput.placeholder = '어빌리티 검색...';
    abilitySearchInput.className = 'search-input';
    abilitySearchInput.style.cssText = itemSearchInput.style.cssText;
    abilitySearchInput.addEventListener('focus', () => {
      abilitySearchInput.style.borderColor = '#667eea';
    });
    abilitySearchInput.addEventListener('blur', () => {
      abilitySearchInput.style.borderColor = '#d1d5db';
    });
    abilitySearchInput.addEventListener('input', () => this.filterItems());

    searchContent.appendChild(itemSearchInput);
    searchContent.appendChild(abilitySearchInput);

    return searchContent;
  }

  // 속성 필터 컨텐츠 생성
  createAttributeContent() {
    const attributeContent = document.createElement('div');
    attributeContent.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    `;

    const attributes = ['물', '불', '번개', '바람', '별', '빛', '어둠', '무'];
    attributes.forEach(attr => {
      const btn = document.createElement('button');
      btn.className = 'attribute-btn';
      btn.setAttribute('data-attribute', attr);
      btn.textContent = attr;
      btn.style.cssText = `
        margin: 0;
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
        
        const wasActive = btn.classList.contains('active');
        btn.classList.toggle('active');
        
        if (btn.classList.contains('active')) {
          btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          btn.style.color = 'white';
          btn.style.border = 'none';
        } else {
          btn.style.background = 'white';
          btn.style.color = '#667eea';
          btn.style.border = '2px solid #667eea';
        }
        
        console.log('속성 필터 클릭됨:', attr);
        console.log('this.filterItems 호출 시도');
        this.filterItems();
        console.log('this.filterItems 호출 완료');
      });
      
      attributeContent.appendChild(btn);
    });

    return attributeContent;
  }

  // 카테고리 필터 컨텐츠 생성
  createCategoryContent() {
    const categoryContent = document.createElement('div');
    categoryContent.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    `;

    // 메인 카테고리
    const mainCategoryOptions = ['전체', '무기', '방어구', '장신구'];
    mainCategoryOptions.forEach(category => {
      const btn = document.createElement('button');
      btn.className = 'category-btn main-category';
      btn.setAttribute('data-category', category === '전체' ? '' : category);
      btn.textContent = category;
      btn.style.cssText = `
        margin: 0;
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
        console.log('메인 카테고리 클릭됨:', category);
        console.log('this.handleMainCategoryChange 호출 시도');
        this.handleMainCategoryChange(category);
        console.log('this.handleMainCategoryChange 호출 완료');
      });
      
      categoryContent.appendChild(btn);
    });

    // 서브 카테고리 (무기 선택 시에만 표시되도록 별도 처리)
    const subCategories = document.createElement('div');
    subCategories.className = 'sub-categories';
    subCategories.id = 'subCategories';
    subCategories.style.cssText = `
      display: none;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      justify-content: flex-start;
      padding-top: 18px;
    `;

    const subCategoryOptions = ['전체', '검', '도끼', '창', '활', '너클', '지팡이', '나이프', '미확인'];
    subCategoryOptions.forEach(category => {
      const btn = document.createElement('button');
      btn.className = 'category-btn sub-category';
      btn.setAttribute('data-category', category === '전체' ? '' : category);
      btn.textContent = category;
      btn.style.cssText = `
        margin: 0;
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
        console.log('서브 카테고리 클릭됨:', category);
        console.log('this.filterItems 호출 시도');
        this.filterItems();
        console.log('this.filterItems 호출 완료');
      });
      
      subCategories.appendChild(btn);
    });

    categoryContent.appendChild(subCategories);

    return categoryContent;
  }

  // 아이템 목록 섹션 생성
  createListSection() {
    const listSection = document.createElement('div');
    listSection.className = 'item-guide-list';
    listSection.id = 'itemGuideList';
    listSection.style.cssText = `
      flex: 1;
      overflow-y: auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      background: #fafafa;
    `;

    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
      text-align: center;
      color: #666;
      padding: 20px;
    `;
    loadingDiv.textContent = '아이템을 로드하는 중...';

    listSection.appendChild(loadingDiv);

    return listSection;
  }

  // 푸터 섹션 생성
  createFooterSection() {
    const footerSection = document.createElement('div');
    footerSection.className = 'item-guide-footer';
    footerSection.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 8px;
      background: #f9fafb;
      border-radius: 8px;
      font-size: 14px;
      color: #6b7280;
    `;
    
    footerSection.textContent = '총 ';
    
    const countSpan = document.createElement('span');
    countSpan.id = 'itemGuideCount';
    countSpan.textContent = '0';
    countSpan.style.cssText = `
      font-weight: 600;
      color: #667eea;
    `;
    
    const countText = document.createTextNode('개 아이템');
    
    footerSection.appendChild(countSpan);
    footerSection.appendChild(countText);

    return footerSection;
  }

  // 아이템 데이터 로드 및 표시
  async loadAndDisplayItems() {
    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['rareItems'], resolve);
      });

      if (result.rareItems && result.rareItems.length > 0) {
        this.items = result.rareItems;
        this.displayItems(this.items);
      } else {
        const listContainer = document.getElementById('itemGuideList');
        const countElement = document.getElementById('itemGuideCount');
        
        if (listContainer) {
          listContainer.innerHTML = '';
          
          const noItemsDiv = document.createElement('div');
          noItemsDiv.style.cssText = `
            text-align: center;
            color: #666;
            padding: 20px;
          `;
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
        listContainer.innerHTML = '';
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
          text-align: center;
          color: #f44336;
          padding: 20px;
        `;
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

    listContainer.innerHTML = '';
    
    if (!items || items.length === 0) {
      const noItemsDiv = document.createElement('div');
      noItemsDiv.className = 'no-items';
      noItemsDiv.style.cssText = `
        text-align: center;
        color: #666;
        padding: 20px;
      `;
      noItemsDiv.textContent = '아이템 데이터를 불러올 수 없습니다.';
      listContainer.appendChild(noItemsDiv);
      countElement.textContent = '0';
      return;
    }

    const escapeHtml = (text) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    items.forEach((item) => {
      const itemName = escapeHtml(item.name || '알 수 없는 아이템');
      const type = escapeHtml(item.type || '');
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
      
      const itemDiv = document.createElement('div');
      itemDiv.className = 'item-guide-item';
      itemDiv.setAttribute('data-name', itemName.toLowerCase());
      itemDiv.setAttribute('data-main-category', mainCategory.toLowerCase());
      itemDiv.setAttribute('data-sub-category', subCategory.toLowerCase());
      itemDiv.setAttribute('data-abilities', abilities.toLowerCase());
      itemDiv.setAttribute('data-attributes', attributes.toLowerCase());
      itemDiv.style.cssText = `
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        transition: all 0.2s ease;
      `;
      itemDiv.addEventListener('mouseenter', () => {
        itemDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      });
      itemDiv.addEventListener('mouseleave', () => {
        itemDiv.style.boxShadow = 'none';
      });
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'item-name';
      nameDiv.style.cssText = `
        font-weight: 600;
        font-size: 16px;
        color: #374151;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      
      const iconSpan = document.createElement('span');
      iconSpan.className = 'item-icon';
      iconSpan.textContent = categoryIcon;
      iconSpan.style.fontSize = '18px';
      
      const nameText = document.createTextNode(itemName + typeDisplay);
      
      nameDiv.appendChild(iconSpan);
      nameDiv.appendChild(nameText);
      
      const statsDiv = document.createElement('div');
      statsDiv.className = 'item-stats';
      statsDiv.textContent = `위력: ${powerRange} | 무게: ${weightRange}`;
      statsDiv.style.cssText = `
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 4px;
      `;
      
      const attributesDiv = document.createElement('div');
      attributesDiv.className = 'item-attributes';
      attributesDiv.textContent = `속성: ${attributes}`;
      attributesDiv.style.cssText = `
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 4px;
      `;
      
      itemDiv.appendChild(nameDiv);
      itemDiv.appendChild(statsDiv);
      itemDiv.appendChild(attributesDiv);
      
      if (abilities !== 'N/A') {
        const abilitiesDiv = document.createElement('div');
        abilitiesDiv.className = 'item-abilities';
        abilitiesDiv.textContent = abilities;
        abilitiesDiv.style.cssText = `
          font-size: 14px;
          color: #667eea;
          font-weight: 500;
        `;
        itemDiv.appendChild(abilitiesDiv);
      }

      listContainer.appendChild(itemDiv);
    });

    countElement.textContent = items.length;
  }

  // 메인 카테고리 변경 처리
  handleMainCategoryChange(category) {
    console.log('handleMainCategoryChange 시작:', category);
    const subCategories = document.getElementById('subCategories');
    
    if (category === '무기') {
      console.log('무기 카테고리 선택됨');
      subCategories.style.display = 'flex';
      document.querySelectorAll('.sub-category').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'white';
        btn.style.color = '#667eea';
        btn.style.border = '2px solid #667eea';
      });
      const allSubBtn = document.querySelector('.sub-category[data-category=""]');
      if (allSubBtn) {
        allSubBtn.classList.add('active');
        allSubBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        allSubBtn.style.color = 'white';
        allSubBtn.style.border = 'none';
      }
    } else {
      console.log('다른 카테고리 선택됨:', category);
      subCategories.style.display = 'none';
      document.querySelectorAll('.sub-category').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'white';
        btn.style.color = '#667eea';
        btn.style.border = '2px solid #667eea';
      });
    }
    
    console.log('this.filterItems 호출 시도');
    this.filterItems();
    console.log('this.filterItems 호출 완료');
  }

  // 검색/필터
  filterItems() {
    console.log('filterItems 메서드 시작');
    const searchInput = document.getElementById('itemSearchInput');
    const abilitySearchInput = document.getElementById('abilitySearchInput');
    const items = document.querySelectorAll('.item-guide-item');
    
    console.log('검색 입력 요소:', searchInput);
    console.log('어빌리티 검색 입력 요소:', abilitySearchInput);
    console.log('아이템 요소들:', items.length);
    
    // 검색 입력이 없어도 기본값 사용
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const abilitySearchTerm = abilitySearchInput ? abilitySearchInput.value.toLowerCase() : '';
    const selectedMainCategory = document.querySelector('.main-category.active')?.getAttribute('data-category') || '';
    const selectedSubCategory = document.querySelector('.sub-category.active')?.getAttribute('data-category') || '';
    
    const activeAttributes = Array.from(document.querySelectorAll('.attribute-btn.active')).map(btn => 
      btn.getAttribute('data-attribute').toLowerCase()
    );
    
    // 디버깅 로그
    console.log('=== 필터링 디버깅 ===');
    console.log('선택된 메인 카테고리:', selectedMainCategory);
    console.log('선택된 서브 카테고리:', selectedSubCategory);
    console.log('활성 속성들:', activeAttributes);
    console.log('검색어:', searchTerm);
    console.log('어빌리티 검색어:', abilitySearchTerm);
    
    let visibleCount = 0;

    items.forEach((item, index) => {
      const itemName = item.getAttribute('data-name');
      const itemMainCategory = item.getAttribute('data-main-category');
      const itemSubCategory = item.getAttribute('data-sub-category');
      const itemAbilities = item.getAttribute('data-abilities');
      const itemAttributes = item.getAttribute('data-attributes');
      
      const matchesSearch = itemName.includes(searchTerm);
      const matchesAbility = itemAbilities.includes(abilitySearchTerm);
      const matchesMainCategory = !selectedMainCategory || itemMainCategory === selectedMainCategory.toLowerCase();
      const matchesSubCategory = !selectedSubCategory || itemSubCategory === selectedSubCategory.toLowerCase();
      
      const matchesAttribute = activeAttributes.length === 0 || 
        activeAttributes.some(attr => {
          return itemAttributes.includes(attr) || itemAttributes.includes(attr.toLowerCase());
        });
      
      // 첫 번째 아이템만 디버깅 로그 출력
      if (index === 0) {
        console.log('첫 번째 아이템 데이터:');
        console.log('- 아이템명:', itemName);
        console.log('- 메인 카테고리:', itemMainCategory);
        console.log('- 서브 카테고리:', itemSubCategory);
        console.log('- 어빌리티:', itemAbilities);
        console.log('- 속성:', itemAttributes);
        console.log('매칭 결과:');
        console.log('- 검색 매칭:', matchesSearch);
        console.log('- 어빌리티 매칭:', matchesAbility);
        console.log('- 메인 카테고리 매칭:', matchesMainCategory);
        console.log('- 서브 카테고리 매칭:', matchesSubCategory);
        console.log('- 속성 매칭:', matchesAttribute);
      }
      
      if (matchesSearch && matchesAbility && matchesAttribute && matchesMainCategory && matchesSubCategory) {
        item.style.display = 'block';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    const countElement = document.getElementById('itemGuideCount');
    if (countElement) {
      countElement.textContent = visibleCount;
    }
    
    console.log('총 표시된 아이템 수:', visibleCount);
  }
}

export default ItemGuideModal; 
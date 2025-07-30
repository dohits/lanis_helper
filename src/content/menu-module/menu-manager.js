// 기댓값 계산기 import
import ExpectedValueCalculator from '../calculator/expected-value-calculator.js';
import PriceFetcher from '../calculator/price-fetcher.js';
import { ExpectedValueUIManager } from '../calculator/expected-value-ui-manager.js';
import ItemGuideModal from './modal/item-guide-modal.js';

// 메뉴 관리자
class MenuManager {
  constructor() {
    this.menuConfig = null;
    this.settings = {};
    this.calculator = new ExpectedValueCalculator();
    this.priceFetcher = new PriceFetcher();
    this.uiManager = new ExpectedValueUIManager(this.calculator, this.priceFetcher);
    this.itemGuideModal = new ItemGuideModal();
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
    if (item.id === 'calculator') {
      this.createCalculatorSubMenu(subMenu);
    } else if (item.id === 'itemGuide') {
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







  createCalculatorSubMenu(container) {
    container.innerHTML = '';
    
    const subMenuConfig = this.menuConfig.mainMenu.calculator.subMenu;
    
    // 설정 기반으로 모든 서브메뉴 아이템 렌더링
    subMenuConfig.items.forEach(item => {
      const button = document.createElement('button');
      button.className = 'main-menu-item sub-menu-item';
      button.style.fontWeight = 'bold';
      
      button.innerHTML = item.text;
      button.title = item.title;
      
      button.addEventListener('click', async (e) => {
      e.stopPropagation();
        await this.handleSubMenuItemClick(item);
        this.closeAllSubMenus();
      });
      
      container.appendChild(button);
    });
  }

  createItemGuideSubMenu(container) {
    container.innerHTML = '';
    
    const subMenuConfig = this.menuConfig.mainMenu.itemGuide.subMenu;

    // 설정 기반으로 모든 서브메뉴 아이템 렌더링
    subMenuConfig.items.forEach(item => {
      const button = document.createElement('button');
      button.className = 'main-menu-item sub-menu-item';
      
      // 특별한 스타일이 있는 경우 적용
      if (item.special === 'highlight') {
        button.style.fontWeight = 'bold';
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        button.style.color = 'white';
      } else {
        button.style.fontWeight = 'bold';
      }
      
      button.innerHTML = item.text;
      button.title = item.title;
      
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
      case 'expectedValue':
        this.openExpectedValueModal();
        break;
      case 'itemPrice':
        this.openItemPriceModal();
        break;
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
    this.itemGuideModal.open();
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
      
      try {
        // PriceFetcher를 사용하여 차트 데이터 가져오기
        const chartData = await this.priceFetcher.getChartData(itemName);
        
        // 차트 영역 위에 텍스트 표시
        const infoDiv = document.createElement('div');
        infoDiv.style.textAlign = 'center';
        infoDiv.style.fontSize = '15px';
        infoDiv.style.fontWeight = 'bold';
        infoDiv.style.marginBottom = '10px';
        infoDiv.style.flex = '0 0 auto';
        
        // 마지막 데이터 추가 정보 (기존 로직 유지)
        let dataSourceInfo = '';
        try {
          const { oldRows, newRows } = await this.priceFetcher.fetchData();
          
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
                    const extractedItemName = itemMatch ? itemMatch[1].trim() : '';
                    
                    // 유효한 가격인지 확인 (90,000 초과, 10억 이하만 유효)
                    if (price && price > 90000 && price < 1000000000 && extractedItemName) {
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
                        item: extractedItemName,
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
          <span style='color:#374151;'>최근 판매가 :</span> <span style='color:#667eea;'>${chartData.recentPrice ? chartData.recentPrice.toLocaleString() + ' G' : '-'}</span><br>
          <span style='color:#374151;'>평균 판매가 :</span> <span style='color:#764ba2;'>${chartData.avgPrice ? chartData.avgPrice.toLocaleString() + ' G' : '-'}</span>`;
        
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
            labels: chartData.timeOrderedLabels,
            datasets: [{
              label: itemName + ' 시세',
              data: chartData.timeOrderedPrices,
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

  // 기존 시세 데이터 파싱 (B, C열 데이터) - PriceFetcher로 대체됨
  // parseTradeData와 parsePriceData는 PriceFetcher로 이동됨

  // 기댓값 계산기 모달 열기
  openExpectedValueModal() {
    // UI 매니저를 통해 모달 생성
    this.uiManager.createExpectedValueModal();
  }

  // 기댓값 계산기 관련 메서드들은 UI 매니저로 이동

}

// ES6 모듈로 export
export default MenuManager; 
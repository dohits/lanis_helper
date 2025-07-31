// 기댓값 계산기 import
import ExpectedValueCalculator from '../calculator/expected-value-calculator.js';
import PriceFetcher from '../calculator/price-fetcher.js';
import { ExpectedValueUIManager } from '../calculator/expected-value-ui-manager.js';
import ItemGuideModal from './modal/item-guide/item-guide-modal.js';
import UserSearchModal from './modal/settings/user-search-modal.js';
import ProgramInfoModal from './modal/settings/program-info-modal.js';
import AbilityInfoModal from './modal/settings/ability-info-modal.js';
import EnchantInfoModal from './modal/settings/enchant-info-modal.js';
import ItemPriceModal from './modal/item-guide/item-price-modal.js';

// 메뉴 관리자
class MenuManager {
  constructor() {
    this.menuConfig = null;
    this.settings = {};
    this.calculator = new ExpectedValueCalculator();
    this.priceFetcher = new PriceFetcher();
    this.uiManager = new ExpectedValueUIManager(this.calculator, this.priceFetcher);
    this.itemGuideModal = new ItemGuideModal();
    this.userSearchModal = new UserSearchModal();
    this.programInfoModal = new ProgramInfoModal();
    this.abilityInfoModal = new AbilityInfoModal();
    this.enchantInfoModal = new EnchantInfoModal();
    this.itemPriceModal = new ItemPriceModal();
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
        this.itemPriceModal.open();
        break;
      case 'openGuide':
        this.itemGuideModal.open();
        break;
      case 'userSearch':
        this.userSearchModal.open();
        break;
      case 'enchantInfo':
        this.enchantInfoModal.open();
        break;
      case 'programInfo':
        this.programInfoModal.open();
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
        this.abilityInfoModal.open();
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

  // 기댓값 계산기 모달 열기
  openExpectedValueModal() {
    // UI 매니저를 통해 모달 생성
    this.uiManager.createExpectedValueModal();
  }
}

// ES6 모듈로 export
export default MenuManager; 
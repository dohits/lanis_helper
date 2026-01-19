import MenuActionHandler from '../actions/MenuActionHandler.js';

// 메뉴 UI 관리 클래스
class MenuUIManager {
  constructor(menuManager) {
    this.menuManager = menuManager;
    this.stateManager = menuManager.stateManager;
    this.renderers = {
      main: menuManager.mainMenuRenderer,
      sub: menuManager.subMenuRenderer
    };
    this.actionHandler = new MenuActionHandler(menuManager);
  }

  // 메인 메뉴 토글
  toggleMainMenuRow() {
    const mainMenuRow = document.querySelector('.main-menu-row');
    const container = document.querySelector('.quick-buttons-container');
    if (!mainMenuRow) return;
    
    const isOpen = mainMenuRow.classList.contains('show');
    if (isOpen) {
      this.closeMainMenu(mainMenuRow, container);
    } else {
      this.openMainMenu(mainMenuRow, container);
    }
    event.stopPropagation();
  }

  // 메인 메뉴 열기
  openMainMenu(mainMenuRow, container) {
    mainMenuRow.classList.add('show');
    if (container) {
      container.removeAttribute('aria-hidden');
    }
  }

  // 메인 메뉴 닫기
  closeMainMenu(mainMenuRow, container) {
    mainMenuRow.classList.remove('show');
    // 서브메뉴(자식버튼)도 모두 제거
    document.querySelectorAll('.sub-menu-popup').forEach(el => el.remove());
    if (container) {
      container.setAttribute('aria-hidden', 'true');
      const focusedElement = container.querySelector(':focus');
      if (focusedElement) {
        focusedElement.blur();
      }
    }
  }

  // 서브메뉴 생성 및 표시
  async createAndShowSubMenu(item) {
    const btn = document.querySelector(`.main-menu-item[data-menu-id="${item.id}"]`);
    if (!btn) return;

    // 이미 해당 서브메뉴가 열려있으면 닫기(토글)
    const opened = document.querySelector('.sub-menu-popup');
    if (opened && opened.getAttribute('data-menu-id') === item.id) {
      opened.remove();
      return;
    }

    // 서브메뉴가 이미 열려있으면 닫기
    this.closeAllSubMenus();

    // 서브메뉴 팝업 생성
    const subMenu = this.createSubMenuElement(item, btn);
    
    // 서브메뉴 내용 생성
    await this.populateSubMenuContent(subMenu, item);
    
    // DOM에 추가
    document.body.appendChild(subMenu);
    
    // 위치 조정 (기존 코드 유지)
    this.adjustSubMenuPosition(subMenu, btn);
  }

  // 서브메뉴 요소 생성
  createSubMenuElement(item, btn) {
    const subMenu = document.createElement('div');
    subMenu.className = 'sub-menu-popup';
    subMenu.setAttribute('data-menu-id', item.id);
    
    // 기본 위치 설정 (버튼 오른쪽, 스크롤 고려)
    const rect = btn.getBoundingClientRect();
    subMenu.style.position = 'fixed';
    subMenu.style.left = `${rect.right + MenuUIManager.POSITION_CONSTANTS.OFFSET}px`;
    subMenu.style.top = `${rect.top + rect.height/2}px`;
    subMenu.style.transform = 'translateY(-50%)';
    subMenu.style.zIndex = MenuUIManager.POSITION_CONSTANTS.Z_INDEX;
    
    return subMenu;
  }

  // 서브메뉴 내용 채우기
  async populateSubMenuContent(subMenu, item) {
    if (item.id === 'calculator') {
      await this.renderers.sub.createCalculatorSubMenu(subMenu);
    } else if (item.id === 'itemGuide') {
      await this.renderers.sub.createItemGuideSubMenu(subMenu);
    } else if (item.id === 'settings') {
      // 설정 메뉴는 최신 설정을 가져와서 렌더링
      await this.actionHandler.updateSettingsAndRender(subMenu);
    } else if (item.id === 'guild') {
      await this.renderers.sub.createGuildSubMenu(subMenu);
    } else if (item.id === 'board') {
      await this.renderers.sub.createBoardSubMenu(subMenu);
    }
    
    // 서브메뉴 버튼에 이벤트 리스너 추가
    this.addSubMenuButtonListeners(subMenu);
  }

  // 위치 조정 관련 상수
  static get POSITION_CONSTANTS() {
    return {
      OFFSET: 16,
      Z_INDEX: 10010,
      SAFETY_MARGIN: 16,
      TRANSITION_DELAY: 0
    };
  }

  // 위치 조정 유틸리티 메서드들
  _calculateScreenSpace(btnRect) {
    return {
      spaceBelow: window.innerHeight - btnRect.bottom,
      spaceAbove: btnRect.top,
      spaceRight: window.innerWidth - btnRect.right,
      spaceLeft: btnRect.left
    };
  }

  _calculateMenuHeight(subMenu) {
    const prevVis = subMenu.style.visibility;
    const prevDisp = subMenu.style.display;
    
    subMenu.style.visibility = 'hidden';
    subMenu.style.display = 'block';
    const height = subMenu.offsetHeight;
    
    subMenu.style.visibility = prevVis;
    subMenu.style.display = prevDisp;
    
    return height;
  }

  _resetSubMenuStyles(subMenu) {
    subMenu.style.top = '';
    subMenu.style.bottom = '';
    subMenu.style.maxHeight = '';
    subMenu.style.transform = '';
  }

  _applyUpwardPosition(subMenu, mainBtnRect) {
    subMenu.style.top = 'auto';
    subMenu.style.bottom = `${window.innerHeight - mainBtnRect.bottom}px`;
    subMenu.style.maxHeight = `${mainBtnRect.top - MenuUIManager.POSITION_CONSTANTS.SAFETY_MARGIN}px`;
    subMenu.style.transform = 'none';
  }

  _applyDownwardPosition(subMenu, btnRect) {
    subMenu.style.top = `${btnRect.top + btnRect.height/2}px`;
    subMenu.style.bottom = '';
    subMenu.style.maxHeight = '';
    subMenu.style.transform = 'translateY(-50%)';
  }

  // 서브메뉴 위치 조정 (리팩토링된 버전)
  adjustSubMenuPosition(subMenu, btn) {
    setTimeout(() => {
      try {
        // 1. 스타일 초기화
        this._resetSubMenuStyles(subMenu);
        
        // 2. 위치 정보 계산
        const btnRect = btn.getBoundingClientRect();
        const mainBtn = document.querySelector('.main-menu-button');
        const mainBtnRect = mainBtn.getBoundingClientRect();
        const menuHeight = this._calculateMenuHeight(subMenu);
        const { spaceBelow, spaceAbove } = this._calculateScreenSpace(btnRect);
        
        // 3. 위치 결정 및 적용
        const shouldPositionUpward = menuHeight > spaceBelow && spaceAbove > spaceBelow;
        
        if (shouldPositionUpward) {
          this._applyUpwardPosition(subMenu, mainBtnRect);
        } else {
          this._applyDownwardPosition(subMenu, btnRect);
        }
        
        subMenu.classList.add('show');
      } catch(e) {
        console.error('Position adjustment error:', e);
      }
    }, MenuUIManager.POSITION_CONSTANTS.TRANSITION_DELAY);
  }

  // 서브메뉴 닫기
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

  // 모든 메뉴 닫기
  closeAllMenus() {
    this.closeAllSubMenus();
    
    // 메인 메뉴도 닫고 포커스 제거
    const mainMenuRow = document.querySelector('.main-menu-row');
    const container = document.querySelector('.quick-buttons-container');
    if (mainMenuRow && mainMenuRow.classList.contains('show')) {
      this.closeMainMenu(mainMenuRow, container);
    }
  }

  // 외부 클릭 처리
  handleOutsideClick(event) {
    const container = document.querySelector('.quick-buttons-container');
    const subMenus = document.querySelectorAll('.sub-menu-popup');
    
    // 클릭된 요소가 메뉴 컨테이너나 서브메뉴 내부에 있는지 확인
    const isInsideMenu = container && container.contains(event.target);
    const isInsideSubMenu = Array.from(subMenus).some(subMenu => subMenu.contains(event.target));
    
    // 메뉴 컨테이너나 서브메뉴 외부를 클릭한 경우에만 닫기
    if (!isInsideMenu && !isInsideSubMenu) {
      this.closeAllSubMenus();
    }
  }

  // 서브메뉴 버튼에 이벤트 리스너 추가
  addSubMenuButtonListeners(container) {
    const subMenuButtons = container.querySelectorAll('.sub-menu-item');
    
    subMenuButtons.forEach(button => {
      const itemId = button.getAttribute('data-item-id');
      
      // 버튼이 클릭 가능한지 확인
      if (button.style.pointerEvents === 'none' || button.disabled) {
        button.style.pointerEvents = 'auto';
        button.disabled = false;
      }
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        if (itemId) {
          this.handleSubMenuButtonClick(itemId, button);
        }
      });
    });
  }

  // 서브메뉴 버튼 클릭 처리
  handleSubMenuButtonClick(itemId, button) {
    // 모든 서브메뉴에서 아이템 찾기
    const menuConfig = this.stateManager.getMenuConfig();
    
    // 설정 메뉴 아이템 찾기
    const settingsItem = menuConfig.mainMenu.settings.subMenu.items.find(item => item.id === itemId);
    if (settingsItem) {
      this.actionHandler.executeSubMenuItemAction(settingsItem, button);
      return;
    }
    
    // 계산기 메뉴 아이템 찾기
    const calculatorItem = menuConfig.mainMenu.calculator.subMenu.items.find(item => item.id === itemId);
    if (calculatorItem) {
      this.actionHandler.executeSubMenuItemAction(calculatorItem, button);
      this.closeAllSubMenus();
      return;
    }
    
    // 아이템 도감 메뉴 아이템 찾기
    const itemGuideItem = menuConfig.mainMenu.itemGuide.subMenu.items.find(item => item.id === itemId);
    if (itemGuideItem) {
      this.actionHandler.executeSubMenuItemAction(itemGuideItem, button);
      this.closeAllSubMenus();
      return;
    }
    
    // 길드 메뉴 아이템 찾기
    const guildItem = menuConfig.mainMenu.guild.subMenu.items.find(item => item.id === itemId);
    if (guildItem) {
      this.actionHandler.executeSubMenuItemAction(guildItem, button);
      this.closeAllSubMenus();
      return;
    }
    
    // 게시판 메뉴 아이템 찾기
    const boardItem = menuConfig.mainMenu.board.subMenu.items.find(item => item.id === itemId);
    if (boardItem) {
      this.actionHandler.executeSubMenuItemAction(boardItem, button);
      this.closeAllSubMenus();
      return;
    }
  }
}

export default MenuUIManager; 
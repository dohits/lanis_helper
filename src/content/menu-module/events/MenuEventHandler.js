import MenuActionHandler from '../actions/MenuActionHandler.js';
import MenuUIManager from '../ui/MenuUIManager.js';

// 메뉴 이벤트 처리 클래스
class MenuEventHandler {
  constructor(menuManager) {
    this.menuManager = menuManager;
    this.stateManager = menuManager.stateManager;
    this.renderers = {
      main: menuManager.mainMenuRenderer,
      sub: menuManager.subMenuRenderer
    };
    this.actionHandler = new MenuActionHandler(menuManager);
    this.uiManager = new MenuUIManager(menuManager);
  }

  // 이벤트 바인딩
  bindEvents() {
    this.bindMainMenuEvents();
    this.bindSubMenuEvents();
    this.bindGlobalEvents();
  }

  // 메인 메뉴 이벤트 바인딩
  bindMainMenuEvents() {
    // 메인 메뉴 버튼 이벤트
    const mainButton = document.querySelector('.main-menu-button');
    if (mainButton) {
      mainButton.addEventListener('click', () => this.uiManager.toggleMainMenuRow());
    }

    // 메인 메뉴 아이템 이벤트
    document.querySelectorAll('.main-menu-item').forEach(button => {
      const menuId = button.getAttribute('data-menu-id');
      if (menuId) {
        const item = this.stateManager.getMenuConfig().mainMenu.items.find(item => item.id === menuId);
        if (item) {
          button.addEventListener('click', () => this.handleMainMenuItemClick(item));
        }
      }
    });
  }

  // 서브메뉴 이벤트 바인딩 (이벤트 위임 방식 제거)
  bindSubMenuEvents() {
    // 이벤트 위임 방식은 제거하고 직접 이벤트 리스너만 사용
  }

  

  // 글로벌 이벤트 바인딩
  bindGlobalEvents() {
    // 외부 클릭 이벤트
    document.addEventListener('mousedown', (e) => this.uiManager.handleOutsideClick(e));
    
    // ESC 키 이벤트
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.uiManager.closeAllMenus();
      }
    });
  }



    // 메인 메뉴 아이템 클릭 처리
  async handleMainMenuItemClick(item) {
    await this.uiManager.createAndShowSubMenu(item);
    // 서브메뉴 버튼에 직접 이벤트 리스너 추가
    const subMenu = document.querySelector('.sub-menu-popup');
    if (subMenu) {
      this.uiManager.addSubMenuButtonListeners(subMenu);
    }
  }

  // 서브메뉴 아이템 클릭 처리
  async handleSubMenuItemClick(item, button) {
    await this.actionHandler.executeSubMenuItemAction(item, button);
  }


}

export default MenuEventHandler; 
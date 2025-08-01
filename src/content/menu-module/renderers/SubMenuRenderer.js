// 서브메뉴 렌더링 전용 클래스
import SubMenuStyles from './SubMenuStyles.js';

class SubMenuRenderer {
  constructor() {
    this.menuConfig = null;
    this.settings = {};
    this.styles = new SubMenuStyles();
  }

  setMenuConfig(config) {
    this.menuConfig = config;
  }

  setSettings(settings) {
    this.settings = settings;
  }

  // 공통 버튼 생성 메서드
  createButton(item, menuType, options = {}) {
    const button = document.createElement('button');
    
    // 토글 버튼인지 확인
    const isToggleButton = item.id === 'profileLink' || item.id === 'showItemStats';
    if (isToggleButton) {
      options.isEnabled = this.settings[item.id];
    }
    
    // 스타일 관리자를 통해 스타일 적용
    this.styles.applyStyle(button, menuType, item, options);
    
    return button;
  }

  // 서브메뉴 렌더링 공통 메서드
  renderSubMenu(container, menuType, options = {}) {
    container.innerHTML = '';
    
    const subMenuConfig = this.menuConfig.mainMenu[menuType].subMenu;
    
    subMenuConfig.items.forEach(item => {
      const button = this.createButton(item, menuType, {
        ...options,
        dataId: item.id
      });
      container.appendChild(button);
    });
  }

  createCalculatorSubMenu(container) {
    this.renderSubMenu(container, 'calculator');
  }

  createItemGuideSubMenu(container) {
    this.renderSubMenu(container, 'itemGuide');
  }

  createSettingsSubMenu(container) {
    this.renderSubMenu(container, 'settings');
  }

  updateToggleButton(button, item) {
    const isEnabled = this.settings[item.id];
    this.styles.updateToggleButton(button, item, isEnabled);
  }
}

// ES6 모듈로 export
export default SubMenuRenderer; 
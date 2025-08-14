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
  async renderSubMenu(container, menuType, options = {}) {
    container.innerHTML = '';
    
    // 설정 메뉴인 경우 최신 설정을 다시 로드
    if (menuType === 'settings') {
      await this.loadLatestSettings();
    }
    
    const subMenuConfig = this.menuConfig.mainMenu[menuType].subMenu;
    
    subMenuConfig.items.forEach(item => {
      const button = this.createButton(item, menuType, {
        ...options,
        dataId: item.id
      });
      container.appendChild(button);
    });
  }

  // 최신 설정 로드
  async loadLatestSettings() {
    try {
      if (window.utils && window.utils.SettingsManager) {
        const latestSettings = await window.utils.SettingsManager.getSettings({
          profileLink: true,
          showItemStats: true
        });
        this.settings = latestSettings;
      }
    } catch (error) {
      // Extension context invalidated 오류를 포함한 모든 오류 처리
      if (error.message && error.message.includes('Extension context invalidated')) {
        console.warn('확장 프로그램 컨텍스트가 무효화되었습니다. 기본 설정을 사용합니다.');
        // 기본 설정 사용
        this.settings = {
          profileLink: true,
          showItemStats: true
        };
      } else {
        console.warn('최신 설정 로드 실패:', error);
      }
    }
  }

  async createCalculatorSubMenu(container) {
    await this.renderSubMenu(container, 'calculator');
  }

  async createItemGuideSubMenu(container) {
    await this.renderSubMenu(container, 'itemGuide');
  }

  async createSettingsSubMenu(container) {
    await this.renderSubMenu(container, 'settings');
  }

  async createGuildSubMenu(container) {
    await this.renderSubMenu(container, 'guild');
  }

  updateToggleButton(button, item) {
    const isEnabled = this.settings[item.id];
    this.styles.updateToggleButton(button, item, isEnabled);
  }
}

// ES6 모듈로 export
export default SubMenuRenderer; 
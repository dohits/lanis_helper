// 메뉴 상태 관리 클래스
class MenuStateManager {
  constructor() {
    this.menuConfig = null;
    this.settings = {};
    this.isMainMenuOpen = false;
    this.currentSubMenu = null;
    
    // 기본 설정 상수
    this.DEFAULT_SETTINGS = {
      profileLink: true,
      showItemStats: true
    };
    
    this.DEFAULT_MENU_CONFIG = {
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
  }

  // 유효성 검사 헬퍼 메서드
  _validateSettingId(settingId) {
    if (!settingId || typeof settingId !== 'string') {
      console.warn('Invalid settingId provided:', settingId);
      return false;
    }
    return true;
  }

  _validateMenuId(menuId) {
    if (!menuId || typeof menuId !== 'string') {
      console.warn('Invalid menuId provided:', menuId);
      return false;
    }
    return true;
  }

  // 안전한 utils 접근
  _getUtils() {
    if (typeof window !== 'undefined' && window.utils && window.utils.SettingsManager) {
      return window.utils;
    }
    return null;
  }

  // 메뉴 설정 로드
  async loadMenuConfig() {
    try {
      const configUrl = chrome.runtime.getURL('menu-config.json');
      const response = await fetch(configUrl);
      
      if (response.ok) {
        this.menuConfig = await response.json();
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('메뉴 설정 로드 실패, 기본 설정 사용:', error);
      this.menuConfig = this.DEFAULT_MENU_CONFIG;
      return false;
    }
  }

  // 설정 로드
  async loadSettings() {
    try {
      const utils = this._getUtils();
      if (utils) {
        this.settings = await utils.SettingsManager.getSettings(this.DEFAULT_SETTINGS);
      } else {
        this.settings = { ...this.DEFAULT_SETTINGS };
      }
      return true;
    } catch (error) {
      console.warn('설정 로드 실패, 기본 설정 사용:', error);
      this.settings = { ...this.DEFAULT_SETTINGS };
      return false;
    }
  }

  // 메뉴 설정 가져오기
  getMenuConfig() {
    return this.menuConfig;
  }

  // 설정 가져오기
  getSettings() {
    return { ...this.settings };
  }

  // 메인 메뉴 상태 토글
  toggleMainMenuState() {
    this.isMainMenuOpen = !this.isMainMenuOpen;
    return this.isMainMenuOpen;
  }

  // 메인 메뉴 상태 설정
  setMainMenuState(isOpen) {
    if (typeof isOpen !== 'boolean') {
      console.warn('Invalid isOpen parameter, expected boolean:', isOpen);
      return;
    }
    this.isMainMenuOpen = isOpen;
  }

  // 메인 메뉴 상태 확인
  getMainMenuState() {
    return this.isMainMenuOpen;
  }

  // 현재 서브메뉴 설정
  setCurrentSubMenu(menuId) {
    if (!this._validateMenuId(menuId)) {
      return;
    }
    this.currentSubMenu = menuId;
  }

  // 현재 서브메뉴 가져오기
  getCurrentSubMenu() {
    return this.currentSubMenu;
  }

  // 서브메뉴 상태 초기화
  clearCurrentSubMenu() {
    this.currentSubMenu = null;
  }

  // 특정 서브메뉴가 열려있는지 확인
  isSubMenuOpen(menuId) {
    if (!this._validateMenuId(menuId)) {
      return false;
    }
    return this.currentSubMenu === menuId;
  }

  // 설정 토글
  async toggleSetting(settingId) {
    if (!this._validateSettingId(settingId)) {
      return false;
    }

    if (this.settings.hasOwnProperty(settingId)) {
      this.settings[settingId] = !this.settings[settingId];
      
      // 설정 저장
      try {
        const utils = this._getUtils();
        if (utils) {
          await utils.SettingsManager.setSettings(this.settings);
        }
      } catch (error) {
        console.warn('설정 저장 실패:', error);
      }
      
      return this.settings[settingId];
    }
    
    console.warn(`설정 ID '${settingId}'가 존재하지 않습니다.`);
    return false;
  }

  // 특정 설정 가져오기
  getSetting(settingId) {
    if (!this._validateSettingId(settingId)) {
      return false;
    }
    return this.settings[settingId] || false;
  }

  // 설정 업데이트
  updateSettings(newSettings) {
    if (!newSettings || typeof newSettings !== 'object') {
      console.warn('Invalid newSettings parameter:', newSettings);
      return;
    }
    this.settings = { ...this.settings, ...newSettings };
  }

  // 모든 메뉴 상태 초기화
  resetAllStates() {
    this.isMainMenuOpen = false;
    this.currentSubMenu = null;
  }

  // 메뉴 상태 정보 가져오기
  getMenuStateInfo() {
    return {
      isMainMenuOpen: this.isMainMenuOpen,
      currentSubMenu: this.currentSubMenu,
      settings: { ...this.settings }
    };
  }

  // 상태 유효성 검사
  validateState() {
    return {
      isValid: true,
      menuConfig: !!this.menuConfig,
      settings: !!this.settings,
      mainMenuState: typeof this.isMainMenuOpen === 'boolean',
      subMenuState: this.currentSubMenu === null || typeof this.currentSubMenu === 'string'
    };
  }
}

export default MenuStateManager; 
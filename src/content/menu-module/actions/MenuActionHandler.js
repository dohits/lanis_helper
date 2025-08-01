import { ExpectedValueModal } from '../modal/calculator/expected-value-modal.js';

// 메뉴 액션 처리 클래스
class MenuActionHandler {
  constructor(menuManager) {
    this.menuManager = menuManager;
    this.stateManager = menuManager.stateManager;
    this.renderers = {
      main: menuManager.mainMenuRenderer,
      sub: menuManager.subMenuRenderer
    };
    this.modals = {
      itemGuide: menuManager.itemGuideModal,
      userSearch: menuManager.userSearchModal,
      programInfo: menuManager.programInfoModal,
      abilityInfo: menuManager.abilityInfoModal,
      enchantInfo: menuManager.enchantInfoModal,
      itemPrice: menuManager.itemPriceModal
    };
    this.uiManager = menuManager.uiManager;
    
    // ExpectedValueModal 초기화
    this.expectedValueModal = new ExpectedValueModal();
  }

  // 서브메뉴 아이템 액션 실행
  async executeSubMenuItemAction(item, button) {
    switch (item.id) {
      case 'expectedValue':
        this.openExpectedValueModal();
        break;
      case 'itemPrice':
        this.modals.itemPrice.open();
        break;
      case 'openGuide':
        this.modals.itemGuide.open();
        break;
      case 'userSearch':
        this.modals.userSearch.open();
        break;
      case 'enchantInfo':
        this.modals.enchantInfo.open();
        break;
      case 'programInfo':
        this.modals.programInfo.open();
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
        this.modals.abilityInfo.open();
        break;
      default:
        // 알 수 없는 서브메뉴 아이템
        break;
    }
  }

  // 설정 토글
  async toggleSetting(settingId) {
    const newValue = await this.stateManager.toggleSetting(settingId);
    
    // subMenuRenderer의 설정도 업데이트
    this.renderers.sub.setSettings(this.stateManager.getSettings());
    
    // 설정에 따른 기능 실행
    this.executeSettingAction(settingId);
  }

  // 설정 액션 실행
  executeSettingAction(settingId) {
    const settings = this.stateManager.getSettings();
    switch (settingId) {
      case 'profileLink':
        if (settings[settingId]) {
          window.userProfileManager.processUserNames();
          // 동적 콘텐츠 처리 시작
          window.userProfileManager.processDynamicContent();
        } else {
          window.userProfileManager.removeUserNames();
        }
        break;
      case 'showItemStats':  // 구버전 방식으로 변경
        if (settings[settingId]) {
          window.itemStatsManager.processItemStats();
        } else {
          window.itemStatsManager.removeItemStats();
        }
        break;
    }
  }

  // 설정 업데이트 및 렌더링
  async updateSettingsAndRender(container) {
    // 최신 설정을 다시 로드
    await this.stateManager.loadSettings();
    this.renderers.sub.setSettings(this.stateManager.getSettings());
    this.renderers.sub.createSettingsSubMenu(container);
  }

  // 토글 버튼 업데이트
  updateToggleButton(button, item) {
    this.renderers.sub.updateToggleButton(button, item);
  }

  // 기댓값 계산기 모달 열기
  openExpectedValueModal() {
    // 직접 ExpectedValueModal 사용
    this.expectedValueModal.open();
  }
}

export default MenuActionHandler; 
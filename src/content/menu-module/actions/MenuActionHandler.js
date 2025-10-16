import { ExpectedValueModal } from '../modal/calculator/expected-value-modal.js';
import { FishingCalculatorModal } from '../modal/calculator/fishing-calculator-modal.js';
import { EquipmentSettingSimModal } from '../modal/calculator/equipment-setting-sim-modal.js';
import { EquipmentEnchantSimModal } from '../modal/calculator/equipment-enchant-sim-modal.js';

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
      itemCollection: menuManager.itemCollectionModal,
      guildWarInfo: menuManager.guildWarInfoModal
    };
    this.expectedValueModal = menuManager.expectedValueModal;
    this.fishingCalculatorModal = menuManager.fishingCalculatorModal;
    this.equipmentSettingSimModal = menuManager.equipmentSettingSimModal;
    this.equipmentEnchantSimModal = menuManager.equipmentEnchantSimModal;
  }

  // 서브메뉴 아이템 액션 실행
  async executeSubMenuItemAction(item, button) {
    switch (item.id) {
      case 'expectedValue':
        this.openExpectedValueModal();
        break;
      case 'fishingCalculator':
        this.openFishingCalculatorModal();
        break;
      case 'equipmentSettingSim':
        this.openEquipmentSettingSimModal();
        break;
      case 'equipmentEnchantSim':
        this.openEquipmentEnchantSimModal();
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
      case 'itemCollection':
        this.modals.itemCollection.open();
        break;
      case 'showItemStats':
      case 'useComfortPack':
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
      case 'guildWarInfo':
        this.modals.guildWarInfo.open();
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
      case 'showItemStats':
        if (settings[settingId]) {
          // ON 상태: 기능 활성화
          window.itemStatsManager.processItemStats();
        } else {
          // OFF 상태: 기능 비활성화
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
    await this.renderers.sub.createSettingsSubMenu(container);
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

  // 낚시 계산기 모달 열기
  openFishingCalculatorModal() {
    // 직접 FishingCalculatorModal 사용
    this.fishingCalculatorModal.open();
  }

  // 장비 셋팅 시뮬 모달 열기
  openEquipmentSettingSimModal() {
    // 직접 EquipmentSettingSimModal 사용
    this.equipmentSettingSimModal.open();
  }

  // 장비 감정 시뮬 모달 열기
  openEquipmentEnchantSimModal() {
    // 직접 EquipmentEnchantSimModal 사용
    this.equipmentEnchantSimModal.open();
  }
}

export default MenuActionHandler; 
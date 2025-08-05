// 기댓값 계산기 import
import ExpectedValueCalculator from '../calculator/expected-value-calculator.js';
import PriceFetcher from '../calculator/price-fetcher.js';
import { ExpectedValueModal } from './modal/calculator/expected-value-modal.js';
import { FishingCalculatorModal } from './modal/calculator/fishing-calculator-modal.js';
import ItemGuideModal from './modal/item-guide/item-guide-modal.js';
import UserSearchModal from './modal/settings/user-search-modal.js';
import ProgramInfoModal from './modal/settings/program-info-modal.js';
import AbilityInfoModal from './modal/settings/ability-info-modal.js';
import EnchantInfoModal from './modal/settings/enchant-info-modal.js';
import ItemPriceModal from './modal/item-guide/item-price-modal.js';
import ItemCollectionModal from './modal/settings/item-collection-modal.js';
import MainMenuRenderer from './renderers/MainMenuRenderer.js';
import SubMenuRenderer from './renderers/SubMenuRenderer.js';
import MenuStateManager from './state/MenuStateManager.js';
import MenuEventHandler from './events/MenuEventHandler.js';
import MenuUIManager from './ui/MenuUIManager.js';

// 메뉴 관리자
class MenuManager {
  constructor() {
    this.stateManager = new MenuStateManager();
    this.calculator = new ExpectedValueCalculator();
    this.priceFetcher = new PriceFetcher();
    this.expectedValueModal = new ExpectedValueModal();
    this.fishingCalculatorModal = new FishingCalculatorModal();
    this.itemGuideModal = new ItemGuideModal();
    this.userSearchModal = new UserSearchModal();
    this.programInfoModal = new ProgramInfoModal();
    this.abilityInfoModal = new AbilityInfoModal();
    this.enchantInfoModal = new EnchantInfoModal();
    this.itemPriceModal = new ItemPriceModal();
    this.itemCollectionModal = new ItemCollectionModal();
    this.mainMenuRenderer = new MainMenuRenderer();
    this.subMenuRenderer = new SubMenuRenderer();
    this.eventHandler = new MenuEventHandler(this);
    this.menuUIManager = new MenuUIManager(this);
    // init()은 외부에서 호출하도록 변경
  }

  async init() {
    await this.stateManager.loadMenuConfig();
    await this.stateManager.loadSettings();
    this.mainMenuRenderer.setMenuConfig(this.stateManager.getMenuConfig());
    this.subMenuRenderer.setMenuConfig(this.stateManager.getMenuConfig());
    this.subMenuRenderer.setSettings(this.stateManager.getSettings());
    this.mainMenuRenderer.createMainMenu();
    this.eventHandler.bindEvents();
  }
}

// ES6 모듈로 export
export default MenuManager; 
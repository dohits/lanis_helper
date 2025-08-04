// DOM 모듈 통합 관리자
import UserNavigationManager from './user-navigation/UserNavigationManager.js';
import ProfileEnhancementManager from './profile-enhancement/ProfileEnhancementManager.js';
import SearchEngineManager from './search-engine/SearchEngineManager.js';
import ItemStatsManager from './item-stats/ItemStatsManager.js';

class DOMModulesManager {
  constructor() {
    this.modules = {
      userNavigation: new UserNavigationManager(),
      profileEnhancement: new ProfileEnhancementManager(),
      searchEngine: new SearchEngineManager(),
      itemStats: new ItemStatsManager()
    };
  }

  async init() {
    try {
      // 모든 DOM 모듈 초기화
      await this.modules.userNavigation.init();
      await this.modules.profileEnhancement.init();
      await this.modules.searchEngine.init();
      await this.modules.itemStats.init();
      
  
    } catch (error) {
      console.error('DOMModulesManager 초기화 중 오류:', error);
    }
  }

  // 사용자 네비게이션 관련 메서드들
  async processUserNames() {
    await this.modules.userNavigation.processUserNames();
  }

  processProfileEnhancement() {
    this.modules.profileEnhancement.processProfileEnhancement();
  }

  removeUserNames() {
    this.modules.userNavigation.destroy();
    this.modules.profileEnhancement.destroy();
  }

  processDynamicContent() {
    this.modules.userNavigation.processUserNames();
    this.modules.profileEnhancement.processProfileEnhancement();
  }

  isProcessingProfiles() {
    return this.modules.userNavigation.isProcessingProfiles() || 
           this.modules.profileEnhancement.isProcessingEnhancement();
  }

  getProcessedCount() {
    return this.modules.userNavigation.getProcessedCount();
  }

  // 검색 엔진 관련 메서드들
  async collectRareItems() {
    return await this.modules.searchEngine.collectRareItems();
  }

  // DOM 기반 계산이므로 희귀 아이템 데이터 불필요
  getRareItemsData() {
    return [];
  }

  sleep(ms) {
    return this.modules.searchEngine.sleep(ms);
  }

  // 아이템 스탯 관련 메서드들
  async processItemStats() {
    await this.modules.itemStats.processItemStats();
  }

  removeItemStats() {
    this.modules.itemStats.removeItemStats();
  }

  isProcessingStats() {
    return this.modules.itemStats.isProcessingStats();
  }

  // 전체 정리
  destroy() {
    try {
      this.modules.userNavigation.destroy();
      this.modules.profileEnhancement.destroy();
      this.modules.itemStats.removeItemStats();
      
  
    } catch (error) {
      console.error('DOMModulesManager 정리 중 오류:', error);
    }
  }
}

export default DOMModulesManager; 
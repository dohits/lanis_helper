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
      
      console.log('DOMModulesManager 초기화 완료');
    } catch (error) {
      console.error('DOMModulesManager 초기화 중 오류:', error);
    }
  }

  // 사용자 네비게이션 관련 메서드들
  processUserNames() {
    this.modules.userNavigation.processUserNames();
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

  getRareItemsData() {
    return this.modules.searchEngine.getRareItemsData();
  }

  sleep(ms) {
    return this.modules.searchEngine.sleep(ms);
  }

  // 아이템 스탯 관련 메서드들
  processItemStats() {
    this.modules.itemStats.processItemStats();
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
      
      console.log('DOMModulesManager 정리 완료');
    } catch (error) {
      console.error('DOMModulesManager 정리 중 오류:', error);
    }
  }
}

export default DOMModulesManager; 
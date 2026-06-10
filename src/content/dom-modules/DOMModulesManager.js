// DOM 모듈 통합 관리자
import ProfileEnhancementManager from './profile-enhancement/ProfileEnhancementManager.js';
import SearchEngineManager from './search-engine/SearchEngineManager.js';
import ItemStatsManager from './item-stats/ItemStatsManager.js';
import { NicknameChecker } from './nickname-checker/NicknameChecker.js';

class DOMModulesManager {
  constructor() {
    this.modules = {
      profileEnhancement: new ProfileEnhancementManager(),
      searchEngine: new SearchEngineManager(),
      itemStats: new ItemStatsManager(),
      nicknameChecker: new NicknameChecker()
    };
  }

  async init() {
    try {
      // 모든 DOM 모듈 초기화
      await this.modules.profileEnhancement.init();
      await this.modules.searchEngine.init();
      await this.modules.itemStats.init();
      this.modules.nicknameChecker.init();

    } catch (error) {
      console.error('DOMModulesManager 초기화 중 오류:', error);
    }
  }

  // 프로필 향상 관련 메서드들
  processProfileEnhancement() {
    this.modules.profileEnhancement.processProfileEnhancement();
  }

  removeUserNames() {
    this.modules.profileEnhancement.destroy();
  }

  processDynamicContent() {
    this.modules.profileEnhancement.processProfileEnhancement();
  }

  isProcessingProfiles() {
    return this.modules.profileEnhancement.isProcessingEnhancement();
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

  // 닉네임 체커 관련 메서드들
  getCurrentNickname() {
    return this.modules.nicknameChecker.getCurrentNickname();
  }

  getStoredNickname() {
    return this.modules.nicknameChecker.getStoredNickname();
  }

  // 전체 정리
  destroy() {
    try {
      this.modules.profileEnhancement.destroy();
      this.modules.itemStats.removeItemStats();
      this.modules.nicknameChecker.destroy();

    } catch (error) {
      console.error('DOMModulesManager 정리 중 오류:', error);
    }
  }
}

export default DOMModulesManager; 
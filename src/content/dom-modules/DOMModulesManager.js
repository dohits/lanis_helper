// DOM 모듈 통합 관리자
import ProfileEnhancementManager from './profile-enhancement/ProfileEnhancementManager.js';
import SearchEngineManager from './search-engine/SearchEngineManager.js';
import ItemStatsManager from './item-stats/ItemStatsManager.js';
import { NicknameChecker } from './nickname-checker/NicknameChecker.js';
import GuildInfoCollector from './guild-info-collector/GuildInfoCollector.js';
import WarLogCollector from './war-log-collector/WarLogCollector.js';

class DOMModulesManager {
  constructor() {
    this.modules = {
      profileEnhancement: new ProfileEnhancementManager(),
      searchEngine: new SearchEngineManager(),
      itemStats: new ItemStatsManager(),
      nicknameChecker: new NicknameChecker(),
      guildInfoCollector: new GuildInfoCollector(),
      warLogCollector: new WarLogCollector()
    };
  }

  async init() {
    try {
      // 모든 DOM 모듈 초기화
      await this.modules.profileEnhancement.init();
      await this.modules.searchEngine.init();
      await this.modules.itemStats.init();
      this.modules.nicknameChecker.init();
      this.modules.guildInfoCollector.init();
      this.modules.warLogCollector.init();
      
      // window 객체에 수집기들 등록 (길드전 정보 모달에서 사용)
      window.guildInfoCollector = this.modules.guildInfoCollector;
      window.warLogCollector = this.modules.warLogCollector;
      
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

  // 길드 정보 수집기 관련 메서드들
  collectGuildInfo() {
    return this.modules.guildInfoCollector.collectAndSave();
  }

  getSavedGuildList() {
    return this.modules.guildInfoCollector.getSavedGuildList();
  }

  loadGuildInfo(guildName) {
    return this.modules.guildInfoCollector.loadGuildInfo(guildName);
  }

  deleteGuildInfo(guildName) {
    return this.modules.guildInfoCollector.deleteGuildInfo(guildName);
  }

  clearAllGuildInfo() {
    return this.modules.guildInfoCollector.clearAllGuildInfo();
  }

  // 전쟁 로그 수집기 관련 메서드들
  collectWarLogs() {
    return this.modules.warLogCollector.collectAndSave();
  }

  getWarLogStats() {
    return this.modules.warLogCollector.getWarLogStats();
  }

  loadAllWarLogs() {
    return this.modules.warLogCollector.loadAllWarLogs();
  }

  loadWarLogsByDateRange(startDate, endDate) {
    return this.modules.warLogCollector.loadWarLogsByDateRange(startDate, endDate);
  }

  deleteWarLogs() {
    return this.modules.warLogCollector.deleteWarLogs();
  }

  deleteLogsByDate(targetDate) {
    return this.modules.warLogCollector.deleteLogsByDate(targetDate);
  }

  // 전체 정리
  destroy() {
    try {
      this.modules.profileEnhancement.destroy();
      this.modules.itemStats.removeItemStats();
      this.modules.nicknameChecker.destroy();
      this.modules.guildInfoCollector.destroy();
      this.modules.warLogCollector.destroy();
      
    } catch (error) {
      console.error('DOMModulesManager 정리 중 오류:', error);
    }
  }
}

export default DOMModulesManager; 
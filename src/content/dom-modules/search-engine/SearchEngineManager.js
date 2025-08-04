// 검색 엔진 메인 관리자
import RareItemsDataManager from './RareItemsDataManager.js';

class SearchEngineManager {
  constructor() {
    this.rareItemsDataManager = new RareItemsDataManager();
  }

  async init() {
    try {
      await this.rareItemsDataManager.init();
  
    } catch (error) {
      console.error('SearchEngineManager 초기화 중 오류:', error);
    }
  }

  // 희귀 아이템 데이터 수집
  async collectRareItems() {
    return await this.rareItemsDataManager.collectRareItems();
  }

  // 희귀 아이템 데이터 가져오기
  getRareItemsData() {
    return this.rareItemsDataManager.getRareItemsData();
  }

  // 유틸리티 메서드
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default SearchEngineManager; 
// 희귀 아이템 데이터 관리자
import RareItemsAPI from '../../../api/wikiLoad/rareItemsAPI.js';

class RareItemsDataManager {
  constructor() {
    this.rareItemsData = [];
    this.rareItemsAPI = new RareItemsAPI();
  }

  async init() {
    await this.loadRareItemsData();
  }

  // Chrome 스토리지에서 데이터 로드
  async loadRareItemsData() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['rareItems'], (result) => {
          if (result.rareItems && result.rareItems.length > 0) {
            this.rareItemsData = result.rareItems;
          } else {
            this.rareItemsData = [];
          }
          resolve();
        });
      });
    } catch (error) {
      console.error('희귀 아이템 데이터 로드 실패:', error);
      this.rareItemsData = [];
    }
  }

  // 아이템 데이터 수집 (새로운 API 모듈 사용)
  async collectRareItems() {
    try {
      // 기존 데이터 확인 (캐시 카운트용)
      const existingData = await new Promise((resolve) => {
        chrome.storage.local.get(['rareItems', 'lastCrawlTime', 'crawlCount'], (result) => {
          resolve(result);
        });
      });

      const now = Date.now();
      
      // 새로운 API 모듈을 사용하여 데이터 수집
      const result = await this.rareItemsAPI.collectRareItems();
      
      if (result.success) {
        // Chrome 스토리지에 저장 (수집 시간 포함)
        const saveData = {
          rareItems: result.items,
          lastCrawlTime: now,
          crawlCount: (existingData.crawlCount || 0) + 1
        };
        
        chrome.storage.local.set(saveData, function() {
          // 저장 완료
        });
        
        // 메모리에도 업데이트
        this.rareItemsData = result.items;
        
        return { 
          success: true, 
          count: result.count, 
          message: result.message 
        };
      } else {
        return result; // API에서 반환된 오류 메시지 그대로 반환
      }
      
    } catch (error) {
      console.error('아이템 수집 전체 오류:', error);
      return { 
        success: false, 
        message: `수집 실패: ${error.message}` 
      };
    }
  }

  // 희귀 아이템 데이터 반환
  getRareItemsData() {
    return this.rareItemsData;
  }
}

export default RareItemsDataManager; 
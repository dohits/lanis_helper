// 희귀 아이템 데이터 관리자
import itemData from '../../../shared/item-data.json';

class RareItemsDataManager {
  constructor() {
    this.rareItemsData = [];
  }

  async init() {
    await this.loadRareItemsData();
  }

  // item-data.json 파일에서 데이터 가져오기
  getItemDataFromFile() {
    // 정적 import로 로드된 데이터 반환
    return itemData || [];
  }

  // item-data.json에서 데이터 로드
  async loadRareItemsData() {
    try {
      // 먼저 Chrome 스토리지에서 확인 (캐시된 데이터가 있으면 사용)
      return new Promise(async (resolve) => {
        chrome.storage.local.get(['rareItems', 'lastDataUpdate'], async (result) => {
          if (result.rareItems && result.rareItems.length > 0) {
            // 캐시된 데이터가 있으면 사용
            this.rareItemsData = result.rareItems;
          } else {
            // 캐시가 없으면 item-data.json에서 직접 로드
            const loadedItemData = this.getItemDataFromFile();
            this.rareItemsData = loadedItemData || [];
            
            // Chrome 스토리지에 저장 (다음 로드 시 빠른 접근을 위해)
            chrome.storage.local.set({
              rareItems: this.rareItemsData,
              lastDataUpdate: Date.now()
            });
          }
          resolve();
        });
      });
    } catch (error) {
      console.error('희귀 아이템 데이터 로드 실패:', error);
      // 오류 발생 시 item-data.json에서 직접 로드 시도
      const loadedItemData = this.getItemDataFromFile();
      this.rareItemsData = loadedItemData || [];
    }
  }

  // 아이템 데이터 수집 (item-data.json에서 직접 로드)
  async collectRareItems() {
    try {
      // 기존 데이터 확인 (캐시 카운트용)
      const existingData = await new Promise((resolve) => {
        chrome.storage.local.get(['rareItems', 'lastCrawlTime', 'crawlCount'], (result) => {
          resolve(result);
        });
      });

      const now = Date.now();
      
      // item-data.json에서 직접 데이터 로드
      const items = this.getItemDataFromFile();
      
      if (items.length > 0) {
        // Chrome 스토리지에 저장 (수집 시간 포함)
        const saveData = {
          rareItems: items,
          lastCrawlTime: now,
          lastDataUpdate: now,
          crawlCount: (existingData.crawlCount || 0) + 1
        };
        
        chrome.storage.local.set(saveData, function() {
          // 저장 완료
        });
        
        // 메모리에도 업데이트
        this.rareItemsData = items;
        
        return { 
          success: true, 
          count: items.length, 
          message: `레어 아이템 데이터 로드 완료 (${items.length}개 아이템)` 
        };
      } else {
        return {
          success: false,
          message: '아이템 데이터가 없습니다.'
        };
      }
      
    } catch (error) {
      console.error('아이템 데이터 로드 오류:', error);
      return { 
        success: false, 
        message: `데이터 로드 실패: ${error.message}` 
      };
    }
  }

  // 희귀 아이템 데이터 반환
  getRareItemsData() {
    return this.rareItemsData;
  }
}

export default RareItemsDataManager; 
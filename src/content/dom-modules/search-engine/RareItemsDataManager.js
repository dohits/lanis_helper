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

  // 현재 확장 프로그램 버전 (manifest 기준)
  getCurrentVersion() {
    try {
      return chrome.runtime.getManifest().version;
    } catch (error) {
      return null;
    }
  }

  // item-data.json에서 데이터 로드
  async loadRareItemsData() {
    try {
      const currentVersion = this.getCurrentVersion();
      // 먼저 Chrome 스토리지에서 확인 (버전이 일치하는 캐시가 있으면 사용)
      return new Promise((resolve) => {
        chrome.storage.local.get(['rareItems', 'dataVersion'], (result) => {
          // 캐시가 있고, 저장된 버전이 현재 버전과 같을 때만 캐시 사용
          const cacheValid = result.rareItems
            && result.rareItems.length > 0
            && result.dataVersion === currentVersion;

          if (cacheValid) {
            // 캐시된 데이터가 최신 버전이면 사용
            this.rareItemsData = result.rareItems;
          } else {
            // 캐시가 없거나 버전이 바뀌었으면 item-data.json에서 재로드 (배포 시 즉시 반영)
            const loadedItemData = this.getItemDataFromFile();
            this.rareItemsData = loadedItemData || [];

            // 최신 데이터와 버전을 함께 저장 (다음 로드 시 빠른 접근을 위해)
            chrome.storage.local.set({
              rareItems: this.rareItemsData,
              dataVersion: currentVersion,
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
        // Chrome 스토리지에 저장 (수집 시간 및 버전 포함)
        const saveData = {
          rareItems: items,
          dataVersion: this.getCurrentVersion(),
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
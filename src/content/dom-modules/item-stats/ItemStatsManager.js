// 아이템 스탯 메인 관리자
import ItemStatsProcessor from './ItemStatsProcessor.js';
import DynamicContentObserver from './DynamicContentObserver.js';
import PopoverPositionObserver from './PopoverPositionObserver.js';
import SettingsManager from './SettingsManager.js';

class ItemStatsManager {
  constructor() {
    this.isProcessing = false;
    this.settings = { showItemStats: true };
    this.modules = {
      processor: new ItemStatsProcessor(),
      dynamicObserver: new DynamicContentObserver(),
      popoverObserver: new PopoverPositionObserver(),
      settingsManager: new SettingsManager()
    };
  }

  async init() {
    try {
      // 설정 로드
      this.settings = await this.modules.settingsManager.loadSettings();
      
      // 각 모듈 초기화
      await this.modules.processor.init();
      this.modules.dynamicObserver.init(this);
      this.modules.popoverObserver.init();
      
  
    } catch (error) {
      console.error('ItemStatsManager 초기화 중 오류:', error);
    }
  }

  // 아이템 스탯 처리
  async processItemStats() {
    // 설정 상태 확인 - 아이템 스카우터가 OFF면 처리하지 않음
    if (window.utils && window.utils.SettingsManager) {
      try {
        const settings = await window.utils.SettingsManager.getSettings({
          showItemStats: true
        });
        
        if (!settings.showItemStats) {
          // 아이템 스카우터가 OFF면 처리하지 않음
          return;
        }
      } catch (error) {
        // Extension context invalidated 오류를 포함한 모든 오류 처리
        if (error.message && error.message.includes('Extension context invalidated')) {
          console.warn('확장 프로그램 컨텍스트가 무효화되었습니다. 기본 설정을 사용합니다.');
          // 기본 설정으로 계속 진행
        } else {
          console.warn('아이템 스카우터 설정 확인 실패:', error);
          return;
        }
      }
    } else if (!this.settings.showItemStats) {
      return;
    }
    
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      this.modules.processor.processItemStats();
    } catch (error) {
      console.error('아이템 스탯 처리 중 오류:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // 아이템 스탯 제거
  removeItemStats() {
    try {
      this.modules.processor.removeItemStats();
      this.modules.dynamicObserver.destroy();
      this.modules.popoverObserver.destroy();
      
  
    } catch (error) {
      console.error('ItemStatsManager 정리 중 오류:', error);
    }
  }

  // 상태 확인 메서드들
  isProcessingStats() {
    return this.isProcessing;
  }

  // DOM 기반 계산이므로 희귀 아이템 데이터 불필요
  getRareItemsData() {
    return [];
  }
}

export default ItemStatsManager; 
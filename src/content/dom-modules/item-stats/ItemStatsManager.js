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
      
      console.log('ItemStatsManager 초기화 완료');
    } catch (error) {
      console.error('ItemStatsManager 초기화 중 오류:', error);
    }
  }

  // 아이템 스탯 처리
  processItemStats() {
    if (!this.settings.showItemStats) {
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
      
      console.log('ItemStatsManager 정리 완료');
    } catch (error) {
      console.error('ItemStatsManager 정리 중 오류:', error);
    }
  }

  // 상태 확인 메서드들
  isProcessingStats() {
    return this.isProcessing;
  }

  getRareItemsData() {
    return this.modules.processor.getRareItemsData();
  }
}

export default ItemStatsManager; 
// 아이템 스탯 관리자 (통합 DOM 모듈 사용)
import DOMModulesManager from './dom-modules/DOMModulesManager.js';

// 전역 DOM 모듈 매니저 인스턴스
let domModulesManager = null;

// 초기화 함수
async function initItemStats() {
  if (!domModulesManager) {
    domModulesManager = new DOMModulesManager();
    await domModulesManager.init();
  }
}

// 아이템 스탯 관리자 클래스 (기존 호환성 유지)
class ItemStatsManager {
  constructor() {
    this.isProcessing = false;
  }

  async init() {
    await initItemStats();
  }

  // 아이템 스탯 처리
  processItemStats() {
    if (domModulesManager) {
      domModulesManager.processItemStats();
    }
  }

  // 아이템 스탯 제거
  removeItemStats() {
    if (domModulesManager) {
      domModulesManager.removeItemStats();
    }
  }

  // 상태 확인 메서드들
  isProcessingStats() {
    return domModulesManager ? domModulesManager.isProcessingStats() : false;
  }

  getRareItemsData() {
    return domModulesManager ? domModulesManager.getRareItemsData() : [];
  }
}

// ES6 모듈로 export
export default ItemStatsManager;
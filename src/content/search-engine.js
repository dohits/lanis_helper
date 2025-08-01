// 검색 엔진 (통합 DOM 모듈 사용)
import DOMModulesManager from './dom-modules/DOMModulesManager.js';

// 전역 DOM 모듈 매니저 인스턴스
let domModulesManager = null;

// 초기화 함수
async function initSearchEngine() {
  if (!domModulesManager) {
    domModulesManager = new DOMModulesManager();
    await domModulesManager.init();
  }
}

// 검색 엔진 클래스 (기존 호환성 유지)
class SearchEngine {
  constructor() {
    // 기존 호환성을 위한 빈 생성자
  }

  async init() {
    await initSearchEngine();
  }

  // 희귀 아이템 데이터 수집
  async collectRareItems() {
    if (domModulesManager) {
      return await domModulesManager.collectRareItems();
    }
    return { success: false, message: 'DOM 모듈 매니저가 초기화되지 않았습니다.' };
  }

  // 희귀 아이템 데이터 가져오기
  getRareItemsData() {
    return domModulesManager ? domModulesManager.getRareItemsData() : [];
  }

  // 유틸리티 메서드 (기존 호환성 유지)
  sleep(ms) {
    return domModulesManager ? domModulesManager.sleep(ms) : new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ES6 모듈로 export
export default SearchEngine; 
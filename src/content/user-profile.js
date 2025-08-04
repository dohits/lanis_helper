// 사용자 프로필 관리자 (통합 DOM 모듈 사용)
import DOMModulesManager from './dom-modules/DOMModulesManager.js';

// 전역 DOM 모듈 매니저 인스턴스
let domModulesManager = null;

// 초기화 함수
async function initUserProfile() {
  if (!domModulesManager) {
    domModulesManager = new DOMModulesManager();
    await domModulesManager.init();
  }
}

// 사용자 프로필 관리자 클래스 (기존 호환성 유지)
class UserProfileManager {
  constructor() {
    this.isProcessing = false;
  }

  async init() {
    await initUserProfile();
  }

  async processUserNames() {
    if (domModulesManager) {
      await domModulesManager.processUserNames();
    }
  }

  removeUserNames() {
    if (domModulesManager) {
      domModulesManager.removeUserNames();
    }
  }

  processDynamicContent() {
    if (domModulesManager) {
      domModulesManager.processDynamicContent();
    }
  }

  isProcessingProfiles() {
    return domModulesManager ? domModulesManager.isProcessingProfiles() : false;
  }

  getProcessedCount() {
    return domModulesManager ? domModulesManager.getProcessedCount() : 0;
  }
}

// ES6 모듈로 export
export default UserProfileManager; 
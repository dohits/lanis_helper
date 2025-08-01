// 사용자 프로필 관련 기능 (분리된 구조)
import UserNavigationManager from './dom-modules/user-navigation/UserNavigationManager.js';
import ProfileEnhancementManager from './dom-modules/profile-enhancement/ProfileEnhancementManager.js';

// 기존 코드와의 호환성을 위한 통합 래퍼
class UserProfileManagerWrapper {
  constructor() {
    this.navigationManager = new UserNavigationManager();
    this.enhancementManager = new ProfileEnhancementManager();
  }

  init() {
    // 두 매니저 모두 초기화
    this.navigationManager.init();
    this.enhancementManager.init();
  }

  processUserNames() {
    // 사용자 네비게이션 기능 처리
    this.navigationManager.processUserNames();
  }

  processProfileEnhancement() {
    // 프로필 강화 기능 처리
    this.enhancementManager.processProfileEnhancement();
  }

  removeUserNames() {
    // 두 매니저 모두 정리
    this.navigationManager.destroy();
    this.enhancementManager.destroy();
  }

  processDynamicContent() {
    // 두 기능 모두 처리
    this.navigationManager.processUserNames();
    this.enhancementManager.processProfileEnhancement();
  }

  isProcessingProfiles() {
    return this.navigationManager.isProcessingProfiles() || 
           this.enhancementManager.isProcessingEnhancement();
  }

  getProcessedCount() {
    return this.navigationManager.getProcessedCount();
  }
}

// ES6 모듈로 export (기존 코드와의 호환성 유지)
export default UserProfileManagerWrapper; 
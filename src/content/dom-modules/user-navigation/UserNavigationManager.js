// 사용자 네비게이션 관리자 (사용자명 클릭 기능)
import UsernameClickHandler from './UsernameClickHandler.js';
import DynamicContentObserver from './DynamicContentObserver.js';

class UserNavigationManager {
  constructor() {
    this.isProcessing = false;
    this.modules = {
      usernameHandler: new UsernameClickHandler(),
      dynamicObserver: new DynamicContentObserver()
    };
  }

  init() {
    try {
      // 각 모듈 초기화
      this.modules.usernameHandler.init();
      this.modules.dynamicObserver.init(this);
      
      console.log('UserNavigationManager 초기화 완료');
    } catch (error) {
      console.error('UserNavigationManager 초기화 중 오류:', error);
    }
  }

  processUserNames() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // 사용자명 클릭 기능만 처리
      this.modules.usernameHandler.process();

    } catch (error) {
      console.error('사용자 네비게이션 처리 중 오류:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  destroy() {
    try {
      // 각 모듈 정리
      this.modules.usernameHandler.destroy();
      this.modules.dynamicObserver.destroy();
      
      console.log('UserNavigationManager 정리 완료');
    } catch (error) {
      console.error('UserNavigationManager 정리 중 오류:', error);
    }
  }

  isProcessingProfiles() {
    return this.isProcessing;
  }

  getProcessedCount() {
    return this.modules.usernameHandler.getProcessedCount();
  }
}

export default UserNavigationManager; 